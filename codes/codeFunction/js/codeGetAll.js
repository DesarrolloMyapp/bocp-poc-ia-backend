const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.codeGetAll = async (event) => {

    const codeList = event.path.one;

    const query = `
            Set @codeList = ?;
	    	Call codesGetAll(@codeList);
	    `;
    return await transaction(query, codeList);
};

async function transaction(query, codeList) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, codeList);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}