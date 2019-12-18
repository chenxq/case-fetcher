import EinsteinSDK from 'einstein-sdk';

const BASE_URL = 'https://einstein.ringcentral.com';

export default class FetchData {
  einsteinSDK: any;
  itemId: any;
  username: any;
  password: any;
  projectId: any;
  constructor({ servicesUrl = BASE_URL, username, password, projectId }) {
    this.einsteinSDK = new EinsteinSDK(servicesUrl);
    this.itemId = null;
    if (username && password) {
      this.username = username;
      this.password = password;
    } else {
      throw new Error(
        'please input your username and password in ringcentral-e2e-test/loginInfo.js',
      );
    }
    this.projectId = projectId;
  }

  _decode(text) {
    const REGEXP_DECODE = /&\w+;/g;
    const DECODE = {
      '&amp;': '&',
      '&bsol;': '\\',
      '&sol;': '/',
      '&apos;': "'",
      '&nbsp;': ' ',
      '&quot;': '"',
      '&lt;': '<',
      '&gt;': '>',
    };
    return text.replace(REGEXP_DECODE, ($0) => {
      let handleText = $0;
      if (DECODE[$0]) {
        handleText = DECODE[$0];
      }
      return handleText;
    });
  }

  _format(text) {
    const textFilterTag = text.replace(/<[^>]*>/g, '');
    return this._decode(textFilterTag);
  }

  // TODO: use dom to get text instead of regex
  async getCaseByExternalId(externalId) {
    try {
      await this.getItemIdByExternalId(externalId);
      if (!this.itemId) {
        console.log(`Your case ID ${externalId} is wrong`);
        return null;
      }
      const { item } = await this.einsteinSDK.getTestCase(this.itemId);
      if (item.children) {
        item.children.forEach((element) => {
          const { expectedResult, name } = element;
          element.expectedResult =
            expectedResult && this._format(expectedResult);
          element.name = name && this._format(name);
        });
      }
      const { preconditions, summary } = item;
      item.preconditions = preconditions && this._format(preconditions);
      item.summary = summary && this._format(summary);
      return item;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getItemIdByExternalId(externalId) {
    try {
      await this.einsteinSDK.login(this.username, this.password);
      if (!this.projectId) throw new Error('Please input project ID');
      const query = {
        type: 'eq',
        property: 'project_id',
        value: this.projectId,
      };
      const allDates = await this.einsteinSDK.searchTestCases(
        this.projectId,
        query,
      );
      const projects = allDates.children[0] && allDates.children[0].children;
      await this.chooseItemIdFromAllItems(projects, externalId);
    } catch (error) {
      throw new Error(error);
    }
  }

  async chooseItemIdFromAllItems(projects, externalId) {
    const projectsLength = projects && projects.length;
    for (let i = 0; i < projectsLength; i += 1) {
      if (projects[i].children) {
        const items = projects[i].children;
        this.chooseItemIdFromAllItems(items, externalId);
      } else if (projects[i].externalId === externalId) {
        this.itemId = projects[i].itemId;
      }
    }
  }

  async getCaseDirectory() {
    try {
      await this.einsteinSDK.login(this.username, this.password);
      if (!this.projectId) throw new Error('Please input project ID');
      const caseDirectory = await this.einsteinSDK.getSuites(this.projectId);
      return caseDirectory;
    } catch (error) {
      throw new Error(error);
    }
  }
}
