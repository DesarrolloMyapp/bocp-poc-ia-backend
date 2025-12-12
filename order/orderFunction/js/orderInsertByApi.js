const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');
const orderEancomFormat = require('./orderEancomFormat');
const orderXmlFormat = require('./orderXmlFormat');
const orderJsonFormat = require('./orderJsonFormat');
const userSendNotification = require('../../../user/userFunction/js/userSendNotification');
const axios = require('axios');


module.exports.orderInsertByApi = async (event) => {
    const jwt = event.headers.Authorization;
    const params = event.body;
    console.log(jwt);
    const partes = jwt.split('.');
    const header = partes[0];
    const payload = partes[1];
    const firma = partes[2];

    const headerDecodificado = atob(header);
    const payloadDecodificado = atob(payload);

    const headerJSON = JSON.parse(headerDecodificado);
    const payloadJSON = JSON.parse(payloadDecodificado);
    const userCode = payloadJSON.sub

    let getUser;
    getUser = `Call userValidationApi('` + userCode + `', 'sender');`;

    switch (params.formatType) {
        case 'JSON':
            const orderjson = await orderJsonFormat.getJson(params);
            // const orderjson = await orderJsonFormat.valideOrderMessage(params);
            // if (Array.isArray(orderjson)) {
            //     return orderjson;
            // } else if (typeof orderjson == 'object') {
            //     return await transaction(orderjson, getUser, params.formatType);
            // } else {
            //     return 'Error al obtener orden';
            // }
            if(orderjson.result){
                return await transaction(orderjson, getUser, params.formatType);
            } else {
                return orderjson;
            }
            break;
        case 'XML':
            const orderxml = await orderXmlFormat.getXML(params);
            // if (Array.isArray(orderxml)) {
            //     return orderxml;
            // } else if (typeof orderxml == 'object') {
            //     return await transaction(orderxml, getUser, params.formatType);
            // } else {
            //     return 'Error al obtener orden.'
            // }
             if(orderxml.result){
                return await transaction(orderxml, getUser, params.formatType);
            } else {
                return orderxml;
            }
            break;
        case 'EDI':
            const orderedi = await orderEancomFormat.getEdi(params.order);
            if (typeof orderedi == 'object') {
                return await transaction(orderedi, getUser, params.formatType);
            } else {
                return 'Error al obtener orden.'
            }
            break
        default:
            return JSON.stringify({ statusCode: 406, message: 'Formato no válido.' });
            break;
    }

}

async function transaction(data, getUser, formatType) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        await connection.beginTransaction();
        const queryPromises = [];
        const resultOrder = [];
        let user;
        let idLocation;
        let messageOrder = '';

        let queryResult = await connection.query(getUser);
        queryPromises.push(queryResult[0][0]);

        queryResult[0][0].forEach(element => {
            user = element;
        })
        console.log("user", user)

        let queryGetOrder = `Call orderGetOneByOrderNumber('` + data.orderNumber + `', ` + user.userCorporationCode + `, '`+data.orderBuyerGLN+`');`;
        let resultGetOrder = await connection.query(queryGetOrder);
        console.log('resultGetOrder', resultGetOrder)

        let queryGetLocation = `Call locationsGetByGlnLocation('` + data.orderLocationGln + `');`;
        let resultQueryGetLocation = await connection.query(queryGetLocation);

        if (resultQueryGetLocation[0][0].length <= 0) {
            let queryInsertLocation = await insertLocation(data, queryResult[0][0][0]);
            idLocation = queryInsertLocation.idLocations;
        } else {
            idLocation = resultQueryGetLocation[0][0][0].idLocations;
        }

        let queryGetCodeList = `Call orderGetCodeList('` + user.userCognitoCode + `', '` + data.orderProviderCode + `')`;
        let resultQueryGetCodeList = await connection.query(queryGetCodeList);

        const resultCodeListValidation = await codeListValidation(resultQueryGetCodeList, data, formatType);
        console.log('result validacion', resultCodeListValidation)
        if (resultGetOrder[0][0].length > 0) {
            resultOrder.push({ orderNumber: 'El número de orden ' + data.orderNumber + ' ya existe.' });
        }
        if (resultCodeListValidation[0].orderLine.length > 0) {
            resultOrder.push({ errorCodeList: resultCodeListValidation });
        }

        if (resultGetOrder[0][0].length > 0 || resultCodeListValidation[0].orderLine.length > 0) {
            messageOrder = 'Se han encontrado errores.';
        }

        if (queryResult[0].length > 0 && resultGetOrder[0][0].length <= 0 && resultCodeListValidation[0].orderLine.length <= 0) {

            const params = data;
            console.log('orden a insertar', params);
            let insert;
            const localTime = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });


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
                    orderEmissionName,
                    orderEmbarkTo,
                    orderDate,
                    orderDateEmbark,
                    orderDeliveryTerm,
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
                    orderControlID,
                    orderInstructionDescription,
                    orderType,
                    orderSellerAddressInformation,
                    orderSellerCommunicationValue,
                    orderSellerTradeItemProduct,
                    orderPartyIdentification,
                    orderDateCancelation
                ) VALUES (
                    ` + user.userCorporationCode + `,
                    '` + params.orderNumber + `',
                    '` + params.orderProviderCode + `',
                    '` + params.orderInternalProviderCode + `',
                    '` + params.orderProviderName + `',
                    '` + params.orderBillToOrderGLN + `',
                    '` + params.orderBillTo + `',
                    '` + params.orderBillToTradeName + `',
                    '` + params.orderTradeName + `',
                    '` + params.orderEmissionName + `',
                    '` + idLocation + `',
                    '` + params.orderDate + `',
                    '` + params.orderDateEmbark + `',
                    '` + params.orderDeliveryTerm + `',
                    '` + params.orderTypeID + `',
                    '` + params.orderTotalItems + `',
                    '` + params.orderTotalUnits + `',
                    '` + params.orderTotalAmount + `',
                    '` + user.userEmail + `',
                    '` + user.userEmail + `',
                    NOW(),
                    '` + params.orderDateCreate + `',
                    '` + params.orderCommunicationChannel + `',
                    '` + params.orderCommunicationValue + `',
                    '` + params.orderDocumentStatusCode + `',
                    '` + params.orderInstruction + `',
                    '` + params.orderCurrencyCode + `',
                    '` + params.orderBuyerGLN + `',
                    '` + params.orderSellerGLN + `',
                    '` + params.orderControlID + `',
                    '` + params.orderInstructionDescription + `',
                    '` + params.orderType + `',
                    '` + params.orderSellerAddressInformation + `',
                    '` + params.orderSellerCommunicationValue + `',
                    '` + params.orderSellerTradeItemProduct + `',
                    '` + params.orderPartyIdentification + `',
                    '` + params.orderDateCancelation + `'
                );`;

            insert = replaceAll(insert, '\n        ', '');
            insert = replaceAll(insert, '\n    ', '');

            const queryResultDetails1 = await connection.query(insert);
            queryPromises.push(queryResultDetails1);
            resultOrder.push({ idOrder: queryResultDetails1[0].insertId, alerts: resultCodeListValidation[0].orderLineAlert });

            if (queryResultDetails1[0].insertId > 0) {
                params.orderDetails.forEach(async (element) => {
                    let insertDetail;

                    // const gtin = filterProducts(element.orderDUN14);
                    // if(gtin !== 14){
                    //     element.orderEAN = element.orderDUN14
                    //     element.orderDUN14 = 0;
                    // }
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
                            ` + queryResultDetails1[0].insertId + `,
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

                    const queryResultDetails = await connection.query(insertDetail);
                    queryPromises.push(queryResultDetails);
                });


                let insertNotification;
                insertNotification = `INSERT INTO notifications (
                        notificationUserTokenPush,
                        notificationUserUuidCreate,
                        notificationUserUuidReceived,
                        notificationMessage,
                        notificationDateCreate,
                        notificationOrderResponseId,
                        notificationOrderShippingId
                    ) VALUES (
                        '',
                        '` + user.userCognitoCode + `',
                        '` + params.orderProviderCode + `',
                        'Tienes una Nueva orden de compra',
                        NOW(),
                        0,
                        ` + queryResultDetails1[0].insertId + `
                        );`;
                const userCorporationCode = params.orderProviderCode;
                var queryuser = `
	    	Call userGetGLN('`+userCorporationCode +`');
	    `;
        console.log(queryuser);
                const queryResultDetails12 = await connection.query(insertNotification);
                const queryResultDetailsUser = await connection.query(queryuser);
                console.log('queryResultDetailsUser',queryResultDetailsUser);
                
                   
                    let userList = [];
                    console.log('queryResultDetailsUser',queryResultDetailsUser)
                    console.log(' queryResultDetailsUser[0]', queryResultDetailsUser[0])
                    console.log(' queryResultDetailsUser[1]', queryResultDetailsUser[1])
                    console.log(' queryResult[0][0]', queryResult[0][0])
                    queryResultDetailsUser[0].forEach(element => {
                        userList.push(element);
                      });
                      console.log('userList',userList)
                      console.log('userList[0]',userList[0])
                      console.log('userList[0][0]',userList[0][0])
                      userList[0].forEach(async (users)=>{
                        console.log('users',users)
                        
                        let order = {
                            orderNumber: params.orderNumber,
                            orderProviderName: params.orderProviderName,
                            msg: 'Has recibido una nueva orden de compra'
                          }
                          let userSend={
                            userEmail:users.userEmail,
                            companyEmail: 'milton.rodriguez@myappsoftware.com',
                            subject: "Nueva orden de compra",
                            text:"Tienes una Nueva orden de compra",
                            order: order
                          }
                          let paramsSend = {};
                          paramsSend.body = userSend;
                          console.log(paramsSend);

                          const send = userSendNotification.userSendNotification(paramsSend);
                          console.log(send);


                          


                      });
                  
                  
            }

        }

        const results = await Promise.resolve({ statusCode: 200, result: true, message: messageOrder, records: resultOrder });
        await connection.commit();
        await connection.end();
        return results;
    } catch (err) {
        await connection.rollback();
        await connection.end();
        return Promise.reject(err + '');
    }
}

async function insertLocation(params, user) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        await connection.beginTransaction();

        let insert;
        insert = `INSERT INTO locations (
            glnCompany,
            glnLocation,
            locationAdress,
            locationReference,
            locationStreet,
            locationColony,
            locationMunicipality,
            locationPostalCode,
            locationState,
            locationLatitude,
            locationLongitude,
            locationUserCreate,
            locationUserUpdate,
            locationDateCreate,
            locationDateUpdate
        ) VALUES (
            ` + user.userAuthOwnerShipData + `,
            '` + params.orderLocationGln + `',
            '` + params.locationPartyName + `',
            '',
            '` + params.locationStreetAddressOne + `',
            '` + params.locationCityName + `',
            '` + params.locationProvinceIdentity + `',
            '` + params.locationPostalCode + `',
            '` + params.locationState + `',
            '` + params.locationLatitude + `',
            '` + params.locationLongitude + `',
            '` + user.userEmail + `',
            '` + user.userEmail + `',
            NOW(),
            NOW()
            );`;

        const queryResult = await connection.query(insert);
        console.log('result insert location', queryResult)
        const results = await Promise.resolve({ idLocations: queryResult[0].insertId });
        await connection.commit();
        await connection.end();
        return results;
    } catch (err) {
        await connection.rollback();
        await connection.end();
        return Promise.reject(err + '');
    }
}

async function codeListValidation(codeList, order, formatType) {
    const errors = [];
    console.log('codeList', codeList);
    console.log('order', order);

    const codeList1 = codeList[0][0].filter(code => code.codeValue === order.orderDocumentStatusCode.trim());
    if (!codeList1.length) {
        errors.push({
            message: 'Código inválido',
            value: order.orderDocumentStatusCode
        });
    }

    if (formatType == 'EDI') {
        const codeList2 = codeList[0][7].filter(code => code.codeValue === order.orderCommunicationChannel.trim());
        if (!codeList2.length) {
            errors.push({
                message: 'Código inválido',
                value: order.orderCommunicationChannel
            });
        }
    } else {
        const codeList2 = codeList[0][1].filter(code => code.codeValue === order.orderCommunicationChannel.trim());
        if (!codeList2.length) {
            errors.push({
                message: 'Código inválido',
                value: order.orderCommunicationChannel
            });
        }
    }

    const codeList3 = codeList[0][6].filter(code => code.currencyAbbreviation === order.orderCurrencyCode.trim());
    if (!codeList3.length) {
        errors.push({
            message: 'Código inválido',
            value: order.orderCurrencyCode
        });
    }

    if (order.orderDetails.length != order.orderTotalItems) {
        errors.push({
            message: 'Total de partidas calculado incorrectamente.',
            value: order.orderTotalItems,
            description: 'Partidas calculadas: ' + order.orderDetails.length
        });
    }

    const totalUnits = order.orderDetails.reduce((sum, value) => (sum + value['orderQuantity']), 0);
    if (order.orderTotalUnits != totalUnits) {
        errors.push({
            message: 'Total de unidades calculado incorrectamente.',
            value: order.orderTotalUnits,
            description: 'Unidades calculadas: ' + totalUnits
        });
    }

    // let totalAmount = 0;
    // order.orderDetails.forEach((detail) => {
    //     const quantity = parseFloat(detail.orderQuantity);
    //     const price = parseFloat(detail.orderPrice);
    //     const discount = parseFloat(detail.orderDiscount);
    //     const resultAmount = parseFloat((quantity * price) - ((quantity * price) * (discount / 100))).toFixed(2);
    //     totalAmount = totalAmount + parseFloat(resultAmount);
    // });
    // if (parseFloat(order.orderTotalAmount.trim()).toFixed(2) != parseFloat(totalAmount).toFixed(2)) {
    //     errors.push({
    //         message: 'Total importe calculado incorrectamente.',
    //         value: order.orderTotalAmount,
    //         description: 'Importe calculado: ' + totalAmount,
    //     });
    // }

    const orderItemsCodes = new Set();
    order.orderDetails.forEach((detail) => {
        console.log('detail', detail);
        const errorsItems = [];
        const alertItems = [];

        // const gtin = filterProducts(detail.orderDUN14);
        // let codeList4;
        // if(gtin === 14){
            // codeList4 = codeList[0][4].filter(code => code.productDun14 === detail.orderDUN14.trim());
        // } else {
        let orderEAN = detail.orderEAN.trim();
        if(orderEAN.length != 14){
            orderEAN = orderEAN.padStart(14, '0');
            detail.orderEAN = orderEAN.padStart(14, '0');
        } 
        const codeList4 = codeList[0][4].filter(code => code.productEan === orderEAN);
        // }

        if (!codeList4.length) {
            alertItems.push({
                message: 'Atención: El GTIN ingresado todavía no ha sido dado de alta.',
                value: detail.orderDUN14,
                orderline: detail.orderItemCode
            });
        }

        // const codeList5 = codeList[0][2].filter(code => code.codeValue === detail.orderUM.trim());
        // if (!codeList5.length) {
        //     errorsItems.push({
        //         message: 'Código inválido',
        //         value: detail.orderUM,
        //         orderline: detail.orderItemCode
        //     });
        // }

        // const codeList6 = codeList[0][4].filter(code => code.productEan === detail.orderDUN14.trim());
        // if (!codeList6.length) {
        //     errorsItems.push({
        //         message: 'GTIN no autorizado',
        //         value: detail.orderDUN14,
        //         orderline: detail.orderItemCode
        //     });
        // }

        // const quantity = parseFloat(detail.orderQuantity);
        // const price = parseFloat(detail.orderPrice);
        // const discount = parseFloat(detail.orderDiscount);
        // const amount = parseFloat(detail.orderAmount).toFixed(2);
        // const resultAmount = parseFloat((quantity * price) - ((quantity * price) * (discount / 100))).toFixed(2);
        // if (amount != resultAmount) {
        //     errorsItems.push({
        //         message: 'Total importe partida calculado incorrectamente.',
        //         value: detail.orderAmount,
        //         description: '',
        //         orderline: detail.orderItemCode
        //     });
        // }

        if (orderItemsCodes.has(detail.orderItemCode)) {
            errorsItems.push({
                message: 'Número de partida duplicado.',
                value: detail.orderItemCode,
                // description: 'El número de partida ',
                orderline: detail.orderItemCode
            });
        }
        orderItemsCodes.add(detail.orderItemCode);

        // if (errorsItems.length || alertItems.length) {
            errors.push({ orderLine: errorsItems, orderLineAlert: alertItems });
        // }
    });

    return errors;
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

function filterProducts(gtin){
    let value = gtin.toString();
    let count = 0;
    let int = false;
    
    for (let i = 0; i < value.length; i++) {
        const number = value.charAt(i);
        if (number !== '0') {
            int = true;
        }
        if (int) {
            count++;
        }
    }
    console.log('all')
    return count;
}

