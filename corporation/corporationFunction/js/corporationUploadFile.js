const AWS = require('aws-sdk');
const s3 = new AWS.S3();

module.exports.corporationUploadFile = async (event) => {

  let body;
  if (typeof event.body === 'string') {
    body = JSON.parse(event.body);
  } else {
    body = event.body;
  }
  const imagenBase64 = event.body.imagenBase64.replace("data:image/png;base64,", "")

  if (!imagenBase64) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Faltan campos: imagenBase64." }),
    };
  }

  const buffer = Buffer.from(imagenBase64, 'base64');

  const params = {
    // Bucket: 'gs1apiedi-dev-files', 
    Bucket: 'gs1apiedi-qa-files',
    // Bucket: 'gs1apiedi-prod-files',
    Key: `files/${event.body.nameFile}`,
    Body: buffer,
  };
  return await transaction(params);
};

async function transaction(params) {
  try {
    // Sube a S3
    const result = await s3.upload(params).promise();

    console.log('Archivo subido:', result);

    const results = await Promise.resolve(JSON.stringify({
      statusCode: 200,
      result: true, 
      message: 'Archivo subido correctamente.',
      records: {
        key: result.Key,
        url: result.Location
      },
    }));
    return results;
  } catch (err) {
    console.error('Error:', err);
    return Promise.reject(err);
  }
}