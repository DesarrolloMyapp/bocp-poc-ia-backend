'use strict';
const aws = require('aws-sdk');
const ses = new aws.SES({ region: process.env.region });
const ADM_EMAIL = ['diego.mejia@myappsoftware.com'];
const NO_REPLY_EMAIL = 'Aspiraciones@myappsoftware.com';
// const NO_REPLY_EMAIL = 'Nomina@aspiracioneshc.com';
// const NO_REPLY_EMAIL = 'CapitalHumano@pentcloud.com';
const nodemailer = require("nodemailer");


module.exports.userVacationsLetter = async (event) => {
  
  let pdf = event.body.pdf;
  let userEmail = event.body.userEmail;
  let companyEmail = event.body.companyEmail;
  const base64RemoveDataURI = pdf.replace(
    "data:application/msword;base64,",
    ""
  );
  
  let transporter = nodemailer.createTransport({
    SES: ses,
  });

  let emailProps = await transporter.sendMail({
    from: companyEmail,
    to: userEmail,
    subject: "Firma de Carta de Solicitud de vacaciones",
    text: "message",
    html: "<div><span> Estimado Colaborador (a): <br> <br> Adjuntamos la carta de su solicitud de vacaciones ya gozadas, por favor firmar dicha carta y enviarla a este mismo correo. <br> <br> Cualquier duda o comentario quedo a la orden <br> <br> Saludos Cordiales <br> <br> Benjamín Ravanales <br> Asistente de Nóminas y Prestaciones <br> Tel: 4219-2140 </span></div>",
    attachments: [
      {
        filename: "Carta vacaciones.doc",
        content: base64RemoveDataURI,
        encoding: "base64",
      },
    ],
  });

  return emailProps;
};