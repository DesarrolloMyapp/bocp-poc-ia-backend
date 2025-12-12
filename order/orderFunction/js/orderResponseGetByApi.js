const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');
const orderEancomFormat = require('./orderEancomFormat');
const orderXmlFormat= require('./orderXmlFormat');
const orderJsonFormat = require('./orderJsonFormat');
const buffer = require('buffer').Buffer;

module.exports.orderResponseGetByApi = async (event) => {
    console.log(event);
    const params = event.body;
    const jwt = event.headers.Authorization;
    console.log(jwt);
    const partes = jwt.split('.');
    const header = partes[0];
    const payload = partes[1];
    const firma = partes[2];

    const headerDecodificado = atob(header);
    const payloadDecodificado = atob(payload);

    const headerJSON = JSON.parse(headerDecodificado);
    const payloadJSON = JSON.parse(payloadDecodificado);
    const userCode = payloadJSON.sub
    console.log(headerJSON)
    console.log(payloadJSON)

    let query;

    query = `Call orderResponseGetByUser('`+userCode+`', '`+params.glnBuyer+`', '`+params.startDate+`', '`+params.endDate+`', '`+params.orderNumber+`', '`+params.formatType+`', '`+params.status+`');`;

    query = replaceAll(query, '\n        ', '');
    query = replaceAll(query, '\n    ', '');

    let resultStatus = await validateStatus(params.status);
    
    if(resultStatus == 1){
        return await transaction(query, params, jwt,payloadJSON);
    } else {
        return  {
            statusCode: 200,
            body: { result: false, message: 'Valor atributo status inválido.', records: [] },
        };
    }

    // return query;
    // return await transaction(query, params, jwt,payloadJSON);
};

async function transaction(query, params, jwt,payloadJSON) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        await connection.beginTransaction();
        const queryPromises = [];

        let queryResult = await connection.query(query);
        queryPromises.push(queryResult[0]);
        console.log('queryResult', queryResult[0])
        const formatType = params.formatType;
        const resultFormat = [];

        const orders = queryResult[0][0];
        const orderDetails = queryResult[0][1]; 

        for(var x in orders){
            const order = [];
            const orderDetail = orderDetails.filter(item => item.orderCode == orders[x].orderCode);
            order.push([orders[x]]);
            order.push([orderDetail]);
            switch(formatType){ 
                case 'JSON':
                    const orderJson = await orderJsonFormat.createFormatOrdResponse(order);
                    //const orderJsonToBase64 = Buffer.from(orderJson).toString('base64');
                    resultFormat.push(JSON.parse(orderJson));
                    break;
                case 'XML':
                    const orderXML = await orderXmlFormat.createFormatOrdResponse(order);
                    //const orderXmlToBase64 = Buffer.from(orderXML).toString('base64');
                    resultFormat.push(orderXML);
                    break;
                case 'EDI':
                    const orderEdi = await orderEancomFormat.createFormatOrdResponse(order);
                    //const orderEdiToBase64 = Buffer.from(orderEdi).toString('base64');
                    resultFormat.push(orderEdi);
                    break;
                default:
                    resultFormat.push({ err: 'Formato no especificado.'})
                    break;
            }
        }

        const results = await Promise.resolve({ statusCode: 200, result: true, message: '', records: resultFormat });
        await connection.commit();
        await connection.end();
        return results;
    } catch (err) {
        await connection.rollback();
        await connection.end();
        return Promise.reject(err + '' + query);
    }
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

function validateStatus(status) {
    let result = 0;
    const allowedStatus = ['ACCEPTED', 'MODIFIED', 'REJECTED'];
    status = (status != null && status != undefined) ? status : "";

    if(status.length>0){
        if (!allowedStatus.includes(status)) {
            result = 0;
        } else {
            result = 1;
        }
    } else {
        result = 1;
    }
    
    return result;
}