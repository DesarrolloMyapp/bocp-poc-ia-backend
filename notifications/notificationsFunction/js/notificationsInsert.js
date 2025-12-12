const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.notificationsInsert = async (event) => {
    console.log(event);
    const params = event.body;

    let insert;

    insert = `INSERT INTO notifications (
        notificationUserTokenPush,
        notificationUserUuidCreate,
        notificationUserUuidReceived,
        notificationMessage,
        notificationDateCreate,
        notificationOrderResponseId,
        notificationOrderShippingId
    ) VALUES (
        '` + params.notificationUserTokenPush + `',
        '` + params.notificationUserUuidCreate + `',
        '` + params.notificationUserUuidReceived + `',
        '` + params.notificationMessage + `',
        NOW(),
        ` + params.notificationOrderResponseId + `,
        ` + params.notificationOrderShippingId + `
        );`;

    insert = replaceAll(insert, '\n        ', '');
    insert = replaceAll(insert, '\n    ', '');


    // return insert;
    return await transaction(insert, params);
};

async function transaction(query, params) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        await connection.beginTransaction();

        let queryResult = await connection.query(query);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult, userCode: queryResult[0].insertId }));
        await connection.commit();
        await connection.end();
        return results;


    } catch (err) {
        await connection.rollback();
        await connection.end();
        return Promise.reject(err);
    }
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}
