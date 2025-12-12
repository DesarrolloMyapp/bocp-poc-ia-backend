const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.productGetByACL = async (event) => {
    
    const glnSeller = event.path.glnSeller;
    const glnBuyer = event.path.glnBuyer;

    const query = `
        Set @glnSeller = ?;
        Set @glnBuyer = ?;
        Call productGetByACL(@glnSeller, @glnBuyer);
    `; 

    return await transaction(query, glnSeller, glnBuyer);
}

async function transaction(query, glnSeller, glnBuyer){
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, [glnSeller, glnBuyer]);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}