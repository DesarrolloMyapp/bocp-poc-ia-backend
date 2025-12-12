const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.userRegistrationValidation = async (event) => {
    console.log(event);
    const params = event.body;

    let insert;

    insert = `INSERT INTO userTemporary (
        userCorporationCode,
        userName,
        userEmail,
        userCognitoCode,
        userAuthFirstName,
        userAuthLastName,
        userAuthOwnerShipData,
        userAuthSiebelId,
        userStatus,
        userCreationDate,
        userUpdateDate
    ) VALUES (
        '` + params.userCorporationCode + `',
        '` + params.userName + `',
        '` + params.userEmail + `',
        '` + params.userCognitoCode + `',
        '` + params.userAuthFirstName + `',
        '` + params.userAuthLastName + `',
        '` + params.userAuthOwnerShipData + `',
        '` + params.userAuthSiebelId + `',
        ` + params.userStatus + `,
        NOW(),
        NOW()
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
        let queryValidation = `
        SELECT u.userEmail 
        FROM user AS u
        WHERE u.userEmail = '` + params.userEmail + `'
        AND IFNULL(u.userDeleted,0) = 0
        UNION 
        SELECT ut.userEmail 
        FROM userTemporary AS ut
        WHERE ut.userEmail = '` + params.userEmail + `'
        AND IFNULL(ut.userDeleted,0) = 0;`;

        let queryValidationResult = await connection.query(queryValidation);
        if (queryValidationResult[0].length === 0) {
            let queryResult = await connection.query(query);
            const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult, userCode: queryResult[0].insertId }));
            await connection.commit();
            await connection.end();
            return results;
        } else {
            throw new Error('success');
        }
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
