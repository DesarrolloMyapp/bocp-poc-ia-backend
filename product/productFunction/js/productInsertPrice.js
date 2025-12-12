const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');
 
module.exports.productInsertPrice = async (event) => {
    const params = event.body;
    return await transaction(params);
}

async function transaction(params) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        await connection.beginTransaction();
        const queryPromises = [];

            let insert = "";

            insert = `INSERT INTO productPriceList (
                productCode, 
                productPrice, 
                productCurrency, 
                productUserCreate, 
                productUserUpdate, 
                productDateCreate, 
                productDateUpdate
            ) VALUES (
                ` + params.productCode + `, 
                '` + params.productPrice + `', 
                '` + params.productCurrency + `', 
                '` + params.productUserCreate + `', 
                '` + params.productUserUpdate + `', 
                NOW(),
                NOW()
            );`;

            insert = replaceAll(insert, '\n        ', '');
            insert = replaceAll(insert, '\n    ', '');

            const queryResult =  await connection.query(insert);
            queryPromises.push(queryResult);

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
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}
