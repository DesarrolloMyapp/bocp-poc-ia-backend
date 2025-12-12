const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.userInsert = async (event) => {
    console.log(event);
    const params = event.body;

    let insert;
    if (params.userAuth0 == undefined) {
        params.userAuth0 = null;
    }
    if (params.userPhone == undefined) {
        params.userPhone = null;
    }

    insert = `INSERT INTO user (
        userCorporationCode,
        userName,
        userEmail,
        userPhone,
        userPassword,
        userRole,
        userCognitoCode,
        userAuthFirstName,
        userAuthLastName,
        userAuthOwnerShipData,
        userAuthSiebelId,
        userAuth0,
        userStatus,
        userCreationDate,
        userCreationUser,
        userUpdateDate,
        userUpdateUser
    ) VALUES (
        ` + params.userCorporationCode + `,
        '` + params.userName + `',
        '` + params.userEmail + `',
        '` + params.userPhone + `',
        '` + params.userPassword + `',
        '` + params.userRole + `',
        '` + params.userCognitoCode + `',
        '` + params.userAuthFirstName + `',
        '` + params.userAuthLastName + `',
        '` + params.userAuthOwnerShipData + `',
        '` + params.userAuthSiebelId + `',
        '` + params.userAuth0 + `',
        ` + params.userStatus + `,
        NOW(),
        ` + params.userCreationUser + `,
        NOW(),
        ` + params.userUpdateUser + `
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
        SELECT * 
        FROM user 
        WHERE userEmail = '` + params.userEmail + `'
        AND userCorporationCode = ` + params.userCorporationCode + ` 
        AND IFNULL(userDeleted,0) = 0;`;

        let queryDeletedUser = `
        DELETE FROM userTemporary WHERE userEmail = '` + params.userEmail + `'
        AND userCode > 0;
        `

        let queryValidationResult = await connection.query(queryValidation);
        if (queryValidationResult[0].length === 0) {
            let queryResult = await connection.query(query);
            //const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult, userCode: queryResult[0].insertId }));
            if(queryResult[0].insertId>0){
                let queryDeleted = await connection.query(queryDeletedUser);
                const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryDeleted, userCode: queryResult[0].insertId }));
            } else {
                const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult, userCode: queryResult[0] }));
            }
            await connection.commit();
            await connection.end();
            return results;
        } else {
            throw new Error('Correo ' + params.userEmail + ' ya ingresado');
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
