const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.corporationGetSubdomain = async (event) => {

    const corporationSubdomain = event.path.subdomain;

    const query = `
            Set @corporationSubdomain = ?;
	    	Call corporationGetSubdomain(@corporationSubdomain);
	    `;
    return await transaction(query, corporationSubdomain);
};

async function transaction(query, corporationSubdomain) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, corporationSubdomain);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}