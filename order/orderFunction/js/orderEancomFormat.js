async function createFormat(order) {
    const ord = order[0][0];
    const ordDet = order[1][0];

    const orderDate = dateFormatter(ord.orderDate);
    const orderDateEmbark = dateFormatter(ord.orderDateEmbark);
    const orderCreate = dateFormatter(ord.orderDateCreate)

    const seg01 = generateSegment(['UNB+', 'UN0A:4+', ord.userAuthOwnerShipDataSender, ':14+', ord.orderProviderCode, ':14+', orderCreate, ':1000+', ord.orderTypeID]);
    const seg02 = generateSegment(['UNH+', ord.orderCode, '+ORDERS:', 'D:01B:UN:EAN010']);
    const seg03 = generateSegment(['BGM+', '220+', ord.orderNumber, '+9']);
    const seg04 = generateSegment(['DTM+', '137:', orderDate, ':102']);
    const seg05 = generateSegment(['DTM+', '2:', orderDateEmbark, ':203']);
    const seg06 = generateSegment(['FTX+', 'PUR+1++', ord.orderInstruction ]);
    const seg07 = generateSegment(['RFF+', 'ON:', ord.orderNumber]);

    const seg08 = generateSegment(['NAD+', 'BY+', ord.orderBuyerGLN, '::9++', ord.orderBillToTradeName]);
    const seg09 = generateSegment(['LOC+', '7+', ord.glnLocation, '::9']);
    const seg10 = generateSegment(['CTA+', 'OC+:', ord.orderEmissionName]);
    const seg11 = generateSegment(['COM+', ord.orderCommunicationValue, ':', ord.orderCommunicationChannel]);

    const seg12 = generateSegment(['NAD+', 'IV+', ord.orderBillToOrderGLN, '::9++', ord.orderBillTo]);

    const seg13 = generateSegment(['NAD+', 'SU+', ord.orderSellerGLN, '::9++', ord.orderTradeName]);
    const seg14 = generateSegment(['RFF+', 'IA+', ord.orderInternalProviderCode]);

    const seg15 = generateSegment(['PAT+', '7++5:3:D:', ord.orderDeliveryTerm]);
    const seg16 = generateSegment(['CUX+', '2:', ord.currencyCode, ':9']);

    const segDt = [];
    for (var x in ordDet) {
        const seg17 = generateSegment(['LIN+', ordDet[x].orderItemCode, '++', ordDet[x].orderDUN14, ':SRV']);
        const seg18 = generateSegment(['PIA+', '1+',ordDet[x].orderOrderClientCode,':IN']);
        const seg19 = generateSegment(['IMD+', 'F++:::',ordDet[x].orderDescription]);
        const seg20 = generateSegment(['QTY+', '21:', ordDet[x].orderQuantity, ':', ordDet[x].orderUM]);
        const seg21 = generateSegment(['MOA+', '203:', ordDet[x].orderAmount]);
        const seg22 = generateSegment(['CUX+', '2:', ord.currencyCode, ':9']);
        const seg23 = generateSegment(['PRI+', 'AAA:', ordDet[x].orderPrice]);
        const seg24 = generateSegment(['CUX+', '2:', ord.currencyCode, ':9']);
        const seg25 = generateSegment(['QTY+', '52:', ordDet[x].orderNetContent, ':', ordDet[x].orderUMNetContent]);
        const seg26 = generateSegment(['PCD+', '3:', ordDet[x].orderDiscount]);
        segDt.push(seg17,seg18,seg19,seg20,seg21,seg22,seg23,seg24,seg25,seg26);
    }

    const seg27 = segmentGroup(segDt);
    const seg28 = generateSegment(['UNS+', 'S']);
    const seg29 = generateSegment(['MOA+', '79:', ord.orderTotalAmount]);
    const seg30 = generateSegment(['CNT+', '1:', ord.orderTotalUnits]);
    const seg31 = generateSegment(['CNT+', '2:', ord.orderTotalItems]);
    const seg32 = generateSegment(['UNT+', 21+segDt.length, '+', ord.orderCode]);
    const seg33 = generateSegment(['UNZ+', '1:', ord.orderTypeID, "'"]);

    const segments = [seg01,seg02,seg03,seg04,seg05,seg06,seg07,seg08,seg09,seg10,seg11,seg12,seg13,seg14,seg15,seg16,seg27,seg28,seg29,seg30,seg31,seg32,seg33];
 
    const eancom = segmentGroup(segments);
    return eancom;
}

async function createFormatOrdResponse(order){
    const ord = order[0][0];
    const ordDet = order[1][0];

    const orderDate = dateFormatter(ord.orderDate);
    const orderCreate = dateFormatter(ord.orderDateCreate);
    const orderResponseCreationDate = dateFormatter(ord.orderResponseCreationDate);

    const seg01 = generateSegment(['UNB+', 'UN0A:4+', ord.userAuthOwnerShipDataSender, ':14+', ord.orderProviderCode, ':14+', orderCreate, ':1000+', ord.orderRevisionNumber]);
    const seg02 = generateSegment(['UNH+', ord.orderCode, '+ORDRSP:', 'D:01B:UN:EAN010']);
    const seg03 = generateSegment(['BGM+', '231+', ord.orderNumber, '+', statusCodeEdi(ord.orderStatusCode)]);
    const seg04 = generateSegment(['DTM+', '137:', orderResponseCreationDate, ':102']);
    const seg05 = generateSegment(['RFF+', 'ON:', ord.orderNumber]);
    const seg06 = generateSegment(['DTM+', '137:', orderDate, ':102']);

    const seg07 = generateSegment(['NAD+', 'BY+', ord.orderBuyerGLN, '::9']);

    const seg08 = generateSegment(['NAD+', 'SU+', ord.orderSellerGLN, '::9++']);
    const seg09 = generateSegment(['RFF+', 'IA+', ord.orderInternalProviderCode]);
    const seg10 = generateSegment(['CTA+', 'OC+:', ord.orderProviderName]);
    const seg11 = generateSegment(['COM+', ord.orderCommunicationValue, ':', ord.orderCommunicationChannel]);

    const segDt = [];
    if((ord.orderStatusCode == 'MODIFIED' || ord.orderStatusCode == 'REJECTED') && ordDet.length>0){
        for (var x in ordDet) {
    
            const orderConfirmedDeliveryDate = dateFormatter(ordDet[x].orderConfirmedDeliveryDate);

            const seg12 = generateSegment(['LIN+', ordDet[x].orderItemCode, '+', statusNameLIne(ordDet[x].orderResponseStatusCode), '+', ordDet[x].orderDUN14, ':SRV']);
            const seg13 = generateSegment(['QTY+', '21:', ordDet[x].orderConfirmedQuantity, ':', ordDet[x].orderMeasurementUnitCode]);
            const seg14 = generateSegment(['DTM+', '2:', orderConfirmedDeliveryDate, ':203']);
            const seg15 = generateSegment(['QVR+', ordDet[x].orderQuantity-ordDet[x].orderConfirmedQuantity, ':21', '++', ordDet[x].orderReasonStatus]);
            const seg16 = generateSegment(['MOA+', '203:', ordDet[x].orderConfirmedAmount]);
            const seg17 = generateSegment(['CUX+', '2:', ord.currencyCode, ':9']);
            const seg18 = generateSegment(['PRI+', 'AAA:', ordDet[x].orderConfirmedPrice]);
            const seg19 = generateSegment(['CUX+', '2:', ord.currencyCode, ':9']);
            const seg20 = generateSegment(['PCD+', '3:', ordDet[x].orderDiscount]);
            segDt.push(seg12,seg13,seg14,seg15,seg16,seg17,seg18,seg19,seg20);
        }
    }
    
    const seg23 = segmentGroup(segDt);
    const seg24 = generateSegment(['UNS+', 'S']);
    const seg25 = generateSegment(['CNT+', '2:', ordDet.length]);
    const seg26 = generateSegment(['UNT+', 14+segDt.length, '+', ord.orderCode, "'"]);

    const segments = [seg01,seg02,seg03,seg04,seg05,seg06,seg07,seg08,seg09,seg10,seg11,seg23,seg24,seg25,seg26];
 
    const eancom = segmentGroup(segments);
    console.log('ediii', eancom)
    return eancom;
}

async function getEdi(order){
    console.log('getEdi', order);

    // const orderBase64 = Buffer.from(order,'base64').toString('utf-8');
    // console.log('decode order', orderBase64);

    const edi = order.replace(/\n/g, '');
    const edi_r = edi.replace("?'", "?");
    const arr = edi_r.split("'");
    for(var x in arr){
        arr[x]= arr[x].split(/[+:]/);
    }
    console.log('edi', arr);

    const newOrder = {
        "orderNumber": arr[2][2].replace("?","'"),
        "orderProviderCode": arr[0][5].replace("?","'"),
        "orderInternalProviderCode": arr[13][2].replace("?","'"),
        "orderProviderName": arr[12][6].replace("?","'"),
        "orderTradeName": arr[12][6].replace("?","'"),
        "orderBillToOrderGLN":  arr[11][2].replace("?","'"),
        "orderBillTo":  arr[11][6].replace("?","'"),
        "orderBillToTradeName":  arr[7][6].replace("?","'"),
        "orderEmissionName": arr[9][3].replace("?","'"),
        "orderEmbarkTo": 0,
        "orderControlID": arr[0][9].replace("?","'"),
        //"orderDate": dateFormatter2(arr[3][2]),
        "orderDateEmbark": dateFormatter2(arr[4][2]),
        "orderDeliveryTerm": arr[14][6].replace("?","'"),
        "orderTypeID":  0,
        "orderTotalItems": parseFloat(arr[arr.length-4][2].replace("?","'")),
        "orderTotalUnits": parseFloat(arr[arr.length-5][2].replace("?","'")),
        "orderTotalAmount": arr[arr.length-6][2].replace("?","'"),
        "orderCommunicationChannel": arr[10][2].replace("?","'"),
        "orderCommunicationValue": arr[10][1].replace("?","'"),
        "orderDocumentStatusCode": "ORIGINAL",
        "orderInstruction": arr[5][4].replace("?","'"),
        "orderCurrencyCode": arr[15][2].replace("?","'"),
        "orderBuyerGLN": arr[7][2].replace("?","'"),
        "orderSellerGLN": arr[12][2].replace("?","'"),
        "orderLocationGln": arr[8][2].replace("?","'"),
        "orderDetails": [],
    }
    const totalItems = parseInt(arr[arr.length-4][2]);
    var line = 16;
    for (let i = 0; i < totalItems; i++) {
        const obj = {
            "orderItemCode": parseFloat(arr[line][1].replace("?","'")),
            "orderEAN": 0,
            "orderOrderClientCode": arr[line+1][2].replace("?","'"),
            "orderOrderClientCodeIntern": '',
            "orderDUN14": arr[line][3].replace("?","'"),
            "orderUM": arr[line+3][3].replace("?","'"),
            "orderDescription": arr[line+2][6].replace("?","'"),
            "orderQuantity": parseFloat(arr[line+3][2].replace("?","'")),
            "orderDiscount": arr[line+9][2].replace("?","'"),
            "orderPrice": arr[line+6][2].replace("?","'"),
            "orderAmount": arr[line+4][2].replace("?","'"),
            "orderPiecesPerPackage": 0,
            "orderNetContent": arr[line+8][2].replace("?","'"),
        }
        line = line+9+1;
        newOrder.orderDetails.push(obj);
    }
    console.log('order', newOrder)
    return newOrder;
}

async function getEdiOrdResponse(order){
    console.log('getEdi', order);

    // const orderBase64 = Buffer.from(order,'base64').toString('utf-8');
    // console.log('decode order response', orderBase64);

    const edi = order.replace(/\n/g, '');
    const edi_r = edi.replace("?'", "?");
    const arr = edi_r.split("'");
    for(var x in arr){
        arr[x]= arr[x].split(/[+:]/);
    }
    console.log('edi res', arr);

    const newOrderResponse = {
        "orderCode": 0,
        "orderRevisionNumber": arr[0][9].replace("?","'"),
        "orderStatusCode": statusCode(arr[2][3].replace("?","'")),
        "orderDeliveryStartPeriod": null,
        "orderDeliveryEndPeriod": null,
        "orderProviderCode": arr[0][5].replace("?","'"),
        "orderInternalProviderCode": arr[8][2].replace("?","'"),
        "orderProviderName": arr[9][3].replace("?","'"),
        "orderBuyerGLN": arr[6][2].replace("?","'"),
        "orderSellerGLN": arr[7][2].replace("?","'"),
        "orderCommunicationChannel": arr[10][2].replace("?","'"),
        "orderCommunicationValue": arr[10][1].replace("?","'"),
        "orderNumber": arr[4][2].replace("?","'"),
        "orderDetails": [],
    }
    const totalItems = parseInt(arr[arr.length-3][2]);

    if(arr[2][3] == 4 || arr[2][3] == 27){
        var line = 11;
        for (let i = 0; i < totalItems; i++) {

            if(i != 0){
                line = line+9;
            } else {
                line = line;
            }
            const obj = {
                "orderItemCode": parseFloat(arr[line][1].replace("?","'")),
                "orderDUN14": arr[line][3].replace("?","'"),
                "orderConfirmedDeliveryDate": arr[line+2][2].replace("?","'"),
                "orderConfirmedQuantity": parseFloat(arr[line+1][2].replace("?","'")),
                "orderMeasurementUnitCode": arr[line+1][3].replace("?","'"),
                "orderConfirmedPrice": arr[line+6][2].replace("?","'"),
                "orderConfirmedAmount": arr[line+4][2].replace("?","'"),
                "orderConfirmedDiscount": arr[line+8][2].replace("?","'"),
                "orderResponseStatusCode": statusCodeLIne(arr[line][2].replace("?","'")),
                "orderReasonStatus": arr[line+3][4].replace("?","'"),
            }
            newOrderResponse.orderDetails.push(obj);
        }
    }
    
    console.log('order', newOrderResponse)
    return newOrderResponse;
}

function statusCode(s){
    let status = '';
    switch(s){
        case '4':
                status = 'MODIFIED';
            break;
        case '29':
                status = 'ACCEPTED'
            break;
        case '27':
                status = 'REJECTED'
            break;
        default:
                status = 'Código Invalido estado de respuesta.';
            break;
    }
    return status;
}


function statusCodeEdi(s){
    let status = 0;
    switch(s){
        case 'MODIFIED':
                status = 4;
            break;
        case 'ACCEPTED':
                status = 29
            break;
        case 'REJECTED':
                status = 27
            break;
        default:
                status = 0;
            break;
    }
    return status;
}

function statusCodeLIne(s){
    let status = '';
    switch(s){
        case '3':
                status = 'MODIFIED';
            break;
        case '5':
                status = 'ACCEPTED';
            break;
        case '7':
                status = 'REJECTED';
            break;
        default:
                status = 'Código Invalido estado de respuesta.';
            break;
    }
    return status;
}

function statusNameLIne(s){
    let status = 0;
    switch(s){
        case 'MODIFIED':
                status = 3;
            break;
        case 'ACCEPTED':
                status = 5;
            break;
        case 'REJECTED':
                status = 7;
            break;
        default:
                status = 0;
            break;
    }
    return status;
}

function dateFormatter(date) {
    const dateFormat = new Date(date);

    const year = dateFormat.getFullYear();
    const month = String(dateFormat.getMonth() + 1).padStart(2, '0');
    const day = String(dateFormat.getDate()).padStart(2, '0');

    const newFormat = `${year}${month}${day}`;

    return newFormat;
}

function dateFormatter2(date){
    const dateString = date;

    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);

    const newDate = `${year}-${month}-${day}`;
    return newDate;
}

function generateSegment(seg) {
    return seg.join('');
}

function segmentGroup(seg){
    return seg.join("'\n ");
}

module.exports = {
    createFormat: createFormat,
    createFormatOrdResponse: createFormatOrdResponse,
    getEdi: getEdi,
    getEdiOrdResponse: getEdiOrdResponse
}