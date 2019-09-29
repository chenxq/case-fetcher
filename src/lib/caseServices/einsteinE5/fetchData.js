'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _einsteinSdk = require('einstein-sdk');

var _einsteinSdk2 = _interopRequireDefault(_einsteinSdk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BASE_URL = 'https://einstein.ringcentral.com';

var FetchData = function () {
  function FetchData(_ref) {
    var _ref$servicesUrl = _ref.servicesUrl,
        servicesUrl = _ref$servicesUrl === undefined ? BASE_URL : _ref$servicesUrl,
        username = _ref.username,
        password = _ref.password,
        projectId = _ref.projectId;

    _classCallCheck(this, FetchData);

    this.einsteinSDK = new _einsteinSdk2.default(servicesUrl);
    this.itemId = null;
    if (username && password) {
      this.username = username;
      this.password = password;
    } else {
      throw new Error('please input your username and password in ringcentral-e2e-test/loginInfo.js');
    }
    this.projectId = projectId;
  }

  _createClass(FetchData, [{
    key: '_decode',
    value: function _decode(text) {
      var REGEXP_DECODE = /&\w+;/g;
      var DECODE = {
        '&amp;': '&',
        '&bsol;': '\\',
        '&sol;': '/',
        '&apos;': "'",
        '&nbsp;': ' ',
        '&quot;': '"',
        '&lt;': '<',
        '&gt;': '>'
      };
      return text.replace(REGEXP_DECODE, function ($0) {
        var handleText = $0;
        if (DECODE[$0]) {
          handleText = DECODE[$0];
        }
        return handleText;
      });
    }
  }, {
    key: '_format',
    value: function _format(text) {
      var textFilterTag = text.replace(/<[^>]*>/g, '');
      return this._decode(textFilterTag);
    }

    // TODO: use dom to get text instead of regex

  }, {
    key: 'getCaseByExternalId',
    value: async function getCaseByExternalId(externalId) {
      var _this = this;

      try {
        await this.getItemIdByExternalId(externalId);
        if (!this.itemId) {
          console.log('Your case ID ' + externalId + ' is wrong');
          return null;
        }

        var _ref2 = await this.einsteinSDK.getTestCase(this.itemId),
            item = _ref2.item;

        if (item.children) {
          item.children.forEach(function (element) {
            var expectedResult = element.expectedResult,
                name = element.name;

            element.expectedResult = expectedResult && _this._format(expectedResult);
            element.name = name && _this._format(name);
          });
        }
        var preconditions = item.preconditions,
            summary = item.summary;

        item.preconditions = preconditions && this._format(preconditions);
        item.summary = summary && this._format(summary);
        return item;
      } catch (error) {
        console.log(error);
        return null;
      }
    }
  }, {
    key: 'getItemIdByExternalId',
    value: async function getItemIdByExternalId(externalId) {
      try {
        await this.einsteinSDK.login(this.username, this.password);
        if (!this.projectId) throw new Error('Please input project ID');
        var query = {
          type: 'eq',
          property: 'project_id',
          value: this.projectId
        };
        var allDates = await this.einsteinSDK.searchTestCases(this.projectId, query);
        var projects = allDates.children[0] && allDates.children[0].children;
        await this.chooseItemIdFromAllItems(projects, externalId);
      } catch (error) {
        throw new Error(error);
      }
    }
  }, {
    key: 'chooseItemIdFromAllItems',
    value: async function chooseItemIdFromAllItems(projects, externalId) {
      var projectsLength = projects && projects.length;
      for (var i = 0; i < projectsLength; i += 1) {
        if (projects[i].children) {
          var items = projects[i].children;
          this.chooseItemIdFromAllItems(items, externalId);
        } else if (projects[i].externalId === externalId) {
          this.itemId = projects[i].itemId;
        }
      }
    }
  }, {
    key: 'getCaseDirectory',
    value: async function getCaseDirectory() {
      try {
        await this.einsteinSDK.login(this.username, this.password);
        if (!this.projectId) throw new Error('Please input project ID');
        var caseDirectory = await this.einsteinSDK.getSuites(this.projectId);
        return caseDirectory;
      } catch (error) {
        throw new Error(error);
      }
    }
  }]);

  return FetchData;
}();

exports.default = FetchData;