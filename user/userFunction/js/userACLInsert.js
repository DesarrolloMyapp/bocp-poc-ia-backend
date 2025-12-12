const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.userACLInsert = async (event) => {
    console.log(event);
    const params = event.body;




    // return insert;
    return await transaction( params);
};

async function transaction( paramsItem) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        await connection.beginTransaction();

        let queryDeletedUser = `
        DELETE FROM userACL WHERE userGLNPermission = '` + paramsItem.userGLNPermission + `'
       ;
        `
        let queryDeleted = await connection.query(queryDeletedUser);
        let queryResult;
       
        paramsItem.list.forEach(async (params) => {
            if (params.userACLTradeName == undefined) {
                params.userACLTradeName ="";
            }
            let insert;

            insert = `INSERT INTO userACL (
        userGLN,
        userGLNPermission,
        userACLOrderProviderName,
        userACLOrderInternalProviderCode,
        userACLRFCF,
        userACLBillTo,
        userACLTradeName,
        userEmission,
        userReception,
        userCreatePermission,
        userDatePermission
    ) VALUES (
        ` + params.userGLN + `,
        '` + params.userGLNPermission + `',
        '` + params.userACLOrderProviderName + `',
        '` + params.userACLOrderInternalProviderCode + `',
        '` + params.userACLRFCF + `',
        '` + params.userACLBillTo + `',
        '` + params.userACLTradeName + `',
        '` + params.userEmission + `',
        '` + params.userReception + `',
        '` + params.userCreatePermission + `',
        NOW()
    );`;

            insert = replaceAll(insert, '\n        ', '');
            insert = replaceAll(insert, '\n    ', '');
            queryResult = await connection.query(insert);
        });



        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult }));

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
