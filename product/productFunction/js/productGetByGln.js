const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');
 
module.exports.productGetByGln = async (event) => {
    const productGln = event.path.gln;

    const jwt = event.headers.Authorization;
    const partes = jwt.split('.');
    const header = partes[0];
    const payload = partes[1];

    const headerDecodificado = atob(header);
    const payloadDecodificado = atob(payload);

    const headerJSON = JSON.parse(headerDecodificado);
    const payloadJSON = JSON.parse(payloadDecodificado);
    const userCode = payloadJSON.sub

    const query = `
        Set @productGln = ?;
        Set @userCode = ?;
        Call productGetByGln(@productGln, @userCode);
    `;
    return await transaction(query, productGln, userCode);
}

async function transaction(query, productGln, userCode){
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query, [productGln, userCode]);
        const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryResult[0] }));
        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}