const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.locationsGetByGLN = async (event) => {
    console.log(event);
    const gln = event.path.gln;

    const query = `
            Set @gln = ?;
	    	Call locationsGetByGLN(@gln);
	    `;
    return await transaction(query, gln);
};

async function transaction(query, gln) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, gln);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}