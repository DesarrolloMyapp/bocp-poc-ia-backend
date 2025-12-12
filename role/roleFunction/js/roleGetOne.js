const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.roleGetOne = async (event) => {
    console.log(event);
    const bankCode = event.path.one;

    const query = `
            Set @bankCode = ?;
	    	Call roleGetTemplate(@bankCode);
	    `;
    return await transaction(query, bankCode);
};

async function transaction(query, bankCode) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, bankCode);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}