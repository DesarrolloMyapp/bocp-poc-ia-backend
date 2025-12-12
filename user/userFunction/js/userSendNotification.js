'use strict';
const aws = require('aws-sdk');
const ses = new aws.SES({ region: process.env.region });
const nodemailer = require("nodemailer");


module.exports.userSendNotification = async (event) => {
  
  console.log(event);
  let order = event.body.order;
  


  const email = event.body.userEmail.split(',');
    const emailSend = event.body.companyEmail;
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
                            <h1>Nueva orden de compra</h1>
                            <span>Hola, `+order.msg+` con el número no.`+order.orderNumber+` <br> </span>
                            <span> Del proveedor: `+order.orderProviderName+` </span>
                            <span>Ingresa a:  https://edi.gs1mexico.org/  para consultarla</span>
                        </body>
                    </html>
                        `
                        ,
                    }
                },
                Subject: {
                    Data: order.msg
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

};