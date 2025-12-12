const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.corporationInsert = async (event) => {
    console.log(event);
    const params = event.body;

    let insert;

    insert = `INSERT INTO corporation (
        corporationGLN,
        corporationName,
        corporationTradeName,
        corporationSiebelId,
        corporationCreationUser,
        corporationCreationDate,
        corporationUpdateUser,
        corporationUpdateDate
    ) VALUES (
        '` + params.corporationGLN + `',
        '` + params.corporationName + `',
        '` + params.corporationTradeName + `',
        '` + params.corporationSiebelId + `',
        '` + params.corporationCreationUser + `',
        NOW(),
        '` + params.corporationCreationUser + `',
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
        SELECT * 
        FROM corporation 
        WHERE corporationGLN = '` + params.corporationGLN + `' 
        AND IFNULL(corporationDeleted,0) = 0;`;

        let queryValidationResult = await connection.query(queryValidation);
        if (queryValidationResult[0].length === 0) {
            let queryResult = await connection.query(query);
            const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult, userCode: queryResult[0].insertId }));
            await connection.commit();
            await connection.end();
            return results;
        } else {
            const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryValidationResult[0], userCode: 0 }));
            await connection.commit();
            await connection.end();
            return results;
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
