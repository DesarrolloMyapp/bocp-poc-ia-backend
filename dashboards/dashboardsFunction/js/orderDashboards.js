const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.orderDashboards = async (event) => {
    const params = event.body;
    const option = params.option;
    const date = params.date;
    const corporation = params.corporation;
    const query = `
            Set @option = ?;
            Set @date = ?;
            Set @corporation = ?;
	    	Call ordersDashboards(@option, @date, @corporation);
	    `;
    return await transaction(query, option,date,corporation);
};

async function transaction(query, option,date,corporation) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query,[option,date,corporation]);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}