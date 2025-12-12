const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.notificationsGetUser = async (event) => {

    const userCognitoCode = event.path.one;

    const query = `
            Set @userCognitoCode = ?;
	    	Call notificationsGetUser(@userCognitoCode);
	    `;
    return await transaction(query, userCognitoCode);
};

async function transaction(query, userCognitoCode) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, userCognitoCode);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}