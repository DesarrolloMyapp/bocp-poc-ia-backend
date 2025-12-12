const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.productGetPriceListByGtin = async (event) => {
    
    const productCode = event.path.one;

    const query = `
        Set @productCode = ?;
        Call productGetPriceListByGtin(@productCode);
    `; 

    return await transaction(query, productCode);
}

async function transaction(query, productCode){
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, productCode);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}