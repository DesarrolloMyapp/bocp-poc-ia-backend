const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.orderGetAllByCompany = async (event) => {

    const orderCode = event.path.corporation;

    const query = `
            Set @orderCode = ?;
	    	Call orderGetAllByCompany(@orderCode);
	    `;
    return await transaction(query, orderCode);
};

async function transaction(query, orderCode) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, orderCode);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}