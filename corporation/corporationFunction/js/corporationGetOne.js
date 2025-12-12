const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.corporationGetOne = async (event) => {

    const corporationCode = event.path.one;

    const query = `
            Set @corporationCode = ?;
	    	Call corporationGetOne(@corporationCode);
	    `;
    return await transaction(query, corporationCode);
};

async function transaction(query, corporationCode) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, corporationCode);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}