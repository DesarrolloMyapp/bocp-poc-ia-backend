const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');
 
module.exports.productUpdate = async (event) => {
    const params = event.body;
    let query;

    query = `UPDATE product SET productEan = '`+params.productEan+`', productDun14 = '`+params.productDun14+`', productNetContent = '`+params.productNetContent+`', productUM = '`+params.productUM+`', productPiecesPerPackage = `+params.productPiecesPerPackage+`, productDescription = "`+params.productDescription+`", productSku = '`+params.productSku+`', productStatus = `+params.productStatus+`, productUserUpdate = '`+params.productUserUpdate+`', productDateUpdate = NOW(), productGPC = '`+params.productGPC+`', productGPCDescription = '`+params.productGPCDescription+`' WHERE productCode = `+params.productCode+`;`;

    return await transaction(query);
}

async function transaction(query) {
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