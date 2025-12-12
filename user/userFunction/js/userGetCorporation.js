const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.userGetCorporation = async (event) => {
    console.log(event);
    const userCorporationCode = event.path.corporation;
    var query = `
            Set @userCorporationCode = ?;
	    	Call userGetCorporation(@userCorporationCode);
	    `;

    return await transaction(query, userCorporationCode);
};

async function transaction(query, userCorporationCode) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, userCorporationCode);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}