'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _baseService = require('../../baseService');

var _fetchData = require('./fetchData');

var _fetchData2 = _interopRequireDefault(_fetchData);

var _create = require('./create');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function filterDir(str) {
  str = str.replace(/\s/g, '');
  str = str.replace(/&/g, '_');
  return str;
}

function getDirectoryByExternalId(projects, externalId, currentDir) {
  var projectsLength = projects.length;
  for (var i = 0; i < projectsLength; i += 1) {
    if (projects[i].children) {
      currentDir.name.push(filterDir(projects[i].name));
      currentDir.id.push(projects[i].itemId);
      var items = projects[i].children;
      var dir = getDirectoryByExternalId(items, externalId, currentDir);
      if (dir) {
        return currentDir;
      }
      currentDir.name.pop();
      currentDir.id.pop();
    } else if (projects[i].externalId) {
      if (projects[i].externalId === externalId) {
        return currentDir;
      }
    }
  }
  return false;
}

function mkdirsSync(dirname) {
  if (_fs2.default.existsSync(dirname)) {
    return true;
  }
  if (mkdirsSync(_path2.default.dirname(dirname))) {
    _fs2.default.mkdirSync(dirname);
    return true;
  }
  return false;
}

function makeAllDir(projects, Path) {
  var projectsLength = projects.length;
  for (var i = 0; i < projectsLength; i += 1) {
    if (projects[i].children) {
      Path.push(filterDir(projects[i].name));
      var items = projects[i].children;
      makeAllDir(items, Path);
      Path.pop();
    } else if (projects[i].externalId) {
      mkdirsSync(Path.join('/'));
    }
  }
}

// TODO extends BaseService reslove babel class

var EinsteinServices = function () {
  function EinsteinServices(params) {
    _classCallCheck(this, EinsteinServices);

    this._fetchData = new _fetchData2.default(params);
  }

  _createClass(EinsteinServices, [{
    key: 'createAllDirectory',
    value: async function createAllDirectory(featuresPath) {
      if (!_fs2.default.existsSync(featuresPath)) {
        console.log('featuresPath ' + featuresPath + ' doesn\u2019t exist');
        return;
      }
      var caseDirectory = await this._fetchData.getCaseDirectory();
      try {
        makeAllDir(caseDirectory, [featuresPath]);
      } catch (error) {
        throw new Error(error);
      }
      console.log('Make all directory in ' + featuresPath + ' successfully!');
    }
  }, {
    key: 'createCaseTemplate',
    value: async function createCaseTemplate(externalId, featuresPath) {
      if (!_fs2.default.existsSync(featuresPath)) {
        console.log('featuresPath ' + featuresPath + ' doesn\u2019t exist');
        return;
      }
      var caseDirectory = await this._fetchData.getCaseDirectory();
      var caseContent = await this._fetchData.getCaseByExternalId(externalId);
      var currentDirectory = getDirectoryByExternalId(caseDirectory, externalId, { name: [featuresPath], id: [] });
      await (0, _create.create)(externalId, caseContent, currentDirectory);
    }
  }, {
    key: 'updateCaseTemplate',
    value: async function updateCaseTemplate(externalId, featuresPath) {
      if (!_fs2.default.existsSync(featuresPath)) {
        console.log('featuresPath ' + featuresPath + ' doesn\'t exist');
        return;
      }
      var caseDirectory = await this._fetchData.getCaseDirectory();
      var caseContent = await this._fetchData.getCaseByExternalId(externalId);
      var currentDirectory = getDirectoryByExternalId(caseDirectory, externalId, { name: [featuresPath], id: [] });
      await (0, _create.update)(externalId, caseContent, currentDirectory);
    }
  }]);

  return EinsteinServices;
}();

exports.default = EinsteinServices;