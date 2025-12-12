'use strict';
const aws = require('aws-sdk');
const ses = new aws.SES({ region: process.env.region });
const dynamodb = new aws.DynamoDB.DocumentClient();
const ADM_EMAIL = ['milton.rodriguez@myappsoftware.com'];
const NO_REPLY_EMAIL = 'milton.rodriguez@myappsoftware.com';

module.exports.userPostConfirmation = async (event) => {
    await sendNotification(event);
    return event;
};

function sendNotification(event) {
    return new Promise((resolve, reject) => {
        const params = {
            Destination: {
                ToAddresses: ADM_EMAIL
            },
            Message: {
                Body: {
                    Text: {
                        Data: JSON.stringify(event),
                    }
                },
                Subject: {
                    Data: "POST Confirmation"
                }
            },
            Source: NO_REPLY_EMAIL
        };

        ses.sendEmail(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}
