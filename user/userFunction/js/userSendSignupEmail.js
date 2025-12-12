'use strict';
const aws = require('aws-sdk');
const ses = new aws.SES({ region: process.env.region });
const ADM_EMAIL = ['milton.rodriguez@myappsoftware.com'];
const NO_REPLY_EMAIL = 'milton.rodriguez@myappsoftware.com';
const mysql2Connection = require('../../../config/db_' + process.env.stage);
const mysql = require('mysql2/promise');

module.exports.userSendSignupEmail = async (event) => {
    console.log("evento",event);
    let email = "Bienvenido";
    const attributes = event.request.userAttributes;
        event.response.emailSubject = "Bienvenido " + attributes.email + " a API EDI";
        event.response.emailMessage =  attributes.ADM_EMAIL;


    await sendNotification(event);
    // if (event.triggerSource === "CustomMessage_SignUp") {
    //     const attributes = event.request.userAttributes;
    //     // const corporation = await getCorporation(attributes['custom:corporation']);
    //     // const Bucket = 'mapplication-resourse';
    //     // const Key = 'mpayroll/email/html/mpayroll-signup-email.html';
    //     // const data = await s3.getObject({ Bucket, Key }).promise();
    //     // let email = data.Body.toString('ascii');
    //     // email = email.replace('<@userName>', attributes.name);
    //     // const link = corporation.corporationUrl + 'userAutoConfirm/' + attributes.email + '/' + event.request.codeParameter;
    //     email = "Bienvenido";
    //     event.response.emailSubject = "Bienvenido " + attributes.email + " a API EDI";
    //     event.response.emailMessage =  attributes.email;

    // }
    // if (event.triggerSource === "CustomMessage_ResendCode") {
    //     const attributes = event.request.userAttributes;
    //     email = "Bienvenido";
    //     event.response.emailSubject = "Bienvenido " + attributes.email + " a API EDI";
    //     event.response.emailMessage =  attributes.email;

    // }
    // if (event.triggerSource === "CustomMessage_ForgotPassword") {
    //     const attributes = event.request.userAttributes;
    //     email = "Bienvenido";
    //     event.response.emailSubject = "Bienvenido " + attributes.email + " a API EDI";
    //     event.response.emailMessage =  attributes.email;

    // }

    return event;
};

async function getCorporation(corporationCode) {

    const query = `
            SELECT *
            FROM corporation 
            WHERE
                corporationCode = ` + corporationCode + `;
	    `;
    return await transaction(query);
}

async function transaction(query) {
    const connection = await mysql.createConnection(mysql2Connection.options);
    try {
        let queryResult = await connection.query(query);
        const results = await Promise.resolve(queryResult[0][0]);

        await connection.end();
        return results;
    } catch (err) {
        await connection.end();
        return Promise.reject(err);
    }
}

function sendNotification(event) {
    console.log("EVENTO2",event)
    return new Promise((resolve, reject) => {
        const params = {
            Destination: {
                ToAddresses: [event.request.userAttributes.email]
            },
            Message: {
                Body: {
                    Text: {
                        Data: JSON.stringify(event),
                    }
                },
                Subject: {
                    Data: "Custom message"
                }
            },
            Source: NO_REPLY_EMAIL
        };
        console.log(params);
        ses.sendEmail(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}