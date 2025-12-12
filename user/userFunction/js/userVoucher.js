'use strict';
const aws = require('aws-sdk');
const ses = new aws.SES({ region: process.env.region });
const ADM_EMAIL = ['milton.rodriguez@myappsoftware.com'];
const NO_REPLY_EMAIL = 'milton.rodriguez@myappsoftware.com';
const nodemailer = require("nodemailer");


module.exports.userVoucher = async (event) => {
  
  let pdf = event.body.pdf;
  let userEmail = event.body.userEmail;
  const base64RemoveDataURI = pdf.replace(
    "data:application/pdf;base64,",
    ""
  );
  
  let transporter = nodemailer.createTransport({
    SES: ses,
  });

  let emailProps = await transporter.sendMail({
    from: NO_REPLY_EMAIL,
    to: userEmail,
    subject: "Boleta de Pago Salarial",
    text: "message",
    html: "<div><span> Estimado Colaborador (a): <br> <br> Adjuntamos la Boleta de Pago correspondiente al mes en curso, donde podrá verificar los ingresos y descuentos realizados, así mismo, el Neto Cobrado transferido a su cuenta bancaria registrada en nuestro sistema. <br> <br> De tener alguna duda respecto al pago, contactar a su ejecutiva de cuenta asignada. <br> <br> Atentamente, <br> Departamento de Nóminas y Prestaciones Laborales </span></div>",
    attachments: [
      {
        filename: "Boleta.pdf",
        content: base64RemoveDataURI,
        encoding: "base64",
      },
    ],
  });

  return emailProps;
};