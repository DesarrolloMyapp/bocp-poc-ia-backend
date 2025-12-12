const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.userGetGLN = async (event) => {
    console.log(event);
    const userCorporationCode = event.path.gln;
    var query = `
            Set @userCorporationCode = ?;
	    	Call userGetGLN(@userCorporationCode);
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