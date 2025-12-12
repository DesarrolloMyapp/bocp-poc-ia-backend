const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');
 
module.exports.productUpdateACL = async (event) => {
    const params = event.body;
    return await transaction(params);
}

async function transaction(params) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        await connection.beginTransaction();
        const queryPromises = [];

        if(params.productACL.length>0){
            params.productACL.forEach(async (element) => {
                let update;

                update = `UPDATE productACL SET productStatus = `+element.productStatus+`, productUserUpdate = '`+element.productUserUpdate+`', productDateUpdate = NOW() WHERE  productACLCode = `+element.productACLCode+`;`;
    
                const queryResult =  await connection.query(update);
                queryPromises.push(queryResult);
            });
        }
    

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

