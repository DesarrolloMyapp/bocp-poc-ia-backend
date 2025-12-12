const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');
const uuid = require('uuid');

module.exports.rolAdd = async (event) => {
    console.log(event);
    const params = event.body;
    return await transaction(params);
};

async function transaction(params) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        await connection.beginTransaction();
        const queryPromises = [];
        let query = "";

        query = `
        Call roleInsert('`+params.roleName+`',`+params.roleId+`,`+params.roleStatus+`,`+params.roleCorporationCode+`);`;

        let queryResult = await connection.query(query);
        queryPromises.push(queryResult[0]);
        
        
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryPromises }));
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
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}