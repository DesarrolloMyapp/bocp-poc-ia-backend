const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.orderEANDasboard = async (event) => {
    const params = event.body;
    // const option = params.option;
    // const date = params.date;
    let corporation = params.corporation;
    let dateInit = params.dateInit;
    let date = params.date;
    let option = params.option;

    if (dateInit == undefined) {
        dateInit = 'NOW()';
        date = 'NOW()';
        option = 'all';
    }
    if (date == undefined) {
        date = 'NOW()';
        option = 'date';
    }
    const query = `
            Set @dateInit = ?;
            Set @date = ?;
            Set @corporation = ?;
            Set @option = ?;
	    	Call orderEANDasboard(@dateInit, @date, @corporation, @option);
	    `;
    return await transaction(query,dateInit,date, corporation,option);
};

async function transaction(query, dateInit,date, corporation,option) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query,[dateInit,date, corporation,option]);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}