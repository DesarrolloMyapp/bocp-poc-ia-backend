const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.userTemporaryGetAllCorporation = async (event) => {
    const corporation = event.path.corporation;
    const query = `
            Set @corporation = ?;
	    	Call userTemporaryGetAllCorporation(@corporation);
	    `;
    return await transaction(query,corporation);
};

async function transaction(query,corporation) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query,corporation);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}