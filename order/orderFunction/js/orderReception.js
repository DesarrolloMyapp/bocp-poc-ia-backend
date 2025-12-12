const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');
const orderJsonFormat = require('./orderJsonFormat');
const orderXmlFormat = require('./orderXmlFormat');
const orderEancomFormat = require('./orderEancomFormat');

module.exports.orderReception = async (event) => {

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

    const orderJson = await orderJsonFormat.createFormat(queryResult);
    console.log('orderJson', orderJson);

    const orderXML = await orderXmlFormat.createFormat(orderJson);
    console.log('orderXml', orderXML);

    const orderEdi = await orderEancomFormat.createFormat(queryResult);
    console.log('ordEdi', orderEdi);

    // const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
    const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', recordsXML: orderXML, recordsJson: orderJson, recordsEdi: orderEdi  }));
    await connection.end();
    return results;
  } catch (err) {
    await connection.end();
    return Promise.reject(err);
  }
}
