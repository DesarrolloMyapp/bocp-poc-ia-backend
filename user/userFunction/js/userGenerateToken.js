const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const poolData = {
  // dev
  // UserPoolId: 'us-east-1_wRR4NYc0U',
  // ClientId: 'gaade74p9qus032l84nmcfe99',

  // qa
  UserPoolId: 'us-east-1_SnAcLjhgG',
  ClientId: '7r0biqlhuj5i52j6r66c1m6fmn',

  // prod
  // UserPoolId: 'us-east-1_1321uiLUz',
  // ClientId: '5t6uvjugq3g5r38a4n070j0l82',
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

module.exports.userGenerateToken = async (event) => {
  console.log('event', event.body);

  const username = event.body.userName;
  const password = event.body.userPassword;

  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: username,
    Password: password,
  });

  const userData = {
    Username: username,
    Pool: userPool,
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  try {
    console.log('try')
    const session = await new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => resolve(session),
        onFailure: (err) => reject(err),
        newPasswordRequired: (userAttributes) => resolve({ newPasswordRequired: true, userAttributes }),
      });
    });

    const accessToken = session.getIdToken().getJwtToken();
    return { token: accessToken };
  } catch (error) {
    return Promise.reject(error);
  }
};
