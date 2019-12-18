import fs from 'fs';
import path from 'path';
import FetchData from './fetchData';
import { create } from './createAC';
import { update } from './create';

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
  if (fs.existsSync(dirname)) {
    return true;
  }
  if (mkdirsSync(path.dirname(dirname))) {
    fs.mkdirSync(dirname);
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
}

// TODO extends BaseService reslove babel class
export default class EinsteinServices {
  _fetchData: FetchData;
  constructor(params) {
    this._fetchData = new FetchData(params);
  }

  async createAllDirectory(featuresPath) {
    if (!fs.existsSync(featuresPath)) {
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
    if (!fs.existsSync(featuresPath)) {
      console.log(`featuresPath ${featuresPath} doesn’t exist`);
      return;
    }
    const caseDirectory = await this._fetchData.getCaseDirectory();
    const caseContent = await this._fetchData.getCaseByExternalId(externalId);
    const currentDirectory = getDirectoryByExternalId(
      caseDirectory,
      externalId,
      { name: [featuresPath], id: [] },
    );
    await create(externalId, caseContent, currentDirectory);
  }

  async updateCaseTemplate(externalId, featuresPath) {
    if (!fs.existsSync(featuresPath)) {
      console.log(`featuresPath ${featuresPath} doesn't exist`);
      return;
    }
    const caseDirectory = await this._fetchData.getCaseDirectory();
    const caseContent = await this._fetchData.getCaseByExternalId(externalId);
    const currentDirectory = getDirectoryByExternalId(
      caseDirectory,
      externalId,
      { name: [featuresPath], id: [] },
    );
    await update(externalId, caseContent, currentDirectory);
  }
}
