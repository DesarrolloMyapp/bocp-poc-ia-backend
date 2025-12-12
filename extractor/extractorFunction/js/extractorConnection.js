'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log("Event from Bedrock Agent:", JSON.stringify(event, null, 2));

  // Parámetro enviado por el agente
  const fileKey = event.parameters?.fileKey;
  const bucket = process.env.BUCKET_NAME; // LO DEFINES EN SERVERLESS O EN LAMBDA ENV

  if (!fileKey) {
    return formatResponse("No recibí fileKey desde el agente.");
  }

  try {
    const obj = await s3.getObject({ Bucket: bucket, Key: fileKey }).promise();

    const sizeMB = (obj.ContentLength / (1024 * 1024)).toFixed(2);

    return formatResponse(`
      Archivo recibido y leído desde S3 correctamente.
      Bucket: ${bucket}
      Key: ${fileKey}
      Tamaño: ${sizeMB} MB
      Tipo: ${obj.ContentType}
    `);

  } catch (err) {
    console.error("Error leyendo archivo S3:", err);
    return formatResponse(`Error leyendo archivo S3: ${err.message}`);
  }
};

// respuesta en formato Bedrock Agent
function formatResponse(message) {
  return {
    messageVersion: "1.0",
    response: {
      actionGroup: "miActionGroup",
      function: "miFuncion",
      output: {
        text: message
      }
    }
  };
}
