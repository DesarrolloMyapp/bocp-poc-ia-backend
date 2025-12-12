const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');


module.exports.userConfirmationApp = async (event) => {
    console.log(event);
    const params = event.body;
    const userCode = params.userCode;
    const userUpdate=params.userUpdate;
    const userRole = params.userRole;
    const query = `
            Set @userCode = ?;
            Set @userUpdate = ?;
            Set @userRole = ?;
	    	Call userConfirmationApp(@userCode, @userUpdate, @userRole);
	    `;

    return await transaction(query, userCode,userUpdate, userRole);
};

async function transaction(query, userCode,userUpdate, userRole) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, [userCode,userUpdate, userRole]);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}