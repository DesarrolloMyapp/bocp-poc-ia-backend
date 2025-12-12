const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');


module.exports.userGetOneCognito = async (event) => {
    console.log(event);
    const userCognito = event.path.cognito;
    const query = `
            Set @userCognito = ?;
	    	Call userGetOneCognito(@userCognito);
	    `;

    return await transaction(query, userCognito);
};

async function transaction(query, userCognito) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, userCognito);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}