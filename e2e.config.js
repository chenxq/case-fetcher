const fs = require('fs');
const path = require('path');


const loginInfoPath = './loginInfo.js';
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
      // handler: './node_modules/case-fetcher/src/lib/caseServices/einsteinE5',
      handler: './dist/lib/caseServices',
      featuresPath: './src/features',
      templatePath: './template.jsx',
      projectId: (loginInfo && loginInfo.caseServices && loginInfo.caseServices.projectId) || 1309,
      username: (loginInfo && loginInfo.caseServices && loginInfo.caseServices.username) || null,
      password: (loginInfo && loginInfo.caseServices && loginInfo.caseServices.password) || null,
    }]
  }
};
