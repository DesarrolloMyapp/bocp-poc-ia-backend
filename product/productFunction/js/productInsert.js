const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');
 
module.exports.productInsert = async (event) => {
    const params = event.body;
    return await transaction(params);
}

async function transaction(params) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        await connection.beginTransaction();
        const queryPromises = [];

        if(params.products.length>0){
            params.products.forEach(async (element) => {
                let insert = "";
    
                insert = `INSERT INTO product (
                    productEan, 
                    productDun14, 
                    productDescription, 
                    productUM, 
                    productGln, 
                    productNetContent, 
                    productPartyName, 
                    productPiecesPerPackage, 
                    productPrice, 
                    productSku, 
                    productStatus,
                    productCorporationCode, 
                    productUserCreate, 
                    productUserUpdate,
                    productBrandName,
                    productGPC,
                    productGPCDescription,
                    productLastChangedDate,
                    productIsDataQuality
                ) VALUES (
                    '` + element.productEan + `', 
                    '` + element.productDun14 + `', 
                    "` + element.productDescription + `", 
                    '` + element.productUM + `', 
                    '` + element.productGln + `', 
                    '` + element.productNetContent + `', 
                    '` + element.productPartyName + `', 
                    ` + element.productPiecesPerPackage + `, 
                    '` + element.productPrice + `', 
                    '` + element.productSku + `', 
                    ` + element.productStatus + `, 
                    ` + element.productCorporationCode + `, 
                    '` + element.productUserCreate + `', 
                    '` + element.productUserUpdate + `',
                    "` + element.productBrandName + `",
                    '` + element.productGPC + `',
                    "` + element.productGPCDescription + `",
                    '` + element.productLastChangedDate + `',
                    ` + element.productIsDataQuality + `
                ) ON DUPLICATE KEY UPDATE 
                    productDescription = "` + element.productDescription + `", 
                    productUM = '` + element.productUM + `', 
                    productNetContent = '` + element.productNetContent + `', 
                    productPiecesPerPackage = ` + element.productPiecesPerPackage + `,
                    productBrandName = "` + element.productBrandName + `",
                    productGPC = '` + element.productGPC + `',
                    productGPCDescription = "` + element.productGPCDescription + `",
                    productLastChangedDate = '` + element.productLastChangedDate + `',
                    productIsDataQuality = ` + element.productIsDataQuality + `
                ;`;

                insert = replaceAll(insert, '\n        ', '');
                insert = replaceAll(insert, '\n    ', '');

                const queryResult =  await connection.query(insert);
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

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}
