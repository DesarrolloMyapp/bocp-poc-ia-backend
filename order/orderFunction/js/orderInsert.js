const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.orderInsert = async (event) => {
    console.log(event);
    const params = event.body;
    let insert;

    insert = `INSERT INTO orderShipping (
        orderCorporationCode,
        orderNumber,
        orderProviderCode,
        orderInternalProviderCode,
        orderProviderName,
        orderBillToOrderGLN,
        orderBillTo,
        orderBillToTradeName,
        orderTradeName,
        orderEmbarkTo,
        orderControlID,
        orderDate,
        orderDateEmbark,
        orderDeliveryTerm,
        orderEmissionName,
        orderType,
        orderTypeID,
        orderTotalItems,
        orderTotalUnits,
        orderTotalAmount,
        orderUserCreate,
        orderUserUpdate,
        orderDateUpdate,
        orderDateCreate,
        orderCommunicationChannel,
        orderCommunicationValue,
        orderDocumentStatusCode,
        orderInstruction,
        orderCurrencyCode,
        orderBuyerGLN,
        orderSellerGLN,
        orderInstructionDescription,
        orderSellerAddressInformation,
        orderSellerCommunicationValue,
        orderSellerTradeItemProduct,
        orderPartyIdentification,
        orderDateCancelation
    ) VALUES (
        ` + params.orderCorporationCode+ `,
        '` + params.orderNumber+ `',
        '` + params.orderProviderCode+ `',
        '` + params.orderInternalProviderCode+ `',
        '` + params.orderProviderName+ `',
        '` + params.orderBillToOrderGLN+ `',
        '` + params.orderBillTo+ `',
        '` + params.orderBillToTradeName+ `',
        '` + params.orderTradeName+ `',
        '` + params.orderEmbarkTo+ `',
        '` + params.orderControlID+ `',
        '` + params.orderDate+ `',
        '` + params.orderDateEmbark+ `',
        '` + params.orderDeliveryTerm+ `',
        '` + params.orderEmissionName+ `',
        '` + params.orderType+ `',
        '` + params.orderTypeID+ `',
        '` + params.orderTotalItems+ `',
        '` + params.orderTotalUnits+ `',
        '` + params.orderTotalAmount+ `',
        '` + params.orderUserCreate+ `',
        '` + params.orderUserUpdate+ `',
        NOW(),
        NOW(),
        '` + params.orderCommunicationChannel + `',
        '` + params.orderCommunicationValue + `',
        '` + params.orderDocumentStatusCode + `',
        '` + params.orderInstruction + `',
        '` + params.orderCurrencyCode + `',
        '` + params.orderBuyerGLN + `',
        '` + params.orderSellerGLN + `',
        '` + params.orderInstructionDescription + `',
        '` + params.orderSellerAddressInformation + `',
        '` + params.orderSellerCommunicationValue + `',
        '` + params.orderSellerTradeItemProduct + `',
        '` + params.orderPartyIdentification + `',
        '` + params.orderDateCancelation + `'
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
        const queryPromises = [];
        let queryValidation = `
        SELECT * 
        FROM orderShipping 
        WHERE (orderCorporationCode = '` + params.orderCorporationCode + `' 
        AND orderNumber = '` + params.orderNumber + `') 
        AND IFNULL(orderDeleted,0) = 0;`;

        let queryValidationResult = await connection.query(queryValidation);
        if (queryValidationResult[0].length === 0) {


            let queryResult = await connection.query(query);
        queryPromises.push(queryResult[0]);

            if(queryResult[0].insertId>0){
                params.orderDetails.forEach(async (element) => {
                    let insertDetail;
                    insertDetail = `INSERT INTO orderShippingDetail (
                        orderCode,
                        orderItemCode,
                        orderEAN,
                        orderOrderClientCode,
                        orderOrderClientCodeIntern,
                        orderDUN14,
                        orderDescription,
                        orderUM,
                        orderQuantity,
                        orderPiecesPerPackage,
                        orderDiscount,
                        orderPrice,
                        orderAmount,
                        orderNetContent,
                        orderUMNetContent,
                        orderCost,
                        orderTaxRateAmount,
                        orderImportAmount,
                        orderDiscountInvoice
                    ) VALUES (
                        ` + queryResult[0].insertId + `,
                        ` + element.orderItemCode + `,
                        '` + element.orderEAN + `',
                        '` + element.orderOrderClientCode + `',
                        '` + element.orderOrderClientCodeIntern + `',
                        '` + element.orderDUN14 + `',
                        "` + element.orderDescription + `",
                        '` + element.orderUM + `',
                        '` + element.orderQuantity + `',
                        '` + element.orderPiecesPerPackage + `',
                        '` + element.orderDiscount + `',
                        '` + element.orderPrice + `',
                        '` + element.orderAmount + `',
                        '` + element.orderNetContent + `',
                        '` + element.orderUMNetContent + `',
                        '` + element.orderCost + `',
                        '` + element.orderTaxRateAmount + `',
                        '` + element.orderImportAmount + `',
                        '` + element.orderDiscountInvoice + `'
                    );`;
                    insertDetail = replaceAll(insertDetail, '\n        ', '');
                    insertDetail = replaceAll(insertDetail, '\n    ', '');

                    const queryResultDetails =  await connection.query(insertDetail);
                    queryPromises.push(queryResultDetails);
                });
            }    
            const results = await Promise.resolve(JSON.stringify({ statusCode: 200, result: true, message: '', records: queryPromises }));
            await connection.commit();
            await connection.end();
            return results;


        }else{
            throw new Error('Número de orden ya ingresada');
        }

        
    } catch (err) {
        await connection.rollback();
        await connection.end();
        return Promise.reject(err );
    }
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}
