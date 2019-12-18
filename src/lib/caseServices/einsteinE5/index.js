"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _baseService = require("../../baseService");

var _fetchData = _interopRequireDefault(require("./fetchData"));

var _createAC = require("./createAC");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function filterDir(str) {
  str = str.replace(/\s/g, '');
  str = str.replace(/&/g, '_');
  return str;
}

function getDirectoryByExternalId(projects, externalId, currentDir) {
  const projectsLength = projects.length;

  for (let i = 0; i < projectsLength; i += 1) {
    if (projects[i].children) {
      currentDir.name.push(filterDir(projects[i].name));
      currentDir.id.push(projects[i].itemId);
      const items = projects[i].children;
      const dir = getDirectoryByExternalId(items, externalId, currentDir);

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
  if (_fs.default.existsSync(dirname)) {
    return true;
  }

  if (mkdirsSync(_path.default.dirname(dirname))) {
    _fs.default.mkdirSync(dirname);

    return true;
  }

  return false;
}

function makeAllDir(projects, Path) {
  const projectsLength = projects.length;

  for (let i = 0; i < projectsLength; i += 1) {
    if (projects[i].children) {
      Path.push(filterDir(projects[i].name));
      const items = projects[i].children;
      makeAllDir(items, Path);
      Path.pop();
    } else if (projects[i].externalId) {
      mkdirsSync(Path.join('/'));
    }
  }
} // TODO extends BaseService reslove babel class


class EinsteinServices {
  constructor(params) {
    this._fetchData = new _fetchData.default(params);
  }

  async createAllDirectory(featuresPath) {
    if (!_fs.default.existsSync(featuresPath)) {
      console.log(`featuresPath ${featuresPath} doesn’t exist`);
      return;
    }

    const caseDirectory = await this._fetchData.getCaseDirectory();

    try {
      makeAllDir(caseDirectory, [featuresPath]);
    } catch (error) {
      throw new Error(error);
    }

    console.log(`Make all directory in ${featuresPath} successfully!`);
  }

  async createCaseTemplate(externalId, featuresPath, templatePath) {
    if (!_fs.default.existsSync(featuresPath)) {
      console.log(`featuresPath ${featuresPath} doesn’t exist`);
      return;
    }

    const caseDirectory = await this._fetchData.getCaseDirectory();
    const caseContent = await this._fetchData.getCaseByExternalId(externalId);
    const currentDirectory = getDirectoryByExternalId(caseDirectory, externalId, {
      name: [featuresPath],
      id: []
    });
    await (0, _createAC.create)(externalId, caseContent, currentDirectory, templatePath);
  }

  async updateCaseTemplate(externalId, featuresPath) {
    if (!_fs.default.existsSync(featuresPath)) {
      console.log(`featuresPath ${featuresPath} doesn't exist`);
      return;
    }

    const caseDirectory = await this._fetchData.getCaseDirectory();
    const caseContent = await this._fetchData.getCaseByExternalId(externalId);
    const currentDirectory = getDirectoryByExternalId(caseDirectory, externalId, {
      name: [featuresPath],
      id: []
    });
    await (0, _createAC.update)(externalId, caseContent, currentDirectory);
  }

}

exports.default = EinsteinServices;