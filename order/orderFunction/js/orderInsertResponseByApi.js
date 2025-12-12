const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');
const orderEancomFormat = require('./orderEancomFormat');
const orderXmlFormat= require('./orderXmlFormat');
const orderJsonFormat = require('./orderJsonFormat');

module.exports.orderInsertResponseByApi = async (event) => {
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

    getUser = `Call userValidationApi('`+userCode+`', 'sender');`;

    switch(params.formatType){
        case 'JSON':
            const orderjson = await orderJsonFormat.getJsonOrdResponse(params.orderResponse);
            if(Array.isArray(orderjson)){
                return orderjson;
            } else if(typeof orderjson == 'object'){
                return await transaction(orderjson, getUser, params.formatType);
            } else {
                return 'Error al obtener orden.'
            }
            break;
        case 'XML':
            const orderxml = await orderXmlFormat.getXmlOrdResponse(params.orderResponse);
            if(Array.isArray(orderxml)){
                return orderxml;
            } else if(typeof orderxml == 'object'){
                return await transaction(orderxml, getUser, params.formatType);
            } else {
                return 'Error al obtener orden.'
            }
            break;
        case 'EDI':
            const orderedi = await orderEancomFormat.getEdiOrdResponse(params.orderResponse);
            if(typeof orderedi == 'object'){
                return await transaction(orderedi, getUser, params.formatType);
            } else {
                return 'Error al obtener orden.'
            }
            break
        default:
            return JSON.stringify({ statusCode: 406, message: 'Formato no valido.' });
            break;
    }

}

async function transaction(data, getUser, formatType) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        await connection.beginTransaction();
        const queryPromises = [];
        const resultOrder = [];
        let messageOrder = '';

        let queryResult = await connection.query(getUser);
        queryPromises.push(queryResult[0][0]);

        let user;
        queryResult[0][0].forEach(element=>{ 
            user = element;
        })
        console.log("user",user)

        let queryGetOrder = `Call orderGetOneByOrderNumber('`+data.orderNumber+`', `+user.userCorporationCode+`, '`+data.orderBuyerGLN+`');`;
        let resultGetOrder = await connection.query(queryGetOrder);
        console.log('get order one', resultGetOrder[0][0]);


        let queryGetCodeList = `Call orderGetCodeList('`+user.userCognitoCode+`', '`+data.orderProviderCode+`')`;
        let resultQueryGetCodeList = await connection.query(queryGetCodeList);

        const resultCodeListValidation = await codeListValidation(resultQueryGetCodeList, data, resultGetOrder[0][1], formatType);

        if(resultGetOrder[0][0].length<=0){
            resultOrder.push({ orderResponse: 'El número de orden '+data.orderNumber+' que se responde no existe.'});
        }
        if(resultGetOrder[0][2].length>0){
            resultOrder.push({ orderResponse: 'El número de orden '+data.orderNumber+' ya cuenta con una respuesta.'});
        }
        if(resultCodeListValidation.length>0){
            resultOrder.push({ errorCodeList: resultCodeListValidation});
        }

        if(resultGetOrder[0][0].length<=0 || resultGetOrder[0][2].length>0 || resultCodeListValidation.length>0){
            messageOrder = 'Se han encontrado errores.';
        }

            if(queryResult[0].length>0 && resultGetOrder[0][0].length>0 && resultGetOrder[0][2].length<=0 && resultCodeListValidation.length<=0){

                const params = data;
                console.log('orden a insertar', params)
                let insert;
                insert = `INSERT INTO orderShippingResponse (
                    orderCorporationCode,
                    orderCode,
                    orderRevisionNumber,
                    orderStatusCode,
                    orderDeliveryStartPeriod,
                    orderDeliveryEndPeriod,
                    orderProviderCode,
                    orderInternalProviderCode,
                    orderProviderName,
                    orderBuyerGLN,
                    orderSellerGLN,
                    orderCommunicationChannel,
                    orderCommunicationValue,
                    orderUserCreate,
                    orderUserUpdate
                ) VALUES (
                    ` + user.userCorporationCode + `,
                    ` + resultGetOrder[0][0][0].orderCode + `,
                    '` + params.orderRevisionNumber + `',
                    '` + params.orderStatusCode + `',
                    '` + params.orderDeliveryStartPeriod + `',
                    '` + params.orderDeliveryEndPeriod + `',
                    '` + params.orderProviderCode + `',
                    '` + params.orderInternalProviderCode + `',
                    '` + params.orderProviderName + `',
                    '` + params.orderBuyerGLN + `',
                    '` + params.orderSellerGLN + `',
                    '` + params.orderCommunicationChannel + `',
                    '` + params.orderCommunicationValue + `',
                    '` + user.userEmail+ `',
                    '` + user.userEmail+ `'
                );`;
        
                insert = replaceAll(insert, '\n        ', '');
                insert = replaceAll(insert, '\n    ', '');
        
                const queryResultDetails1 =  await connection.query(insert);
                queryPromises.push(queryResultDetails1);
                resultOrder.push({ idOrderResponse: queryResultDetails1[0].insertId });

                if(params.orderStatusCode === 'ACCEPTED'){
                    if(queryResultDetails1[0].insertId>0  && resultGetOrder[0][1].length > 0){
                        const details = resultGetOrder[0][1];
                        details.forEach(async (element) => {
                            let insertDetail;
                            insertDetail = `INSERT INTO orderShippingResponseDetail (
                                orderShippingResponseCode,
                                orderItemCode,
                                orderConfirmedDeliveryDate,
                                orderConfirmedQuantity,
                                orderMeasurementUnitCode,
                                orderConfirmedPrice,
                                orderConfirmedAmount,
                                orderConfirmedDiscount,
                                orderResponseStatusCode,
                                orderReasonStatus
                            ) VALUES (
                                ` + queryResultDetails1[0].insertId + `,
                                ` + element.orderItemCode + `,
                                '` + params.orderDeliveryEndPeriod + `',
                                ` + element.orderQuantity + `,
                                '` + element.orderUM + `',
                                '` + element.orderPrice + `',
                                '` + element.orderAmount + `',
                                '` + element.orderDiscount + `',
                                '` + params.orderStatusCode + `',
                                ''
                            );`;
                            insertDetail = replaceAll(insertDetail, '\n        ', '');
                            insertDetail = replaceAll(insertDetail, '\n    ', '');

                            const queryResultDetails =  await connection.query(insertDetail);
                            queryPromises.push(queryResultDetails);
                        }); 
                    }
                } else {
                    if(queryResultDetails1[0].insertId>0 && params.orderDetails.length>0){       
                        params.orderDetails.forEach(async (element) => {
                            let insertDetail;
                            insertDetail = `INSERT INTO orderShippingResponseDetail (
                                orderShippingResponseCode,
                                orderItemCode,
                                orderConfirmedDeliveryDate,
                                orderConfirmedQuantity,
                                orderMeasurementUnitCode,
                                orderConfirmedPrice,
                                orderConfirmedAmount,
                                orderConfirmedDiscount,
                                orderResponseStatusCode,
                                orderReasonStatus
                            ) VALUES (
                                ` + queryResultDetails1[0].insertId + `,
                                ` + element.orderItemCode + `,
                                '` + element.orderConfirmedDeliveryDate + `',
                                ` + element.orderConfirmedQuantity + `,
                                '` + element.orderMeasurementUnitCode + `',
                                '` + element.orderConfirmedPrice + `',
                                '` + element.orderConfirmedAmount + `',
                                '` + element.orderConfirmedDiscount + `',
                                '` + element.orderResponseStatusCode + `',
                                '` + element.orderReasonStatus + `'
                            );`;
                            insertDetail = replaceAll(insertDetail, '\n        ', '');
                            insertDetail = replaceAll(insertDetail, '\n    ', '');

                            const queryResultDetails =  await connection.query(insertDetail);
                            queryPromises.push(queryResultDetails);
                        });
                    }
                }


                
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
                    '` + params.orderBuyerGLN + `',
                    'Tienes una respuesta de tu orden de compra!',
                    NOW(),
                    ` + queryResultDetails1[0].insertId + `,
                    0
                    );`;

                    const queryResultDetails12 =  await connection.query(insertNotification);


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


async function codeListValidation(codeList, orderResponse, items, formatType){
    const errors = [];
    console.log('codeList', codeList);
    console.log('orderResponse', orderResponse);

    const codeList1 = codeList[0][5].filter(code => code.codeValue === orderResponse.orderStatusCode.trim());
    if(!codeList1.length){
        errors.push({ 
            message: 'Código inválido',
            value: orderResponse.orderStatusCode
        });
    }

    if(formatType == 'EDI'){
        const codeList2 = codeList[0][7].filter(code => code.codeValue === orderResponse.orderCommunicationChannel.trim());
        if(!codeList2.length){
            errors.push({ 
                message: 'Código inválido',
                value: orderResponse.orderCommunicationChannel
            });
        }
    } else {
        const codeList2 = codeList[0][1].filter(code => code.codeValue === orderResponse.orderCommunicationChannel.trim());
        if(!codeList2.length){
            errors.push({ 
                message: 'Código inválido',
                value: orderResponse.orderCommunicationChannel
            });
        }
    }

    if(orderResponse.orderDetails.length && (orderResponse.orderStatusCode.trim() === 'MODIFIED' || orderResponse.orderStatusCode.trim() === 'REJECTED')){
        orderResponse.orderDetails.forEach((detail) => {
            console.log('detail', detail);
            const errorsItems = [];

            const codeList3 = codeList[0][2].filter(code => code.codeValue === detail.orderMeasurementUnitCode.trim());
            if(!codeList3.length){
                errorsItems.push({ 
                    message: 'Código inválido',
                    value: detail.orderMeasurementUnitCode,
                    orderline: detail.orderItemCode
                });
            }

            const codeList4 = codeList[0][5].filter(code => code.codeValue === detail.orderResponseStatusCode.trim());
            if(!codeList4.length){
                errorsItems.push({ 
                    message: 'Código inválido',
                    value: detail.orderResponseStatusCode,
                    orderline: detail.orderItemCode
                });
            }

            if(codeList4.length && (detail.orderResponseStatusCode.trim() === 'ACCEPTED'|| detail.orderResponseStatusCode.trim() === 'MODIFIED' || detail.orderResponseStatusCode.trim() === 'REJECTED')){
                if(detail.orderResponseStatusCode.trim() !== 'ACCEPTED'){
                    if(formatType == 'EDI'){
                        const codeList5 = codeList[0][8].filter(code => code.codeValue === detail.orderReasonStatus.trim());
                        if(!codeList5.length){
                            errorsItems.push({ 
                                message: 'Código Inválido',
                                value: detail.orderReasonStatus,
                                orderline: detail.orderItemCode
                            });
                        }
                    } else {
                        const codeList5 = codeList[0][3].filter(code => code.codeValue === detail.orderReasonStatus.trim());
                        if(!codeList5.length){
                            errorsItems.push({ 
                                message: 'Código Inválido',
                                value: detail.orderReasonStatus,
                                orderline: detail.orderItemCode
                            });
                        }
                    }
                }

                if(detail.orderResponseStatusCode.trim() === 'ACCEPTED'){
                    if(detail.orderReasonStatus.trim() != ''){
                        errorsItems.push({ 
                            message: 'Código Inválido',
                            description: 'El estado de la partida es ACCEPTED, el motivo de respuesta debe venir vacío.',
                            orderline: detail.orderItemCode
                        });
                    }
                }

                let orderEAN = detail.orderDUN14.trim();
                if(orderEAN.length != 14){
                    orderEAN = orderEAN.padStart(14, '0');
                    detail.orderDUN14 = orderEAN.padStart(14, '0');
                } 
            
                const codeList6 = items.filter(item => item.orderEAN === detail.orderDUN14.trim());
                if(!codeList6.length){
                    errorsItems.push({ 
                        message: 'El GTIN de referencia no existe en la orden que se responde.',
                        value: detail.orderDUN14,
                        orderline: detail.orderItemCode
                    });
                }

                const codeList7 = items.filter(item => item.orderEAN === detail.orderDUN14.trim() && item.orderItemCode === detail.orderItemCode);
                if(codeList6.length && !codeList7.length){
                    errorsItems.push({ 
                        message: 'El número de partida de referencia no pertenece al GTIN que se responde.',
                        value: detail.orderItemCode,
                        orderline: detail.orderItemCode
                    });
                }

                const confirmed_q = parseFloat(detail.orderConfirmedQuantity);
                const confirmed_p = parseFloat(detail.orderConfirmedPrice);
                const confirmed_a = parseFloat(detail.orderConfirmedAmount).toFixed(2);
                const confirmed_d = parseFloat(detail.orderConfirmedDiscount);
                const resultAmount = parseFloat((confirmed_q*confirmed_p)-((confirmed_q*confirmed_p)*(confirmed_d/100))).toFixed(2);
                if(confirmed_a!=resultAmount){
                    errorsItems.push({ 
                        message: 'Total importe partida calculado incorrectamente.',
                        value: detail.orderConfirmedAmount,
                        description: 'Importe calculado: ' + resultAmount,
                        orderline: detail.orderItemCode
                    }); 
                }

                if(orderResponse.orderStatusCode.trim() === 'REJECTED' && (detail.orderResponseStatusCode.trim() === 'MODIFIED' || detail.orderResponseStatusCode.trim() === 'ACCEPTED')){
                    errorsItems.push({ 
                        message: 'Código Inválido',
                        value: detail.orderResponseStatusCode,
                        description: 'El estado de la partida debe ser REJECTED',
                        orderline: detail.orderItemCode
                    });
                }

                if(orderResponse.orderStatusCode.trim() === 'MODIFIED' && (detail.orderResponseStatusCode.trim() === 'REJECTED' || detail.orderResponseStatusCode.trim() === 'ACCEPTED')){
                    
                    const codeList8 = items.filter(item => item.orderDUN14 === detail.orderDUN14.trim() && item.orderItemCode === detail.orderItemCode);
                    const item = codeList8[0];
                    if(codeList8.length){
                        if(item.orderDUN14 !== detail.orderDUN14.trim() || 
                           item.orderUM !== detail.orderMeasurementUnitCode.trim() || 
                           item.orderQuantity !== detail.orderConfirmedQuantity || 
                           item.orderPrice !== detail.orderConfirmedPrice || 
                           item.orderAmount !== detail.orderConfirmedAmount
                        ){
                            errorsItems.push({ 
                                message: 'Es estado de la partida es '+detail.orderResponseStatusCode.trim()+', no debe enviarse con datos modificados.',
                                description: 'Verificar datos: GTIN, Unidad de Medida, Cantidad Confirmada, Precio, Importe Confirmado,',
                                orderline: detail.orderItemCode
                            });
                        }
                        
                    }
                }
            } 

            if(errorsItems.length){
                errors.push({ orderResponseLine: errorsItems});
            }
        });
    }

    return errors;
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}
