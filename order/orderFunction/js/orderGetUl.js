const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');
const xmlbuilderjs = require('xmlbuilder');

module.exports.orderGetUl = async (event) => {

    const orderCode = event.path.one;

    const query = `
            Set @orderCode = ?;
	    	Call orderGetReception(@orderCode);
	    `;
    return await transaction(query, orderCode);
};

async function transaction(query, orderCode) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, orderCode);

        // const order = {
        //     "StandardBusinessDocumentHeader": {
        //         "HeaderVersion": 1,
        //         "Sender": {
        //             "Identifier": "",
        //             "ContactInformation": {
        //                 "personName": queryResult[0][3][0].personName,
        //                 "communicationChannelCode": queryResult[0][3][0].communicationChannelCode,
        //                 "communicationValue": queryResult[0][3][0].communicationValue,
        //                 "ContactTypeIdentifier": "Buyer"
        //             }
        //         },
        //         "Receiver": {
        //             "Identifier": "",
        //             "ContactInformation": {
        //                 "personName": queryResult[0][1][0].organisationName,
        //                 "ContactTypeIdentifier": "Seller"
        //             }
        //         },
        //         "DocumentIdentification": {
        //             "Standard": "GS1",
        //             "TypeVersion": "1",
        //             "CreationDateAndTime": queryResult[0][1][0].creationDateTime
        //         }
        //     },
        //     "documentStatusCode": "ORIGINAL",
        //     "orderIdentification": queryResult[0][1][0],
        //     "order": queryResult[0][2],
            
        // };


        const orderUl = {
            "ORDERS05": {
                "IDOC": {
                    "EDI_DC40": queryResult[0][4][0],
                    "E1EDP01": queryResult[0][5][0]
                    
                }
            }
        }

        const orderXML = await convertToJson(orderUl);


        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: orderXML }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}


async function convertToJson(jsonInput) {
    try {

      let xmlOutput = ' <root> ' + await jsonToXml(jsonInput) + ' </root>';

      return xmlOutput;
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }


async function jsonToXml(json, parentKey)  {
    let xml = '';

    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        const prop = parentKey ? `${key}` : key;
        if (typeof json[key] == 'object') {
          xml += `<${prop}>${ await jsonToXml(json[key], prop)}</${prop}>`;
        } else {
          xml += `<${prop}>${json[key]}</${prop}>`;
        }
      }
    }

    return await xml;
  }