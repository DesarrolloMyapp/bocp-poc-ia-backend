const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.orderUpdateStatusReview = async (event) => {

    const orderCode = event.path.orderCode;
    const method = event.path.method;

    const query = `
            Set @method = ?;
            Set @orderCode = ?;
	    	Call orderUpdateStatusReview(@method, @orderCode);
	    `;
    return await transaction(query, orderCode, method);
};

async function transaction(query, orderCode, method) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, [method, orderCode]);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}