const js2xmlparser = require('js2xmlparser');
const xml2js = require('xml2js');
const fs = require('fs');
const xmlParser = require('fast-xml-parser');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const localize = require('ajv-i18n');

const schema = require('./orderMessajeXml.schema.json');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validate_schema = ajv.compile(schema);

async function createFormat(order){
    const ord = order[0][0];
    const ordDet = order[1][0];
    try{
        const orderMessage = {
            "orderMessage": {
                "order": {
                    "ecomDocument": {
                        "revisionnumber": ord.orderControlID,
                        "creationDateTime": dateAndHourFormat(ord.orderDate),
                        "referencedOrder": {
                            "creationDateTime": dateAndHourFormat(ord.orderDateCreate)
                        },
                        "documentStatusCode": ord.orderDocumentStatusCode,
                        "documentStructureVersion": "2.0",
                    },
                    "orderIdentification": {
                        "entityIdentification": ord.orderNumber,
                        "contentOwner": {
                            "gln": ord.userAuthOwnerShipDataSender
                        }
                    },
                    "additionalOrderInstruction": ord.orderInstruction,
                    "deliveryTerms": {
                        "deliveryInstruction": ord.orderInstructionDescription,
                        "orderTypeCode": ord.orderType
                    },
                    "buyer": {
                        "gln": ord.orderBuyerGLN,
                        "contact": {
                            "personName": ord.orderEmissionName,
                            "communicationChannel": {
                                "communicationChannelCode":  ord.orderCommunicationChannel,
                                "communicationValue": ord.orderCommunicationValue
                            }
                        },
                        "organisationDetails": {
                            "organisationName": ord.orderBillToTradeName
                        }
                    },
                    "seller": {
                        "gln": ord.orderSellerGLN,
                        "additionalPartyIdentification": ord.orderInternalProviderCode,
                        "organisationDetails": {
                            "organisationName": ord.orderTradeName
                        },
                        "address": {
                            "name": ord.orderSellerAddressInformation
                        },
                        "contact": {
                            "communicationChannel": {
                                "communicationValue": ord.orderSellerCommunicationValue
                            }
                        }
                    },
                    "billTo": {
                        "gln": ord.orderBillToOrderGLN,
                        "organisationDetails": {
                            "organisationName": ord.orderBillTo
                        }
                    },
                    "transactionalTradeItem": {
                        "tradeItemClassification": {
                            "additionalTradeItemClassificationCode": ord.orderSellerTradeItemProduct
                        }
                    },
                    "orderLogisticalInformation": {
                        "shipTo": {
                            "gln": ord.glnLocation,
                            "additionalPartyIdentification": ord.orderPartyIdentification,
                            "address": {
                                "city": ord.locationColony,
                                "name": ord.locationAdress,
                                "postalCode": ord.locationPostalCode,
                                "state": ord.locationState,
                                "streetAdressOne": ord.locationStreet,
                                "providenceCode": ord.locationMunicipality,
                                "geographicalCordinates": {
                                    "latitude": ord.locationLatitude,
                                    "longitude": ord.locationLongitude
                                }
                            }
                        },
                        "orderLogisticalDateInformation": {
                            "requestedDeliveryDateTime": {
                                "date": dateFormat(ord.orderDateEmbark),
                                "time": hourFormat(ord.orderDateEmbark)
                            },
                            "requestedDeliveryDateRange": {
                                "endDate": dateFormat(ord.orderDateCancelation)
                            }
                        }
                    },
                    "paymentTerms": {
                        "paymentTermsDescription": ord.orderDeliveryTerm,
                    },
                    "totalMonetaryNetAmount": {
                        "totalMonetaryAmountExcludingTaxes": ord.orderTotalAmount,
                        "currencyCode": ord.currencyCode
                    },
                    "requestedQuantity": ord.orderTotalUnits,
                    "totalLineItemNumber":{
                        "lineItemNumber": ord.orderTotalItems
                    },
                    "orderLineItem": []
                }
            }
        };

        for(var x in ordDet) {
            const obj = {
                "lineItemNumber": ordDet[x].orderItemCode,
                "requestedQuantity": {
                    "@": {
                        "measurementUnitCode": ordDet[x].orderUM,
                    },
                    "#": ordDet[x].orderQuantity,
                },
                "listPrice": {
                    "@": {
                        "currencyCode": ord.currencyCode,
                    },
                    "#": ordDet[x].orderCost,
                },
                "leviedDutyFeeTax": [
                    {
                        "dutyFeeTaxPercentage": ordDet[x].orderTaxRateAmount,
                        "dutyFeeTaxCategoryCode": "IVA",
                    },
                    {
                        "dutyFeeTaxPercentage": ordDet[x].orderImportAmount,
                        "dutyFeeTaxCategoryCode": "IEPS",
                    }
                ],
                "netPrice": {
                    "@": {
                        "currencyCode": ord.currencyCode,
                    },
                    "#": ordDet[x].orderPrice,
                },
                "netAmount": {
                    "@": {
                        "currencyCode": ord.currencyCode,
                    },
                    "#": ordDet[x].orderAmount,
                },
                "transactionalTradeItem": {
                    "gtin": ordDet[x].orderEAN,
                    "additionalTradeItemIdentification": [
                        {
                            "additionalTradeItemIdentificationcontent": ordDet[x].orderOrderClientCode,
                            "additionalTradeItemIdentificationtypecodecontent": "SUPPLIER_ASSIGNED"
                        },
                        {
                            "additionalTradeItemIdentificationcontent": ordDet[x].orderOrderClientCodeIntern,
                            "additionalTradeItemIdentificationtypecodecontent": "BUYER_ASSIGNED"
                        }
                    ],
                    "tradeItemQuantity": {
                        "tradeItemQuantity": ordDet[x].orderNetContent,
                        "Measurementunitcodecontent": ordDet[x].orderUMNetContent
                    },                    
                    "tradeItemDescription": ordDet[x].orderDescription
                },
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
            orderMessage.orderMessage.order.orderLineItem.push(obj);
        }

        const xmlOptions = {
            declaration: {
                include: false
            },
            format: {
                // pretty: true
                newline: '',
                indent: ''
            },
            indentBy: '  ',
            allowEmpty: true,
        };

        const xml = js2xmlparser.parse("root", orderMessage, xmlOptions);
        console.log('xml', xml)

        // let replaceXML;
        // replaceXML = replaceAll(xml, '\n        ', '');
        // replaceXML = replaceAll(xml, '\n    ', '');
        // replaceXML = replaceAll(xml, '\n', '');

        console.log('format order', xml);
        return xml;
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
}

async function createFormatUl(order){
    const ord = order[0][0];
    const ordDet = order[1][0];

    try {
        const order_ = {
          //"ORDERS05": {
            "IDOC": {
                "@": { "BEGIN": "1" },
                "EDI_DC40": {
                    "@": { "SEGMENT": "1" },
                    "TABNAM": "EDI_DC40",
                    "DOCREL": "701",
                    "DIRECT": "2",
                    "IDOCTYP": "ORDERS05",
                    "MESTYP": "ORDERS",
                    "MESFCT": "MX",
                    "STD": "X",
                    "STDMES": "850",
                    "SNDPOR": "SAPP1P",
                    "SNDPRT": "KU",
                    "SNDLAD": ord.orderProviderName,
                    "RCVPOR": "SAPP1P",
                    "RCVPRT": "LS",
                    "RCVPRN": "P1PCLNT010",
                    "CREDAT": dateAndHourFormatter(ord.orderDateCreate),
                    "CRETIM": "000000",
                    "REFINT": "111119",
                    "STDMES": "850"
                },
                "E1EDK01": {
                    "@": { "SEGMENT": "1" },
                    "ACTION": "000",
                    "BSART": "ZEDI"
                },
                "E1EDK14": {
                    "@": { "SEGMENT": "1" },
                    "QUALF": "006",
                    "ORGID": "30"
                },
                "E1EDK14": {
                    "@": { "SEGMENT": "1" },
                    "QUALF": "007",
                    "ORGID": "10"
                },
                "E1EDK14": {
                    "@": { "SEGMENT": "1" },
                    "QUALF": "008",
                    "ORGID": "MX01"
                },
                "E1EDK14": {
                    "@": { "SEGMENT": "1" },
                    "QUALF": "012",
                    "ORGID": "ZEDI"
                },
                "E1EDK14": {
                    "@": { "SEGMENT": "1" },
                    "QUALF": "019",
                    "ORGID": "EDI"
                },
                "E1EDK03": {
                    "@": { "SEGMENT": "1" },
                    "IDDAT": "002",
                    "DATUM": dateAndHourFormatter(ord.orderDateCreate),
                },
                "E1EDKA1": {
                    "@": { "SEGMENT": "1" },
                    "PARVW": "WE",
                    "PARTN": ord.orderEmbarkTo,
                    "LIFNR": ord.orderEmbarkTo
                },
                "E1EDK02": {
                    "@": { "SEGMENT": "1" },
                    "QUALF": "001",
                    "BELNR": ord.orderNumber,
                    "DATUM": ord.orderDate
                },
                "E1EDK02": {
                    "@": { "SEGMENT": "1" },
                    "QUALF": "054",
                    "BELNR": ord.orderProviderCode,
                },
                "E1EDKT1": {
                    "@": { "SEGMENT": "1" },
                    "TDID": "Z010",
                    "TSSPRAS": "EN",
                    "TSSPRAS_ISO": "EN",
                    "TDOBJECT": "VBBK",
                    "TDOBNAME": "Z010"
                },
                "E1EDKT1": {
                    "@": { "SEGMENT": "1" },
                    "TDID": "Z015",
                    "TSSPRAS": "EN",
                    "TSSPRAS_ISO": "EN",
                    "TDOBJECT": "VBBK",
                    "TDOBNAME": "Z015",
                    "E1EDKT2": {
                        "@": { "SEGMENT": "1" },
                        "TDLINE":  ord.orderProviderCode,
                    }
                },
                "E1EDP01": [],
            //},
          }  
        }

        for (var x in ordDet) {
            const obj = {
                "POSEX": ordDet[x].orderItemCode,
                "MENGE": ordDet[x].orderQuantity ,
                "MENEE": ordDet[x].orderUM,
                "PMENE": ordDet[x].orderUM,
                "VPREI": ordDet[x].orderPrice,
                "E1EDP02": {
                    "@": { "SEGMENT": "1" },
                    "QUALF": "044",
                    "ZEILE": ordDet[x].orderPiecesPerPackage
                },
                "E1EDP19": {
                    "@": { "SEGMENT": "1" },
                    "QUALF": "200",
                    "IDTNR": ordDet[x].orderEAN
                },
                "E1EDP19": {
                    "@": { "SEGMENT": "1" },
                    "QUALF": "100",
                    "IDTNR": ordDet[x].orderOrderClientCode
                },
                "E1EDPT1": {
                    "@": { "SEGMENT": "1" },
                    "TDID": "ZEDI",
                    "TSSPRAS": "EN",
                    "TSSPRAS_ISO": "E",
                    "E1EDPT2": {
                        "@": { "SEGMENT": "1" },
                        "TDLINE": ordDet[x].orderOrderClientCode +' '+ "IN"
                    },
                    "E1EDPT2": {
                        "@": { "SEGMENT": "1" },
                        "TDLINE": ordDet[x].orderEAN +' '+ "IN"
                    },
                    "E1EDPT2": {
                        "@": { "SEGMENT": "1" },
                        "TDLINE": '21#Cantidad pedida: '+ ordDet[x].orderQuantity
                    }
                }
            }
            order_.IDOC.push(obj);
        }

        const xml = js2xmlparser.parse("ORDERS05", order_);
        console.log('format order ul', xml)
        return xml;
    } catch (err){
        console.error('Error parsing JSON:', err);
    }
}

async function createFormatOrdResponse(order){
    const ord = order[0][0];
    const ordDet = order[1][0];

    try{
        const orderResponseMessage = {
            "orderResponseMessage": {
                "orderResponse": {
                    "creationDateTime": dateAndHourFormat(ord.orderResponseCreationDate),
                    "documentStructureVersion": "2.0",
                    "orderResponseIdentification": {
                        "entityIdentification": ord.orderRevisionNumber,
                        "contentOwner": {
                            "gln": ord.orderProviderCode,
                            "additionalPartyIdentification": ord.orderInternalProviderCode
                        }
                    },
                    "responseStatusCode": ord.orderStatusCode,
                    "buyer": {
                        "gln": ord.orderBuyerGLN
                    },
                    "seller": {
                        "gln": ord.orderSellerGLN,
                        "contact": {
                            "personName": ord.orderProviderName,
                            "communicationChannel": {
                                "communicationChannelCode": ord.orderCommunicationChannel,
                                "communicationValue": ord.orderCommunicationValue
                            }
                        }
                    },
                    "amendedDateTimeValue": {
                        "requestedDeliveryDateRange": {
                            "beginDate": dateAndHourFormat(ord.orderDeliveryStartPeriod),
                            "endDate": dateAndHourFormat(ord.orderDeliveryEndPeriod)
                        }
                    },
                    "salesOrder": {
                        "entityIdentification":  ord.orderNumber,
                        "creationDateTime":  dateAndHourFormat(ord.orderDate)
                    },
                    "orderResponseLineItem": []
                }
            }
        }

        if((ord.orderStatusCode === 'MODIFIED' || ord.orderStatusCode === 'REJECTED') && ordDet.length>0){
            for(var x in ordDet){
                const obj = {
                    "originalOrderLineItemNumber": ordDet[x].orderItemCode,
                    "deliveryDateTime": dateAndHourFormat(ordDet[x].orderConfirmedDeliveryDate),
                    "Confirmedquantity": {
                        "@": {
                            "measurementUnitCode": ordDet[x].orderMeasurementUnitCode,
                        },
                        "#": ordDet[x].orderConfirmedQuantity
                    },
                    "lineItemChangeIndicator": ordDet[x].orderResponseStatusCode,
                    "orderResponseReasonCode": ordDet[x].orderReasonStatus,
                    "netPrice": {
                        "@": {
                            "Currencycode": ord.currencyCode,
                        },
                        "#": ordDet[x].orderConfirmedPrice,
                    },
                    "netAmount": {
                        "@": {
                            "Currencycode": ord.currencyCode,
                        },
                        "#": ordDet[x].orderConfirmedAmount,
                    },
                    "transactionalTradeItem": {
                        "gtin": ordDet[x].orderEAN,
                    },
                    "allowanceChargePercentage": {
                        "Allowancepercentage": ordDet[x].orderDiscount,
                    }
                }
                orderResponseMessage.orderResponseMessage.orderResponse.orderResponseLineItem.push(obj);
            }
        }

        const xmlOptions = {
            declaration: {
                include: false
            },
            format: {
                //pretty: true
                newline: '',
                indent: ''
            },
            indentBy: '  ',
            allowEmpty: true,
        };

        const xml = js2xmlparser.parse("root", orderResponseMessage, xmlOptions);
        console.log('xml response', xml)

        // let replaceXML;
        // replaceXML = replaceAll(xml, '\n        ', '');
        // replaceXML = replaceAll(xml, '\n    ', '');
        // replaceXML = replaceAll(xml, '\n', '');

        console.log('format order response', xml)
        return xml
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
}

async function getXML(params){
    return new Promise((resolve, reject) => {

        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

        parser.parseString(params.order, async (err, result) => {
            if (err) {
                reject(err);
            } else {
                const parseOrder = JSON.parse(JSON.stringify(result, null, 2));


                const order = parseOrder.root.orderMessage.order;
                const resultValidation = await valideOrderMessage(parseOrder.root);
                console.log('resultValidation', resultValidation);
            
                if(!resultValidation.body.result){
                    resolve(resultValidation.body);
                } else {
                    const newOrder = {
                        "orderNumber": order.orderIdentification.entityIdentification,
                        "orderProviderCode": order.seller.gln,
                        "orderInternalProviderCode": order.seller.additionalPartyIdentification,
                        "orderProviderName": order.seller.organisationDetails.organisationName,
                        "orderTradeName": order.seller.organisationDetails.organisationName,
                        "orderBillToOrderGLN":  order.billTo.gln,
                        "orderBillTo": order.billTo.organisationDetails.organisationName,
                        "orderBillToTradeName": order.buyer.organisationDetails.organisationName,
                        "orderEmissionName": order.buyer.contact.personName,
                        "orderEmbarkTo": 0,
                        "orderControlID": order.ecomDocument.revisionnumber,
                        "orderDate": dateAndHourFormat(order.ecomDocument.creationDateTime),
                        "orderDateCreate": dateAndHourFormat(order.ecomDocument.referencedOrder.creationDateTime),
                        "orderDateEmbark": dateAndHourFormat(order.orderLogisticalInformation.orderLogisticalDateInformation.requestedDeliveryDateTime.date),
                        "orderDeliveryTerm": order.paymentTerms.paymentTermsDescription,
                        "orderTypeID": 0,
                        "orderTotalItems": parseFloat(order.totalLineItemNumber.lineItemNumber),
                        "orderTotalUnits": parseFloat(order.requestedQuantity),
                        "orderTotalAmount": order.totalMonetaryNetAmount.totalMonetaryAmountExcludingTaxes,
                        "orderCommunicationChannel": order.buyer.contact.communicationChannel.communicationChannelCode,
                        "orderCommunicationValue": order.buyer.contact.communicationChannel.communicationValue,
                        "orderDocumentStatusCode": order.ecomDocument.documentStatusCode,
                        "orderInstruction": order.additionalOrderInstruction,
                        "orderCurrencyCode": order.totalMonetaryNetAmount.currencyCode,
                        "orderBuyerGLN": order.buyer.gln,
                        "orderSellerGLN": order.seller.gln,
                        "orderLocationGln": order.orderLogisticalInformation.shipTo.gln,
                        "locationCityName": order.orderLogisticalInformation.shipTo.address.city,
                        "locationPartyName": order.orderLogisticalInformation.shipTo.address.name,
                        "locationPostalCode": order.orderLogisticalInformation.shipTo.address.postalCode,
                        "locationState": order.orderLogisticalInformation.shipTo.address.state,
                        "locationStreetAddressOne": order.orderLogisticalInformation.shipTo.address.streetAdressOne,
                        "locationProvinceIdentity": order.orderLogisticalInformation.shipTo.address.providenceCode,
                        "locationLatitude": order.orderLogisticalInformation.shipTo.address.geographicalCordinates.latitude,
                        "locationLongitude": order.orderLogisticalInformation.shipTo.address.geographicalCordinates.longitude,
                        "orderInstructionDescription": order.deliveryTerms.deliveryInstruction,
                        "orderType": order.deliveryTerms.orderTypeCode,
                        "orderSellerAddressInformation": order.seller.address.name,
                        "orderSellerCommunicationValue": order.seller.contact.communicationChannel.communicationValue,
                        "orderSellerTradeItemProduct": order.transactionalTradeItem.tradeItemClassification.additionalTradeItemClassificationCode,
                        "orderPartyIdentification": order.orderLogisticalInformation.shipTo.additionalPartyIdentification,
                        "orderDateCancelation": order.orderLogisticalInformation.orderLogisticalDateInformation.requestedDeliveryDateRange.endDate,
                        //"orderAllowancePercentage": order.allowanceCharge.allowanceChargePercentage,
                        "orderDetails": [],
                        "result": true
                    }
                    const details = order.orderLineItem;
                    if(Array.isArray(details)){
                        for(var x in details){

                            let sku;
                            let skuSup;
                            if(Array.isArray(details[x].transactionalTradeItem.additionalTradeItemIdentification)){
                                let skuFilter = details[x].transactionalTradeItem.additionalTradeItemIdentification.find(s => s.additionalTradeItemIdentificationtypecodecontent == 'BUYER_ASSIGNED');
                                sku = skuFilter == undefined ? '' : skuFilter.additionalTradeItemIdentificationcontent;

                                let skuFilterSup = details[x].transactionalTradeItem.additionalTradeItemIdentification.find(s => s.additionalTradeItemIdentificationtypecodecontent == 'SUPPLIER_ASSIGNED');
                                skuSup = skuFilterSup == undefined ? '' : skuFilterSup.additionalTradeItemIdentificationcontent;
                            } else {
                                sku = '';
                                skuSup = '';
                            }

                            let taxIva;
                            let taxIeps;
                            if(Array.isArray(details[x].leviedDutyFeeTax)){
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
                            if(Array.isArray(details[x].allowanceCharge)){
                                let discountFilter = details[x].allowanceCharge.find(s => s.allowanceChargeType == 'DI');
                                discount = discountFilter == undefined ? '' : discountFilter.allowanceChargePercentage;

                                let discountInvFilter = details[x].allowanceCharge.find(s => s.allowanceChargeType == 'TD');
                                discountInv = discountInvFilter == undefined ? '' : discountInvFilter.allowanceChargePercentage;
                            } else {
                                discount = '';
                                discountInv = '';
                            }

                            const obj = {
                                "orderItemCode": parseFloat(details[x].lineItemNumber),
                                "orderEAN": details[x].transactionalTradeItem.gtin,
                                "orderOrderClientCode": skuSup,
                                "orderOrderClientCodeIntern": sku,
                                "orderDUN14": 0,
                                "orderUM": details[x].requestedQuantity.measurementUnitCode,
                                "orderDescription": details[x].transactionalTradeItem.tradeItemDescription,
                                "orderQuantity": parseFloat(details[x].requestedQuantity._),
                                "orderDiscount": discount,
                                "orderPrice": details[x].netPrice._,
                                "orderAmount": details[x].netAmount._,
                                "orderPiecesPerPackage": 0,
                                "orderNetContent": details[x].transactionalTradeItem.tradeItemQuantity.tradeItemQuantity,
                                "orderUMNetContent": details[x].transactionalTradeItem.tradeItemQuantity.Measurementunitcodecontent,
                                "orderCost": details[x].listPrice._,
                                "orderTaxRateAmount": taxIva,
                                "orderImportAmount": taxIeps,
                                "orderDiscountInvoice": discountInv
                            }
                            newOrder.orderDetails.push(obj);
                        }
                    } else {
                        let sku;
                        let skuSup;
                        if(Array.isArray(details.transactionalTradeItem.additionalTradeItemIdentification)){
                            let skuFilter = details.transactionalTradeItem.additionalTradeItemIdentification.find(s => s.additionalTradeItemIdentificationtypecodecontent == 'BUYER_ASSIGNED');
                            sku = skuFilter == undefined ? '' : skuFilter.additionalTradeItemIdentificationcontent;

                            let skuFilterSup = details.transactionalTradeItem.additionalTradeItemIdentification.find(s => s.additionalTradeItemIdentificationtypecodecontent == 'SUPPLIER_ASSIGNED');
                            skuSup = skuFilterSup == undefined ? '' : skuFilterSup.additionalTradeItemIdentificationcontent;
                        } else {
                            sku = '';
                            skuSup = '';
                        }

                        let taxIva;
                        let taxIeps;
                        if(Array.isArray(details.leviedDutyFeeTax)){
                            let taxIvaFilter = details.leviedDutyFeeTax.find(s => s.dutyFeeTaxCategoryCode == 'IVA');
                            taxIva = taxIvaFilter == undefined ? '' : taxIvaFilter.dutyFeeTaxPercentage;

                            let taxIepsFilter = details.leviedDutyFeeTax.find(s => s.dutyFeeTaxCategoryCode == 'IEPS');
                            taxIeps = taxIepsFilter == undefined ? '' : taxIepsFilter.dutyFeeTaxPercentage;
                        } else {
                            taxIva = '';
                            taxIeps = '';
                        }

                        let discount;
                        let discountInv;
                        if(Array.isArray(details.allowanceCharge)){
                            let discountFilter = details.allowanceCharge.find(s => s.allowanceChargeType == 'DI');
                            discount = discountFilter == undefined ? '' : discountFilter.allowanceChargePercentage;

                            let discountInvFilter = details.allowanceCharge.find(s => s.allowanceChargeType == 'TD');
                            discountInv = discountInvFilter == undefined ? '' : discountInvFilter.allowanceChargePercentage;
                        } else {
                            discount = '';
                            discountInv = '';
                        }

                        const obj = {
                            "orderItemCode": parseFloat(details.lineItemNumber),
                            "orderEAN": details.transactionalTradeItem.gtin,
                            "orderOrderClientCode": skuSup,
                            "orderOrderClientCodeIntern": sku,
                            "orderDUN14": 0,
                            "orderUM": details.requestedQuantity.measurementUnitCode,
                            "orderDescription": details.transactionalTradeItem.tradeItemDescription,
                            "orderQuantity": parseFloat(details.requestedQuantity._),
                            "orderDiscount": discount,
                            "orderPrice": details.netPrice._,
                            "orderAmount": details.netAmount._,
                            "orderPiecesPerPackage": 0,
                            "orderNetContent": details.transactionalTradeItem.tradeItemQuantity.tradeItemQuantity,
                            "orderUMNetContent": details.transactionalTradeItem.tradeItemQuantity.Measurementunitcodecontent,
                            "orderCost": details.listPrice._,
                            "orderTaxRateAmount": taxIva,
                            "orderImportAmount": taxIeps,
                            "orderDiscountInvoice": discountInv
                        }
                        newOrder.orderDetails.push(obj);
                    }
                    console.log('new order', newOrder);
                    resolve(newOrder);
                }
            }
        });
    });
}

async function getXmlOrdResponse(o) {
    return new Promise((resolve, reject) => {

        console.log('getxml response', o);

        // const orderBase64 = Buffer.from(order,'base64').toString('utf-8');
        // console.log('decode order response', orderBase64);

        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

        parser.parseString(o, async (err, result) => {
            if (err) {
                reject(err);
            } else {
                const parseOrder = JSON.parse(JSON.stringify(result, null, 2));
                console.log('parse ord', parseOrder)

                const order = parseOrder.root.orderResponseMessage.orderResponse;
                // const resultValidation = await validateStructureResponse(parseOrder);
                // console.log('resultValidationResponse', resultValidation);
            
                // if(resultValidation.length>0){
                //     resolve(resultValidation);
                // } else {
                    const newOrderResponse = {
                        "orderCode": 0,
                        "orderRevisionNumber": order.orderResponseIdentification.entityIdentification,
                        "orderStatusCode": order.responseStatusCode,
                        "orderDeliveryStartPeriod": dateAndHourFormat(order.amendedDateTimeValue.requestedDeliveryDateRange.beginDate),
                        "orderDeliveryEndPeriod": dateAndHourFormat(order.amendedDateTimeValue.requestedDeliveryDateRange.endDate),
                        "orderProviderCode": order.orderResponseIdentification.contentOwner.gln,
                        "orderInternalProviderCode": order.orderResponseIdentification.contentOwner.additionalPartyIdentification,
                        "orderProviderName": order.seller.contact.personName,
                        "orderBuyerGLN": order.buyer.gln,
                        "orderSellerGLN": order.seller.gln,
                        "orderCommunicationChannel": order.seller.contact.communicationChannel.communicationChannelCode,
                        "orderCommunicationValue": order.seller.contact.communicationChannel.communicationValue,
                        "orderNumber": order.salesOrder.entityIdentification,
                        "orderDetails": [],
                    }
                    const details = order.orderResponseLineItem;
                    if(order.responseStatusCode === 'MODIFIED' || order.responseStatusCode === 'REJECTED'){
                        if(Array.isArray(details)){
                            for(var x in details){
                                const obj = {
                                    "orderItemCode": parseFloat(details[x].originalOrderLineItemNumber),
                                    "orderDUN14": details[x].transactionalTradeItem.gtin,
                                    "orderConfirmedDeliveryDate": dateAndHourFormat(details[x].deliveryDateTime),
                                    "orderConfirmedQuantity": parseFloat(details[x].Confirmedquantity._),
                                    "orderMeasurementUnitCode": details[x].Confirmedquantity.measurementUnitCode,
                                    "orderConfirmedPrice": details[x].netPrice._,
                                    "orderConfirmedAmount": details[x].netAmount._,
                                    "orderConfirmedDiscount": details[x].allowanceChargePercentage.Allowancepercentage,
                                    "orderResponseStatusCode": details[x].lineItemChangeIndicator,
                                    "orderReasonStatus": details[x].orderResponseReasonCode,
                                }
                                newOrderResponse.orderDetails.push(obj);
                            }
                        } else {
                            const obj = {
                                "orderItemCode": parseFloat(details.originalOrderLineItemNumber),
                                "orderDUN14": details.transactionalTradeItem.gtin,
                                "orderConfirmedDeliveryDate": dateAndHourFormat(details.deliveryDateTime),
                                "orderConfirmedQuantity": parseFloat(details.Confirmedquantity._),
                                "orderMeasurementUnitCode": details.Confirmedquantity.measurementUnitCode,
                                "orderConfirmedPrice": details.netPrice._,
                                "orderConfirmedAmount": details.netAmount._,
                                "orderConfirmedDiscount": details.allowanceChargePercentage.Allowancepercentage,
                                "orderResponseStatusCode": details.lineItemChangeIndicator,
                                "orderReasonStatus": details.orderResponseReasonCode,
                            }
                            newOrderResponse.orderDetails.push(obj);
                        }
                    }
                    console.log('new order response', newOrderResponse)
                    resolve(newOrderResponse);
                //}
            }
        });
    });
}

async function validateStructure(order){
    const schema = xmlSchema();
    const errors = [];
    
    const header = schema.orderMessage.StandardBusinessDocumentHeader;
    const body = schema.orderMessage.order;
    const sender = header.Sender;
    const receiver = header.Receiver;
    const docIdentification = header.DocumentIdentification;
    const orderId = body.orderIdentification;
    const buyer = body.buyer;
    const seller = body.seller;
    const quoteNumber = body.quoteNumber;
    const logInformation = body.orderLogisticalInformation;
    const payTerms = body.paymentTerms;
    const orderDet = body.orderLineItem[0];

    const keys = Object.keys(schema);
    
    for( let o in keys){
        if(!order.hasOwnProperty(keys[o])){
            errors.push('El atributo "'+keys[o]+'" es requerido y debe ser un objeto.');
        } else {
            const res_om = validator(order.orderMessage, schema.orderMessage);
            if(res_om.length>0){
                errors.push({ orderMessage: res_om});
            } else {
                let oms = order.orderMessage.StandardBusinessDocumentHeader;
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

                let om_o = order.orderMessage.order;
                const res_om_o  = validator(om_o, body);
                if(res_om_o.length>0){
                    errors.push({ order: res_om_o });
                } else {
                    const res_o_orId = validator(om_o.orderIdentification, orderId);
                    const res_o_buyer = validator(om_o.buyer, buyer);
                    const res_o_seller = validator(om_o.seller, seller);
                    const res_o_quoteNum = validator(om_o.quoteNumber, quoteNumber);
                    const res_o_logInf = validator(om_o.orderLogisticalInformation, logInformation);
                    const res_o_payTerm = validator(om_o.paymentTerms, payTerms);

                    if(res_o_orId.length>0 ||
                        res_o_buyer.length>0 ||
                        res_o_seller.length>0 ||
                        res_o_quoteNum.length>0 ||
                        res_o_logInf.length>0 ||
                        res_o_payTerm.length>0
                    ){
                        errors.push({
                            orderIdentification: res_o_orId,
                            buyer: res_o_buyer,
                            seller: res_o_seller,
                            quoteNumber: res_o_quoteNum,
                            orderLogisticalInformation: res_o_logInf,
                            paymentTerms: res_o_payTerm,
                        })
                    } else {
                        const orId_gln = validator(om_o.orderIdentification.contentOwner, orderId.contentOwner);
                        const buy_cont = validator(om_o.buyer.contact, buyer.contact);
                        const buy_add = validator(om_o.buyer.address, buyer.address);
                        const log_info = validator(om_o.orderLogisticalInformation.orderLogisticalDateInformation, logInformation.orderLogisticalDateInformation);
                        //const pay_due = validator(om_o.paymentTerms.netPaymentDue, payTerms.netPaymentDue);
                        if(orId_gln.length>0 ||
                            buy_cont.length>0 ||
                            buy_add.length>0 ||
                            log_info.length>0
                        ){
                            errors.push({
                                contentOwner: orId_gln,
                                buyerContact: buy_cont,
                                buyerAddres: buy_add,
                                orderLogisticalInformation: log_info
                            })
                        } else {
                            const buy_cont_cv = validator(om_o.buyer.contact.communicationChannel, buyer.contact.communicationChannel);
                            const log_info_req = validator(om_o.orderLogisticalInformation.orderLogisticalDateInformation.requestedDeliveryDateTime, logInformation.orderLogisticalDateInformation.requestedDeliveryDateTime);
                            //const pay_due_time = validator(om_o.paymentTerms.netPaymentDue.timePeriodDue, payTerms.netPaymentDue.timePeriodDue);
                            if(buy_cont_cv.length>0 ||
                                log_info_req.length>0
                            ){
                                errors.push({
                                    buyerCommunicationChannel: buy_cont_cv,
                                    orderLogisticalInformationReq: log_info_req
                                })
                            }
                        }
                    }
                    for(let d in om_o.orderLineItem){
                        const res_detail = validator(om_o.orderLineItem[d], orderDet);
                        if(res_detail.length>0){
                            errors.push({ orderDetails: res_detail })
                        } else {
                            const res_det_qty = validator(om_o.orderLineItem[d].requestedQuantity, orderDet.requestedQuantity);
                            const res_det_gtin = validator(om_o.orderLineItem[d].transactionalTradeItem, orderDet.transactionalTradeItem);
                            const res_det_pti = validator(om_o.orderLineItem[d].parentTradeItem, orderDet.parentTradeItem);
                            if(res_det_qty.length>0 || res_det_gtin.length>0 || res_det_pti.length>0){
                                errors.push({ requestedQuantity: res_det_qty, transactionalTradeItem: res_det_gtin,  parentTradeItem: res_det_pti})
                            }
                        }
                    }
                }
            }
        }
    } 
    return errors;
}


async function validateStructureResponse(orderResponse){
    const schema = xmlSchemaResponse();
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
                    console.log('aaaaaaa', om_o)

                    if(om_o.responseStatusCode == 'MODIFICACIONES'){
                        if(Array.isArray(om_o.orderResponseLineItem)){
                            for(let d in om_o.orderResponseLineItem){
                                const res_detail = validator(om_o.orderResponseLineItem[d], orderResponseDet);
                                if(res_detail.length>0){
                                    errors.push({ orderResponseDetails: res_detail })
                                } else {
                                    const res_det_qty = validator(om_o.orderResponseLineItem[d].confirmedQuantity, orderResponseDet.confirmedQuantity);
                                    const res_det_gtin = validator(om_o.orderResponseLineItem[d].transactionalTradeItem, orderResponseDet.transactionalTradeItem);
                                    if(res_det_qty.length>0 || res_det_gtin.length>0){
                                        errors.push({ confirmedQuantity: res_det_qty, transactionalTradeItem: res_det_gtin })
                                    }
                                }
                            }
                        } else {
                            //for(let d in om_o.orderResponseLineItem){
                                const res_detail = validator(om_o.orderResponseLineItem, orderResponseDet);
                                if(res_detail.length>0){
                                    errors.push({ orderResponseDetails: res_detail })
                                } else {
                                    const res_det_qty = validator(om_o.orderResponseLineItem.confirmedQuantity, orderResponseDet.confirmedQuantity);
                                    const res_det_gtin = validator(om_o.orderResponseLineItem.transactionalTradeItem, orderResponseDet.transactionalTradeItem);
                                    if(res_det_qty.length>0 || res_det_gtin.length>0){
                                        errors.push({ confirmedQuantity: res_det_qty, transactionalTradeItem: res_det_gtin })
                                    }
                                }
                            //}
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
                errors.push('El atributo '+keys[x]+' es requerido y debe ser de tipo ' +  typeof schema[keys[x]]);
            }
        } else {
            if(typeof schema[keys[x]] != 'object'){
                if(typeof schema[keys[x]] != typeof order[keys[x]]){
                    if(order[keys[x]] == null || order[keys[x]] == 'null'){
                        errors.push('El atributo '+keys[x]+' no debe enviarse como "null".');
                    } else if(order[keys[x]] == ''){
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

function xmlSchema(){
    const orderMessage = {
        "orderMessage": {
            "order": {
                "ecomDocument": {
                    "revisionnumber": "string",
                    "creationDateTime": "string",
                    "documentStatusCode": "string",
                    "documentStructureVersion": "string",
                },
                "orderIdentification": {
                    "entityIdentification": "string",
                    "contentOwner": {
                        "gln": "string",
                    }
                },
                "additionalOrderInstruction": "string",
                "buyer": {
                    "gln": "string",
                    "contact": {
                        "personName": "string",
                        "communicationChannel": {
                            "communicationChannelCode": "string",
                            "communicationValue": "string"
                        }
                    },
                    "organisationDetails": {
                        "organisationName": "string"
                    }
                },
                "seller": {
                    "gln": "string",
                    "additionalPartyIdentification": "string",
                    "organisationDetails": {
                        "organisationName": "string"
                    }
                },
                "billTo": {
                    "gln": "string",
                    "organisationDetails": {
                        "organisationName": "string"
                    }
                },
                "orderLogisticalInformation": {
                    "shipTo": {
                        "gln": "string",
                        "address": {
                            "city": "string",
                            "name": "string",
                            "postalCode": "string",
                            "state": "string",
                            "streetAdressOne": "string",
                            "providenceCode": "string",
                            "geographicalCordinates": {
                                "latitude": "string",
                                "longitude": "string"
                            }
                        }
                    },
                    "orderLogisticalDateInformation": {
                        "requestedDeliveryDateTime": {
                            "date": "string",
                            "time": "string"
                        }
                    }
                },
                "paymentTerms": {
                    "paymentTermsDescription": "string"
                },
                "totalMonetaryNetAmount": {
                    "totalMonetaryAmountExcludingTaxes": "string",
                    "currencyCode": "string"
                },
                "requestedQuantity": "string",
                "totalLineItemNumber":{
                    "lineItemNumber": "string"
                },
                "orderLineItem": [
                    {
                        "lineItemNumber": "string",
                        "requestedQuantity ": {
                            "@": {
                                "measurementUnitCode": "string"
                            },
                            "#": "string"
                        },
                        "netPrice": {
                            "@": {
                                "currencyCode": "string",
                            },
                            "#": "string",
                        },
                        "netAmount ": {
                            "@": {
                                "currencyCode": "string",
                            },
                            "#": "string",
                        },
                        "transactionalTradeItem": {
                            "gtin": "string",
                            "additionalTradeItemIdentification": "string",
                            "tradeItemQuantity": {
                                "tradeItemQuantity": "string",
                                "Measurementunitcodecontent": "string",
                            },                    
                            "tradeItemDescription": "string",
                        },
                        "allowanceCharge": {
                            "allowanceChargePercentage": "string"
                        } 
                    }
                ]
            }
        }
    };
    return orderMessage;
}


function xmlSchemaResponse(){
    const orderResponseMessage = {
        "orderResponseMessage": {
            "orderResponse": {
                "creationDateTime": "string",
                "documentStructureVersion": "string",
                "orderResponseIdentification": {
                    "entityIdentification": "string",
                    "contentOwner": {
                        "gln": "string",
                        "additionalPartyIdentification": "string",
                    }
                },
                "responseStatusCode": "string",
                "buyer": {
                    "gln": "string",
                },
                "seller": {
                    "gln": "string",
                    "contact": {
                        "personName": "string",
                        "communicationChannel": {
                            "communicationChannelCode": "string",
                            "communicationValue": "string",
                        }
                    }
                },
                "amendedDateTimeValue": {
                    "requestedDeliveryDateRange": {
                        "beginDate": "string",
                        "endDate": "string",
                    }
                },
                "salesOrder": {
                    "entityIdentification": "string",
                    "creationDateTime": "string",
                },
                "orderResponseLineItem": [
                    {
                        "originalOrderLineItemNumber": "string",
                        "deliveryDateTime": "string",
                        "Confirmedquantity": {
                            "@": {
                                "measurementUnitCode": "string",
                            },
                            "#": "string",
                        },
                        "lineItemChangeIndicator": "string",
                        "orderResponseReasonCode": "string",
                        "netPrice": {
                            "@": {
                                "Currencycode": "string",
                            },
                            "#": "string",
                        },
                        "netAmount ": {
                            "@": {
                                "Currencycode": "string",
                            },
                            "#": "string",
                        },
                        "transactionalTradeItem": {
                            "gtin": "string",
                        },
                        "allowanceChargePercentage": {
                            "Allowancepercentage": "string",
                        }
                    }
                ]
            }
        }
    };
    return orderResponseMessage;
}

function dateAndHourFormatter(date) {
    const dateAndHourFormat = new Date(date);

    const year = dateAndHourFormat.getFullYear();
    const month = String(dateAndHourFormat.getMonth() + 1).padStart(2, '0');
    const day = String(dateAndHourFormat.getDate()).padStart(2, '0');

    const newFormat = `${year}${month}${day}`;

    return newFormat;
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

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}


async function valideOrderMessage(order){
    const valid = validate_schema(order);
    console.log('order validation', order);
    console.log('order validation 2', order.root);

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
            message: 'XML válido según el esquema',
            detail: validate_schema,
            result: valid
        })),
    };
}

module.exports = {
    createFormat: createFormat,
    createFormatUl: createFormatUl,
    createFormatOrdResponse: createFormatOrdResponse,
    getXML: getXML,
    getXmlOrdResponse: getXmlOrdResponse,
}