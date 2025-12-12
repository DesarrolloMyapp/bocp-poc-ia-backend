const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.userACLGetListGLN = async (event) => {
    console.log(event);
    const userGLN = event.path.gln;
    const type = event.path.type;
    var query = `
            Set @userGLN = ?;
            Set @type = ?;
	    	Call userACLGetListGLN(@userGLN, @type);
	    `;

    return await transaction(query, userGLN, type);
};

async function transaction(query, userGLN, type) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, [userGLN, type]);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}