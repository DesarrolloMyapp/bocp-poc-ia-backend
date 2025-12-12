'use strict';
const aws = require('aws-sdk');
const ses = new aws.SES({ region: process.env.region });
const ADM_EMAIL = ['milton.rodriguez@myappsoftware.com'];
const NO_REPLY_EMAIL = 'milton.rodriguez@myappsoftware.com';

module.exports.userPreSignup = async (event) => {
    try {
        await sendNotification(event);
      event.response.autoConfirmUser = true;
  

      if (event.request.userAttributes && event.request.userAttributes.email) {
        event.response.autoVerifyEmail = true;
      }
  
      if (event.triggerSource === 'PreSignUp_ExternalProvider') {}
      if (event.triggerSource === 'PreSignUp_SignUp') {}
  
      return event;
    } catch (e) {
      console.error('PreSignUp error', e);
      return event;
    }
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
                    Data: "Pre SignUp"
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
