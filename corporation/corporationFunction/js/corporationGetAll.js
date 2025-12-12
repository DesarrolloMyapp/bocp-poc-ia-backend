const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.corporationGetAll = async (event) => {

    const query = `
	    	Call corporationGetAll();
	    `;
    return await transaction(query);
};

async function transaction(query) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}