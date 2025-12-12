const axios = require('axios');

module.exports.orderGetRFC = async (event) => {
    const params = event.body;

    return await transaction(params);
};

async function transaction(params) {
    // const username = '7505000350009';
    // const password = 'MhbCl4eQO$';
  
    // const base64Credentials = Buffer.from(username + ':' + password).toString('base64');
  
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + 'R1MxUmVnaXN0cnk6dkxuMTJzUjdRYTg4JQ=='
    };
    console.log('body', params);
    console.log('headers', headers);


    let config = {
        method:'get',
        maxBodyLenght: Infinity,
        url:'https://6d6j5r4cdl.execute-api.us-east-1.amazonaws.com/v1/getentitybyrfcpartygln',
        headers:headers,
        data:params
    }

    return axios.request(config)
    .then( response => {
        console.log('Success:', response);
        return {
            statusCode: 200,
            body: response.data,
        };
    })
    .catch(error => {
        console.error('Error:', error);

        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ result: false, message: '', records: error }),
        };
    });
    
}

