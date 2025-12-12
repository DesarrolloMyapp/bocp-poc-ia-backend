'use strict';

exports.handler = async (event) => {
  console.log("Event from Bedrock Agent:", JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    body: {
      message: "Extractor funcionando correctamente",
      inputFromAgent: event.input
    }
  };
};