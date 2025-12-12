const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.orderInsertResponse = async (event) => {
    const params = event.body;
    let insert;

    insert = `INSERT INTO orderShippingResponse (
        orderCorporationCode,
        orderCode,
        orderRevisionNumber,
        orderStatusCode,
        orderDeliveryStartPeriod,
        orderDeliveryEndPeriod,
        orderProviderCode,
        orderInternalProviderCode,
        orderProviderName,
        orderBuyerGLN,
        orderSellerGLN,
        orderCommunicationChannel,
        orderCommunicationValue,
        orderUserCreate,
        orderUserUpdate
    ) VALUES (
        ` + params.orderCorporationCode + `,
        ` + params.orderCode + `,
        '` + params.orderRevisionNumber + `',
        '` + params.orderStatusCode + `',
        '` + params.orderDeliveryStartPeriod + `',
        '` + params.orderDeliveryEndPeriod + `',
        '` + params.orderProviderCode + `',
        '` + params.orderInternalProviderCode + `',
        '` + params.orderProviderName + `',
        '` + params.orderBuyerGLN + `',
        '` + params.orderSellerGLN + `',
        '` + params.orderCommunicationChannel + `',
        '` + params.orderCommunicationValue + `',
        '` + params.orderUserCreate + `',
        '` + params.orderUserUpdate + `'
    );`;

    insert = replaceAll(insert, '\n        ', '');
    insert = replaceAll(insert, '\n    ', '');

    return await transaction(insert, params);
};

async function transaction(query, params) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        await connection.beginTransaction();
        const queryPromises = [];

        let queryResult = await connection.query(query);
        queryPromises.push(queryResult[0]);

        if(queryResult[0].insertId>0){
            params.orderDetails.forEach(async (element) => {
                let insertDetail;
                insertDetail = `INSERT INTO orderShippingResponseDetail (
                    orderShippingResponseCode,
                    orderItemCode,
                    orderConfirmedDeliveryDate,
                    orderConfirmedQuantity,
                    orderMeasurementUnitCode,
                    orderConfirmedPrice,
                    orderConfirmedAmount,
                    orderConfirmedDiscount,
                    orderResponseStatusCode,
                    orderReasonStatus
                ) VALUES (
                    ` + queryResult[0].insertId + `,
                    ` + element.orderItemCode + `,
                    '` + element.orderConfirmedDeliveryDate + `',
                    ` + element.orderConfirmedQuantity + `,
                    '` + element.orderMeasurementUnitCode + `',
                    '` + element.orderConfirmedPrice + `',
                    '` + element.orderConfirmedAmount + `',
                    '` + element.orderConfirmedDiscount + `',
                    '` + element.orderResponseStatusCode + `',
                    '` + element.orderReasonStatus + `'
                );`;
                insertDetail = replaceAll(insertDetail, '\n        ', '');
                insertDetail = replaceAll(insertDetail, '\n    ', '');

                const queryResultDetails =  await connection.query(insertDetail);
                queryPromises.push(queryResultDetails);
            });
        }
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryPromises }));
        await connection.commit();
        await connection.end();
        return results;
    } catch (err) {
        await connection.rollback();
        await connection.end();
        return Promise.reject(err + ''+query);
    }
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}