const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.roleGetOneElement = async (event) => {
    console.log(event);
    const templateId = event.path.id;
    const bankCode = event.path.one;

    const query = `
            Set @templateId = ?;
            Set @bankCode = ?;
	    	Call roleGetOneElement(@templateId,@bankCode);
	    `;
    return await transaction(query, bankCode,templateId);
};

async function transaction(query, bankCode,templateId) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, [templateId,bankCode]);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}