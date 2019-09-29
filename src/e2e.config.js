const fs = require('fs');
const path = require('path');


const loginInfoPath = '../loginInfo.js';
const isExists = fs.existsSync(path.resolve(__dirname, loginInfoPath));
const loginInfo = isExists ? require(loginInfoPath) : {};

module.exports = {
  caseServices: {
    originField: 'origin',
    handlerField: 'handler',
    projectIdField: 'projectId',
    urlField: 'url',
    defaultOrigin: 'einstein',
    list: [{
      origin: 'einstein',
      url: 'http://einstein.int.ringcentral.com/',
      handler: require('./caseServices/einstein'),
      featuresPath: './src/features',
      projectId: loginInfo && loginInfo.caseServices && loginInfo.caseServices.projectId || 1309,
      username: loginInfo && loginInfo.caseServices && loginInfo.caseServices.username || null,
      password: loginInfo && loginInfo.caseServices && loginInfo.caseServices.password || null,
    }]
  }
};
