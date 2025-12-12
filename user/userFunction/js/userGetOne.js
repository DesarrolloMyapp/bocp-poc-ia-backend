const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.userGetOne = async (event) => {
    console.log(event);
    const userCode = event.path.one;
    const query = `
            Set @userCode = ?;
	    	Call userGetOne(@userCode);
	    `;

    return await transaction(query, userCode);
};

async function transaction(query, userCode) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, userCode);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}