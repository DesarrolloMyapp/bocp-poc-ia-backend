const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.notificationsUpdate = async (event) => {
    console.log(event);
    const params = event.body;

    let update;
    let updateSet = "";
    const notificationId = params.notificationId;
    params['notificationDateView'] = 'NOW()';
    Object.keys(params).forEach((item, index, arr) => {
        if (item !== 'notificationId') {
            updateSet = updateSet + item + ` = '` + params[item] + `', `
        }
    });
    if (updateSet.endsWith(", ")) {
        updateSet = updateSet.slice(0, -2);
    }

    update = `UPDATE notifications SET ` + updateSet + ` WHERE notificationId = ` + notificationId + ';';

    // return update;
    return await transaction(update, params);
};

async function transaction(query, params) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        await connection.beginTransaction();
        let queryResult = await connection.query(query);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult }));
        await connection.commit();
        await connection.end();
        return results;
    } catch (err) {
        await connection.rollback();
        await connection.end();
        return Promise.reject(err,query);
    }
}
