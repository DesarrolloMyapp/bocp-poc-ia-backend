const axios = require('axios');

module.exports.orderGetProduct = async (event) => {
    const params = event.body;

    return await transaction(params);
};

async function transaction(params) {
    const username = '7505000350009';
    const password = 'MhbCl4eQO$';
  
    const base64Credentials = Buffer.from(username + ':' + password).toString('base64');
  
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + base64Credentials
    };
    console.log('body', params);
    console.log('headers', headers);

    return axios.post('https://apisync.syncfonia.com/wsproxy/apiServices/tradeItemService.svc/Get', params, { headers })
    .then( response => {
        console.log('Success:', response);
        return {
            statusCode: 200,
            body: JSON.stringify({ result: true, message: '', records: response.data }),
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