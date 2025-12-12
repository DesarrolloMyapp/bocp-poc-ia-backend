'use strict';
const aws = require('aws-sdk');
const ses = new aws.SES({ region: process.env.region });
const ADM_EMAIL = ['milton.rodriguez@myappsoftware.com'];
const NO_REPLY_EMAIL = 'milton.rodriguez@myappsoftware.com';

module.exports.userNotificationCredencials = async (event) => {
    await sendNotification(event);
    return event;
};

function sendNotification(event) {
    const email = event.body.userName.split(',');
    const emailSend = NO_REPLY_EMAIL;
    return new Promise((resolve, reject) => {
        const date = Date.now();
        const params = {
            Destination: {
                ToAddresses: email,
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data:
                            `
                        <html>
                            <body style="text-align: center;">
                                <img src="https://gs1apiedi-prod-files.s3.amazonaws.com/gs1Logo2.png" width="200px" alt="">
                                <img src="https://gs1apiedi-prod-files.s3.amazonaws.com/Logo-negro-Enlacedi.png" width="200px" alt="">
                                <br>
                                <h1>Bienvenido a GS1 EDI</h1>
                                <h3>Usuario: </h3> <span>` + event.body.userName + `</span>
                                <h3>Contraseña:</h3><span> ` + event.body.userPassword + `</span>
                                <h3>Link de Acceso:</h3><span> https://edi.gs1mexico.org/loginAdmin </span>
                            </body>
                        </html>
                        `
                        ,
                    }
                },
                Subject: {
                    Data: 'GS1 API EDI - Credenciales '
                }
            },
            Source: emailSend
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