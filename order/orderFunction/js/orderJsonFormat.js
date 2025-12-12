const fs = require('fs');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const localize = require('ajv-i18n');

const schema = require('./orderMessage.schema.json');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validate_schema = ajv.compile(schema);

async function createFormat(order) {
    const ord = order[0][0];
    const ordDet = order[1][0];
    try {
        const orderMessage = {
            "Order": {
                "Revisionnumber": ord.orderControlID,
                "Businessdocumentcreationdatetime": dateAndHourFormat(ord.orderDate),
                "Referencedrelatedorderinformation": {
                    "Businessdocumentcreationdatetime": dateAndHourFormat(ord.orderDateCreate)
                },
                "Businessdocumentstatuscode": ord.orderDocumentStatusCode,
                "Businessdocumentstandardversion": "2.0",
                "Orderreceiptacknowledgementrequestindicator": "",
                "Businessdocumentidentificationinformation": {
                    "Entityidentification": ord.orderNumber,
                    "Documentcontentowner": {
                        "GloballocationnumberGLN": ord.userAuthOwnerShipDataSender
                    }
                },
                "Orderinstructiondescription": {
                    "Orderinstructiondescriptioncontent": ord.orderInstruction
                },
                "Deliveryinstructionsdescription": {
                    "Deliveryinstructionsdescriptioncontent": ord.orderInstructionDescription
                },
                "Ordertypecode": {
                    "Ordertypecodecontent": ord.orderType
                },
                "Buyerpartyinformation": {
                    "gln": ord.orderBuyerGLN,
                    "Businesscontactinformation": {
                        "Personname": ord.orderEmissionName,
                        "Communicationinformation": {
                            "Communicationchannelcode":  ord.orderCommunicationChannel,
                            "Communicationchannelidentification": ord.orderCommunicationValue
                        }
                    },
                    "Organisationlegalinformation": {
                        "Organisationname": ord.orderBillToTradeName
                    }
                },
                "Sellerpartyinformation": {
                    "GloballocationnumberGLN": ord.orderSellerGLN,
                    "Additionalpartyidentificationinformation": {
                        "Additionalpartyidentificationcontent": ord.orderInternalProviderCode
                    },
                    "Organisationlegalinformation": {
                        "Organisationname": ord.orderTradeName
                    },
                    "Addressinformation": {
					    "Partyname": ord.orderSellerAddressInformation
                    },
                    "Communicationinformation": {
                        "Communicationchannelidentification": ord.orderSellerCommunicationValue
                    }
                },
                "Billtopartyinformation": {
                    "GloballocationnumberGLN": ord.orderBillToOrderGLN,
                    "Organisationlegalinformation": {
                        "Organisationname": ord.orderBillTo
                    }
                },
                "Requestedtradeiteminformation": {
                    "Tradeitemclassificationinformation": {
                        "Alternativetradeitemproductclassificationcodecontent": ord.orderSellerTradeItemProduct
                    }
                },
                "Orderedtradeitemlogisticalinformation": {
                    "Shiptopartyinformation": {
                        "GloballocationnumberGLN": ord.glnLocation,
                        "Additionalpartyidentificationcontent": ord.orderPartyIdentification,
                        "Addressinformation": {
                            "Cityname": ord.locationColony,
                            "Partyname": ord.locationAdress,
                            "Postalcode": ord.locationPostalCode,
                            "State": ord.locationState,
                            "Streetaddressone": ord.locationStreet,
                            "Provinceidentity": ord.locationMunicipality,
                            "Geographicalcoordinatesinformation": {
                                "Latitude": ord.locationLatitude,
                                "Longitude": ord.locationLongitude
                            }
                        }
                    },
                    "Requesteddeliverydatetimeinformation": {
                        "Requesteddeliverydatetime": {
                            "Date": dateFormat(ord.orderDateEmbark),
                            "Time": hourFormat(ord.orderDateEmbark)
                        },
                        "Requesteddeliverytimeperiod": {
                            "Enddateperiod": dateFormat(ord.orderDateCancelation)
                        }
                    }
                },
                "Paymenttermsinformation": {
                    "Paymenttermsdescription": {
                        "Paymenttermsdescriptioncontent": ord.orderDeliveryTerm,
                    }
                },
                // "Allowancepercentage": {
                //     "Allowancepercentage": ord.orderAllowancePercentage
                // },
                "Totalmonetarynetamount": {
                    "Totalmonetarynetamountcontent": ord.orderTotalAmount,
                    "Currencycode": {
                        "Currencycodecontent": ord.currencyCode
                    }
                },
                "Totalrequestedquantity": {
                    "Totalrequestedquantitycontent": ord.orderTotalUnits
                },                
                "Orderline": []
            }
        };

        for(var x in ordDet) {
            const obj = {
                "Businessdocumentlinenumber": ordDet[x].orderItemCode,
                "Totalrequestedquantity": {
                    "Totalrequestedquantitycontent": ordDet[x].orderQuantity,
                    "Measurementunitcode": ordDet[x].orderUM
                },
                "Tradeitemlistprice": {
                    "Tradeitemlistpricecontent": ordDet[x].orderCost,
                    "Currencycode": {
                        "Currencycodecontent": ord.currencyCode
                    }
                },
                "Tradeitemnetprice": {
                    "Tradeitemnetpricecontent": ordDet[x].orderPrice,
                    "Currencycode": {
                        "Currencycodecontent": ord.currencyCode
                    }
                },
                // "Applicabletaxinformation": {
                //     "Applicabletaxinformation": {
                //         "Taxrate": ordDet[x].orderTaxRateAmount
                //     },
                // },
                "leviedDutyFeeTax": [
                    {
                        "dutyFeeTaxPercentage": ordDet[x].orderTaxRateAmount,
                        "dutyFeeTaxCategoryCode": "IVA"
                    },
                    {
                        "dutyFeeTaxPercentage": ordDet[x].orderImportAmount,
                        "dutyFeeTaxCategoryCode": "IEPS"
                    }
                ],
                "Lineitemnetmonetaryamount": {
                    "Lineitemnetmonetaryamountcontent": ordDet[x].orderAmount,
                    "Currencycode": {
                        "Currencycodecontent": ord.currencyCode
                    }
                },
                "Requestedtradeiteminformation": {
                    "GlobaltradeitemnumberGTIN": ordDet[x].orderEAN,
                    // "Additionaltradeitemidentification": {
                    //     "Additionaltradeitemidentificationcontent": ordDet[x].orderOrderClientCode
                    // },
                    "Additionaltradeitemidentification": [
                        {
                            "Additionaltradeitemidentificationcontent": ordDet[x].orderOrderClientCode,
                            "Additionaltradeitemidentificationtypecodecontent": "SUPPLIER_ASSIGNED"
                        },
                        {
                            "Additionaltradeitemidentificationcontent": ordDet[x].orderOrderClientCodeIntern,
                            "Additionaltradeitemidentificationtypecodecontent": "BUYER_ASSIGNED"
                        }
                    ],
                    "Tradeitemquantity": {
                        "Tradeitemquantitycontent": ordDet[x].orderNetContent,
                        "Measurementunitcode": {
                            "Measurementunitcodecontent": ordDet[x].orderUMNetContent
                        }
                    },
                    "Tradeitemdescription": {
                        "Tradeitemdescriptioncontent": ordDet[x].orderDescription
                    }
                },
                // "Allowanceinformation": {
                //     "Allowancepercentage": ordDet[x].orderDiscount,
                // }
                "allowanceCharge": [
                    {
                        "allowanceChargePercentage": ordDet[x].orderDiscount,
                        "allowanceChargeType": "DI"
                    },
                    {
                        "allowanceChargePercentage": ordDet[x].orderDiscountInvoice,
                        "allowanceChargeType": "TD"
                    }
                ]
            }
            orderMessage.Order.Orderline.push(obj);
        }
        
        console.log('format order', orderMessage)
        return JSON.stringify(orderMessage);
    } catch (err) {
        console.error('Error parsing JSON:', err);
    }
}

async function createFormatOrdResponse(order) {
    const ord = order[0][0];
    const ordDet = order[1][0];
    try {
        const orderResponseMessage = {
            "Orderresponse": {
                "Businessdocumentcreationdatetime": dateAndHourFormat(ord.orderResponseCreationDate),
                "Businessdocumentstandardversion": "2.0",
                "Businessdocumentidentificationinformation": {
                    "Entityidentification": ord.orderRevisionNumber,
                    "Documentcontentowner": {
                        "GloballocationnumberGLN": ord.orderProviderCode,
                        "Additionalpartyidentificationinformation": {
                            "Additionalpartyidentificationcontent": ord.orderInternalProviderCode
                        }
                    }
                },
                "Receivedorderdocumentstatuscode": {
                    "Receivedorderdocumentstatuscodecontent": ord.orderStatusCode,
                },
                "Buyerpartyinformation": {
                    "GloballocationnumberGLN": ord.orderBuyerGLN
                },
                "Sellerpartyinformation": {
                    "GloballocationnumberGLN": ord.orderSellerGLN,
                    "Businesscontactinformation": {
                        "Personname": ord.orderProviderName,
                        "Communicationinformation": {
                            "Communicationchannelcode": ord.orderCommunicationChannel,
                            "Communicationchannelidentification": ord.orderCommunicationValue
                        }
                    }
                },
                "Requestedmodificationofdeliverydateinformation": {
                    "Requesteddeliverytimeperiod": {
                        "Beginperioddate": dateAndHourFormat(ord.orderDeliveryStartPeriod),
                        "Enddateperiod": dateAndHourFormat(ord.orderDeliveryEndPeriod)
                    }
                },
                "Referencedsalesorderdocumentinformation": {
                    "Entityidentification":  ord.orderNumber,
                    "Businessdocumentcreationdatetime":  dateAndHourFormat(ord.orderDate)
                },
                "Orderresponseline": []
            }
        }
        if((ord.orderStatusCode === 'MODIFIED' || ord.orderStatusCode === 'REJECTED') && ordDet.length>0){
            for(var x in ordDet){
                const obj = {
                    "Referencedbusinessdocumentline": ordDet[x].orderItemCode,
                    "Confirmedtradeitemdeliverydatetime": dateAndHourFormat(ordDet[x].orderConfirmedDeliveryDate),
                    "Confirmedquantity": {
                        "Confirmedquantitycontent": ordDet[x].orderConfirmedQuantity,
                        "Measurementunitcode": {
                            "Measurementunitcodecontent": ordDet[x].orderMeasurementUnitCode,
                        }
                    },
                    "Businessdocumentlineresponsecode": {
                        "Businessdocumentlineresponsecodecontent": ordDet[x].orderResponseStatusCode,
                    },
                    "Reasonforstatusofbusinessdocumentcode": {
                        "Reasonforstatusofbusinessdocumentcodecontent": ordDet[x].orderReasonStatus,
                    },
                    "Tradeitemnetprice": {
                        "Tradeitemnetpricecontent": ordDet[x].orderConfirmedPrice,
                        "Currencycodecontent": {
                            "Currencycodecontent": ord.currencyCode
                        }
                    },
                    "Lineitemnetmonetaryamount": {
                        "Lineitemnetmonetaryamountcontent": ordDet[x].orderConfirmedAmount,
                        "Currencycode": {
                            "Currencycodecontent": ord.currencyCode
                        }
                    },
                    "Respondedtradeiteminformation": {
                        "GlobaltradeitemnumberGTIN": ordDet[x].orderEAN,
                    },
                    "Allowanceinformation": {
                        "Allowancepercentage": ordDet[x].orderDiscount,
                    }
                }
                orderResponseMessage.Orderresponse.Orderresponseline.push(obj);
            }
        }

        console.log('format order response', orderResponseMessage)
        return JSON.stringify(orderResponseMessage);
    } catch (err) {
        console.error('Error parsing JSON:', err);
    }
}

async function getJson(params){
    // console.log('getjson', o);

    // const orderBase64 = Buffer.from(order,'base64').toString('utf-8');
    // console.log('decode order', orderBase64);

    // const order = o.Order;
    const order = params.order.Order;

    const resultValidation = await valideOrderMessage(params);
    console.log('resultValidation', resultValidation);

    if(!resultValidation.body.result){
        console.log('entro falso')
        return resultValidation.body
    } else {
        console.log('entro true')
        const newOrder = {
            "orderNumber": order.Businessdocumentidentificationinformation.Entityidentification,
            "orderProviderCode": order.Sellerpartyinformation.GloballocationnumberGLN,
            "orderInternalProviderCode": order.Sellerpartyinformation.Additionalpartyidentificationinformation.Additionalpartyidentificationcontent,
            "orderProviderName": order.Sellerpartyinformation.Organisationlegalinformation.Organisationname,
            "orderTradeName": order.Sellerpartyinformation.Organisationlegalinformation.Organisationname,
            "orderBillToOrderGLN":  order.Billtopartyinformation.GloballocationnumberGLN,
            "orderBillTo": order.Billtopartyinformation.Organisationlegalinformation.Organisationname,
            "orderBillToTradeName": order.Buyerpartyinformation.Organisationlegalinformation.Organisationname,
            "orderEmissionName": order.Buyerpartyinformation.Businesscontactinformation.Personname,
            "orderEmbarkTo": 0,
            "orderControlID": order.Revisionnumber,
            "orderDate": dateAndHourFormat(order.Businessdocumentcreationdatetime),
            "orderDateCreate": dateAndHourFormat(order.Referencedrelatedorderinformation.Businessdocumentcreationdatetime),
            "orderDateEmbark": dateAndHourFormat(order.Orderedtradeitemlogisticalinformation.Requesteddeliverydatetimeinformation.Requesteddeliverydatetime.Date),
            "orderDeliveryTerm": order.Paymenttermsinformation.Paymenttermsdescription.Paymenttermsdescriptioncontent,
            "orderTypeID": 0,
            "orderTotalItems": order.Orderline.length,
            "orderTotalUnits": order.Totalrequestedquantity.Totalrequestedquantitycontent,
            "orderTotalAmount": order.Totalmonetarynetamount.Totalmonetarynetamountcontent,
            "orderCommunicationChannel": order.Buyerpartyinformation.Businesscontactinformation.Communicationinformation.Communicationchannelcode,
            "orderCommunicationValue": order.Buyerpartyinformation.Businesscontactinformation.Communicationinformation.Communicationchannelidentification,
            "orderDocumentStatusCode": order.Businessdocumentstatuscode,
            "orderInstruction": order.Orderinstructiondescription.Orderinstructiondescriptioncontent,
            "orderCurrencyCode": order.Totalmonetarynetamount.Currencycode.Currencycodecontent,
            "orderBuyerGLN": order.Buyerpartyinformation.gln,
            "orderSellerGLN": order.Sellerpartyinformation.GloballocationnumberGLN,
            "orderLocationGln": order.Orderedtradeitemlogisticalinformation.Shiptopartyinformation.GloballocationnumberGLN,
            "locationCityName": order.Orderedtradeitemlogisticalinformation.Shiptopartyinformation.Addressinformation.Cityname,
            "locationPartyName": order.Orderedtradeitemlogisticalinformation.Shiptopartyinformation.Addressinformation.Partyname,
            "locationPostalCode": order.Orderedtradeitemlogisticalinformation.Shiptopartyinformation.Addressinformation.Postalcode,
            "locationState": order.Orderedtradeitemlogisticalinformation.Shiptopartyinformation.Addressinformation.State,
            "locationStreetAddressOne": order.Orderedtradeitemlogisticalinformation.Shiptopartyinformation.Addressinformation.Streetaddressone,
            "locationProvinceIdentity": order.Orderedtradeitemlogisticalinformation.Shiptopartyinformation.Addressinformation.Provinceidentity,
            "locationLatitude": order.Orderedtradeitemlogisticalinformation.Shiptopartyinformation.Addressinformation.Geographicalcoordinatesinformation.Latitude,
            "locationLongitude": order.Orderedtradeitemlogisticalinformation.Shiptopartyinformation.Addressinformation.Geographicalcoordinatesinformation.Longitude,
            "orderInstructionDescription": order.Deliveryinstructionsdescription.Deliveryinstructionsdescriptioncontent,
            "orderType": order.Ordertypecode.Ordertypecodecontent,
            "orderSellerAddressInformation": order.Sellerpartyinformation.Addressinformation.Partyname,
            "orderSellerCommunicationValue": order.Sellerpartyinformation.Communicationinformation.Communicationchannelidentification,
            "orderSellerTradeItemProduct": order.Requestedtradeiteminformation.Tradeitemclassificationinformation.Alternativetradeitemproductclassificationcodecontent,
            "orderPartyIdentification": order.Orderedtradeitemlogisticalinformation.Shiptopartyinformation.Additionalpartyidentificationcontent,
            "orderDateCancelation": order.Orderedtradeitemlogisticalinformation.Requesteddeliverydatetimeinformation.Requesteddeliverytimeperiod.Enddateperiod,
            //"orderAllowancePercentage": order.Allowancepercentage.Allowancepercentage,
            "orderDetails": [],
            "result": true,
        }
        const details = order.Orderline;
        for(var x in details){
            let sku;
            let skuSup;
            if(details[x].Requestedtradeiteminformation.Additionaltradeitemidentification.length>0){
                let skuFilter = details[x].Requestedtradeiteminformation.Additionaltradeitemidentification.find(s => s.Additionaltradeitemidentificationtypecodecontent == 'BUYER_ASSIGNED');
                sku = skuFilter == undefined ? '' : skuFilter.Additionaltradeitemidentificationcontent;

                let skuFilterSup = details[x].Requestedtradeiteminformation.Additionaltradeitemidentification.find(s => s.Additionaltradeitemidentificationtypecodecontent == 'SUPPLIER_ASSIGNED');
                skuSup = skuFilterSup == undefined ? '' : skuFilterSup.Additionaltradeitemidentificationcontent;
            } else {
                sku = '';
                skuSup = '';
            }

            let taxIva;
            let taxIeps;
            if(details[x].leviedDutyFeeTax.length>0){
                let taxIvaFilter = details[x].leviedDutyFeeTax.find(s => s.dutyFeeTaxCategoryCode == 'IVA');
                taxIva = taxIvaFilter == undefined ? '' : taxIvaFilter.dutyFeeTaxPercentage;

                let taxIepsFilter = details[x].leviedDutyFeeTax.find(s => s.dutyFeeTaxCategoryCode == 'IEPS');
                taxIeps = taxIepsFilter == undefined ? '' : taxIepsFilter.dutyFeeTaxPercentage;
            } else {
                taxIva = '';
                taxIeps = '';
            }

            let discount;
            let discountInv;
            if(details[x].allowanceCharge.length>0){
                let discountFilter = details[x].allowanceCharge.find(s => s.allowanceChargeType == 'DI');
                discount = discountFilter == undefined ? '' : discountFilter.allowanceChargePercentage;

                let discountInvFilter = details[x].allowanceCharge.find(s => s.allowanceChargeType == 'TD');
                discountInv = discountInvFilter == undefined ? '' : discountInvFilter.allowanceChargePercentage;
            } else {
                discount = '';
                discountInv = '';
            }

            const obj = {
                "orderItemCode": details[x].Businessdocumentlinenumber,
                "orderEAN": details[x].Requestedtradeiteminformation.GlobaltradeitemnumberGTIN,
                "orderOrderClientCode": skuSup,
                "orderOrderClientCodeIntern": sku,
                "orderDUN14": 0,
                "orderUM": details[x].Totalrequestedquantity.Measurementunitcode,
                "orderDescription": details[x].Requestedtradeiteminformation.Tradeitemdescription.Tradeitemdescriptioncontent,
                "orderQuantity": details[x].Totalrequestedquantity.Totalrequestedquantitycontent,
                "orderDiscount": discount,
                "orderPrice": details[x].Tradeitemnetprice.Tradeitemnetpricecontent,
                "orderAmount": details[x].Lineitemnetmonetaryamount.Lineitemnetmonetaryamountcontent,
                "orderPiecesPerPackage": 0,
                "orderNetContent": details[x].Requestedtradeiteminformation.Tradeitemquantity.Tradeitemquantitycontent,
                "orderUMNetContent": details[x].Requestedtradeiteminformation.Tradeitemquantity.Measurementunitcode.Measurementunitcodecontent,
                "orderCost": details[x].Tradeitemlistprice.Tradeitemlistpricecontent,
                "orderTaxRateAmount": taxIva,
                "orderImportAmount": taxIeps,
                "orderDiscountInvoice": discountInv
            }
            newOrder.orderDetails.push(obj);
        }
        console.log('new order', newOrder);
        return newOrder;
    }
}

async function getJsonOrdResponse(o) {
    console.log('getjson response', o);

    // const orderBase64 = Buffer.from(order,'base64').toString('utf-8');
    // console.log('decode order response', orderBase64);

    const order = o.Orderresponse;

    // const resultValidation = await validateStructureResponse(order);
    // console.log('resultValidationResponse', resultValidation);

    // if(resultValidation.length>0){
    //     return resultValidation;
    // } else {
        const newOrderResponse = {
            "orderCode": 0,
            "orderRevisionNumber": order.Businessdocumentidentificationinformation.Entityidentification,
            "orderStatusCode": order.Receivedorderdocumentstatuscode.Receivedorderdocumentstatuscodecontent,
            "orderDeliveryStartPeriod": dateAndHourFormat(order.Requestedmodificationofdeliverydateinformation.Requesteddeliverytimeperiod.Beginperioddate),
            "orderDeliveryEndPeriod": dateAndHourFormat(order.Requestedmodificationofdeliverydateinformation.Requesteddeliverytimeperiod.Enddateperiod),
            "orderProviderCode": order.Businessdocumentidentificationinformation.Documentcontentowner.GloballocationnumberGLN,
            "orderInternalProviderCode": order.Businessdocumentidentificationinformation.Documentcontentowner.Additionalpartyidentificationinformation.Additionalpartyidentificationcontent,
            "orderProviderName": order.Sellerpartyinformation.Businesscontactinformation.Personname,
            "orderBuyerGLN": order.Buyerpartyinformation.GloballocationnumberGLN,
            "orderSellerGLN": order.Sellerpartyinformation.GloballocationnumberGLN,
            "orderCommunicationChannel": order.Sellerpartyinformation.Businesscontactinformation.Communicationinformation.Communicationchannelcode,
            "orderCommunicationValue": order.Sellerpartyinformation.Businesscontactinformation.Communicationinformation.Communicationchannelidentification,
            "orderNumber": order.Referencedsalesorderdocumentinformation.Entityidentification,
            "orderDetails": [],
        }
        const details = order.Orderresponseline;
        if((order.Receivedorderdocumentstatuscode.Receivedorderdocumentstatuscodecontent === 'MODIFIED' || order.Receivedorderdocumentstatuscode.Receivedorderdocumentstatuscodecontent === 'REJECTED') && details.length>0){
            for(var x in details){
                const obj = {
                    "orderItemCode": details[x].Referencedbusinessdocumentline,
                    "orderDUN14": details[x].Respondedtradeiteminformation.GlobaltradeitemnumberGTIN,
                    "orderConfirmedDeliveryDate": dateAndHourFormat(details[x].Confirmedtradeitemdeliverydatetime),
                    "orderConfirmedQuantity": details[x].Confirmedquantity.Confirmedquantitycontent,
                    "orderMeasurementUnitCode": details[x].Confirmedquantity.Measurementunitcode.Measurementunitcodecontent,
                    "orderConfirmedPrice": details[x].Tradeitemnetprice.Tradeitemnetpricecontent,
                    "orderConfirmedAmount": details[x].Lineitemnetmonetaryamount.Lineitemnetmonetaryamountcontent,
                    "orderConfirmedDiscount": details[x].Allowanceinformation.Allowancepercentage,
                    "orderResponseStatusCode": details[x].Businessdocumentlineresponsecode.Businessdocumentlineresponsecodecontent,
                    "orderReasonStatus": details[x].Reasonforstatusofbusinessdocumentcode.Reasonforstatusofbusinessdocumentcodecontent,
                }
                newOrderResponse.orderDetails.push(obj);
            }
        }
        console.log('new order response', newOrderResponse)
        return newOrderResponse;
    //}
}

async function validateStructureResponse(orderResponse){
    const schema = jsonSchemaResponse();
    const errors = [];

    const header = schema.orderResponseMessage.StandardBusinessDocumentHeader;
    const body = schema.orderResponseMessage.orderResponse;
    const sender = header.Sender;
    const receiver = header.Receiver;
    const docIdentification = header.DocumentIdentification;
    const orderResponseId = body.orderResponseIdentification;
    const reqDelivery = body.requestedDeliveryDateRange;
    const buyer = body.buyer;
    const seller = body.seller;
    const originalOrder = body.originalOrder;
    const orderResponseDet = body.orderResponseLineItem[0];

    const keys = Object.keys(schema);
    
    for( let o in keys){
        if(!orderResponse.hasOwnProperty(keys[o])){
            errors.push('El atributo "'+keys[o]+'" es requerido y debe ser un objeto.');
        } else {
            const res_om = validator(orderResponse.orderResponseMessage, schema.orderResponseMessage);
            if(res_om.length>0){
                errors.push({ orderResponse: res_om });
            } else {
                // header
                let oms = orderResponse.orderResponseMessage.StandardBusinessDocumentHeader;
                const res_oms = validator(oms, header);
                if(res_oms.length>0){
                    errors.push({ header: res_oms })
                } else {
                    const res_sender = validator(oms.Sender, sender);
                    const res_receiver = validator(oms.Receiver, receiver);
                    const res_doc_id = validator(oms.DocumentIdentification, docIdentification);
                    if(res_sender.length>0 || res_receiver.length>0 || res_doc_id.length>0){
                        errors.push({ sender: res_sender, receiver: res_receiver, documentIdentification: res_doc_id })
                    } else {
                        const res_sender_cont = validator(oms.Sender.ContactInformation, sender.ContactInformation);
                        const res_receiver_cont = validator(oms.Receiver.ContactInformation, receiver.ContactInformation);
                        if(res_sender_cont.length>0 || res_receiver_cont.length>0){
                            errors.push({ senderContact: res_sender_cont, receiverContact: res_receiver_cont })
                        }
                    }
                }
                // body
                let om_o = orderResponse.orderResponseMessage.orderResponse;
                const res_om_o  = validator(om_o, body);
                if(res_om_o.length>0){
                    errors.push({ orderResponse: res_om_o });
                } else {
                    const res_o_orId = validator(om_o.orderResponseIdentification, orderResponseId);
                    const res_o_reqDel = validator(om_o.requestedDeliveryDateRange, reqDelivery);
                    const res_o_buyer = validator(om_o.buyer, buyer);
                    const res_o_seller = validator(om_o.seller, seller);
                    const res_o_OriOr = validator(om_o.originalOrder, originalOrder);

                    if(res_o_orId.length>0 ||
                        res_o_reqDel.length>0 ||
                        res_o_buyer.length>0 ||
                        res_o_seller.length>0 ||
                        res_o_OriOr.length>0 
                    ){
                        errors.push({
                            orderResponseIdentification: res_o_orId,
                            requestedDeliveryDateRange: res_o_reqDel,
                            buyer: res_o_buyer,
                            seller: res_o_seller,
                            originalOrder: res_o_OriOr
                        })
                    } else {
                        const orResId_gln = validator(om_o.orderResponseIdentification.contentOwner, orderResponseId.contentOwner);
                        if(orResId_gln.length>0){
                            errors.push({
                                contentOwner: orResId_gln
                            })
                        }
                    }
                    if(om_o.responseStatusCode == 'MODIFICACIONES'){
                        for(let d in om_o.orderResponseLineItem){
                            const res_detail = validator(om_o.orderResponseLineItem[d], orderResponseDet);
                            if(res_detail.length>0){
                                errors.push({ orderResponseDetails: res_detail })
                            } else {
                                const res_det_gtin = validator(om_o.orderResponseLineItem[d].transactionalTradeItem, orderResponseDet.transactionalTradeItem);
                                if(res_det_gtin.length>0){
                                    errors.push({ transactionalTradeItem: res_det_gtin })
                                }
                            }
                        }
                    }
                }
            }
        }
    } 
    return errors;
}

function  validator(order, schema){
    const errors = [];
    const keys = Object.keys(schema);
    for(let x in keys){
        if(!order.hasOwnProperty(keys[x])){
            if(typeof schema[keys[x]] == 'object'){
                errors.push('El atributo '+keys[x]+' es requerido y debe ser un objeto.');
            } else {
                errors.push('El atributo '+keys[x]+' es requerido y debe ser de tipo ' + typeof schema[keys[x]]);
            }
        } else {
            if(typeof schema[keys[x]] != 'object'){
                if(typeof schema[keys[x]] != typeof order[keys[x]]){
                    if(order[keys[x]] == null || order[keys[x]] == 'null'){
                        errors.push('El atributo '+keys[x]+' no debe enviarse como "null".');
                    } else if(order[keys[x]] == '') {
                        errors.push('El atributo '+keys[x]+' viene vacio.');
                    } else if(order[keys[x]] == undefined || order[keys[x]] == 'undefined'){
                        errors.push('El atributo '+keys[x]+' no debe enviarse como "undefined".');
                    } else {
                        errors.push('El atributo '+keys[x]+' debe ser de tipo "'+typeof schema[keys[x]] +'".');
                    }
                }
            }
        }
    }
    return errors;
}

function jsonSchemaResponse(){
    const orderResponseMessage = {
        "Orderresponse": {
            "Businessdocumentcreationdatetime": "string",
            "Businessdocumentstandardversion": "string",
            "Businessdocumentidentificationinformation": {
                "Entityidentification": "string",
                "Documentcontentowner": {
                    "GloballocationnumberGLN": "string",
                    "Additionalpartyidentificationinformation": {
                        "Additionalpartyidentificationcontent": "string"
                    }
                }
            },
            "Receivedorderdocumentstatuscode": {
                "Receivedorderdocumentstatuscodecontent": "string"
            },
            "Buyerpartyinformation": {
                "GloballocationnumberGLN": "string"
            },
            "Sellerpartyinformation": {
                "GloballocationnumberGLN": "string",
                "Businesscontactinformation": {
                    "Personname": "string",
                    "Communicationinformation": {
                        "Communicationchannelcode": "string",
                        "Communicationchannelidentification": "string"
                    }
                }
            },
            "Requestedmodificationofdeliverydateinformation": {
                "Requesteddeliverytimeperiod": {
                    "Beginperioddate": "string",
                    "Enddateperiod": "string"
                }
            },
            "Referencedsalesorderdocumentinformation": {
                "Entityidentification":  "string",
                "Businessdocumentcreationdatetime":  "string"
            },
            "Orderresponseline": [
                {
                    "Referencedbusinessdocumentline": 0,
                    "Confirmedtradeitemdeliverydatetime": "string",
                    "Confirmedquantity": {
                        "Confirmedquantitycontent": "string",
                        "Measurementunitcode": {
                            "Measurementunitcodecontent": "string"
                        }
                    },
                    "Businessdocumentlineresponsecode": {
                        "Businessdocumentlineresponsecodecontent": "string"
                    },
                    "Reasonforstatusofbusinessdocumentcode": {
                        "Reasonforstatusofbusinessdocumentcodecontent": "string"
                    },
                    "Tradeitemnetprice": {
                        "Tradeitemnetpricecontent": "string",
                        "Currencycodecontent": {
                            "Currencycodecontent": "string"
                        }
                    },
                    "Lineitemnetmonetaryamount": {
                        "Lineitemnetmonetaryamountcontent": "string",
                        "Currencycode": {
                            "Currencycodecontent": "string"
                        }
                    },
                    "Respondedtradeiteminformation": {
                        "GlobaltradeitemnumberGTIN": "string"
                    },
                    "Allowanceinformation": {
                        "Allowancepercentage": "string"
                    }
                }
            ]
        }
    };
    return orderResponseMessage;
}

function dateAndHourFormat(date){
    const dateObject = new Date(date);

    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, '0');
    const day = String(dateObject.getDate()).padStart(2, '0');
    const hours = String(dateObject.getHours()).padStart(2, '0');
    const minutes = String(dateObject.getMinutes()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
    return formattedDate;
}

function dateFormat(date){
    const dateObject = new Date(date);

    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, '0');
    const day = String(dateObject.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}

function hourFormat(date){
    const dateObject = new Date(date);

    const hours = String(dateObject.getHours()).padStart(2, '0');
    const minutes = String(dateObject.getMinutes()).padStart(2, '0');
    const seconds = String(dateObject.getSeconds()).padStart(2, '0');
    
    const formattedHour = `${hours}:${minutes}:${seconds}`;
    return formattedHour;
}

async function valideOrderMessage(params){
    const valid = validate_schema(params.order);

    if (!valid) {
        localize.es(validate_schema.errors); 
        return {
            statusCode: 422,
            body: JSON.parse(JSON.stringify({
                message: 'Validación fallida',
                detail: validate_schema.errors,
                result: valid,
            })),
        };
    }

    return {
        statusCode: 200,
        body: JSON.parse(JSON.stringify({
            message: 'JSON válido según el esquema',
            detail: validate_schema,
            result: valid
        })),
    };
}

module.exports =  {
    createFormat: createFormat,
    createFormatOrdResponse: createFormatOrdResponse,
    getJson: getJson,
    getJsonOrdResponse: getJsonOrdResponse,
    valideOrderMessage: valideOrderMessage
}