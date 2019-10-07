'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = create;
exports.update = update;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _generator = require('@babel/generator');

var _generator2 = _interopRequireDefault(_generator);

var _traverse = require('@babel/traverse');

var _traverse2 = _interopRequireDefault(_traverse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function compile(_ref) {
  var keys = _ref.keys,
      values = _ref.values,
      template = _ref.template;

  var renderTemplate = new (Function.prototype.bind.apply(Function, [null].concat(_toConsumableArray(keys), ['return `' + template + '`'])))();
  return renderTemplate.apply(undefined, _toConsumableArray(values));
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

function filterName(str) {
  // filter illegal characters in windows files
  str = str.replace(/[\\\\/:*?\"<>|]/g, '');
  str = str.replace(/\s/g, '_');
  str = str.replace(/\//g, '_or_');
  return str;
}

function handleCaseContent(caseContent, suiteId) {
  var update = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var baseUrl = 'http://einstein.int.ringcentral.com/?project=1309';
  suiteId.unshift(baseUrl);
  var url = suiteId.join('&suite=') + '&case=' + caseContent.id;
  var entryPoint = caseContent.preconditions.split('Entry point(/s):')[1];
  caseContent.preconditions = caseContent.preconditions.split('Account type(/s):')[0];
  caseContent = Object.assign({ url: url, entryPoint: entryPoint }, caseContent);
  for (var key in caseContent) {
    if (key === 'dateCreated' || key === 'lastUpdated') {
      caseContent[key] = new Date(caseContent[key]).toUTCString().split('GMT')[0];
    } else if (key === 'children') {
      caseContent[key] = caseContent[key].sort(function (item, next) {
        return item.order - next.order;
      });
      caseContent[key] = caseContent[key].map(function (item, index) {
        if (update) {
          item = '/*\n\t__Step' + (index + 1) + '__:' + item.name + '\n\t[Expected Result]:' + item.expectedResult + '\n*/';
        } else {
          item = '/*\n\t__Step' + (index + 1) + '__:' + item.name + '\n\t[Expected Result]:' + item.expectedResult + '\n*/\n\n';
        }
        return item;
      });
      if (!update) {
        caseContent[key] = caseContent[key].join('\n\n');
      }
    } else if (key === 'createdBy' || key === 'lastUpdatedBy' && caseContent[key] === null) {
      caseContent[key] = '';
    }
  }

  return caseContent;
}

async function create(caseId, caseContent, Directory) {
  var template = '';
  var currentDirectory = Directory.name;
  if (currentDirectory) {
    currentDirectory = currentDirectory.join('/');
  }
  var projectName = 'RCI-' + caseId + '_' + filterName(caseContent.name) + '.spec.js';
  var targetDir = currentDirectory + '/' + projectName;
  if (_fs2.default.existsSync(targetDir)) {
    console.log(targetDir + ' exists !');
    return;
  }
  _fs2.default.readFile(_path2.default.join(__dirname, '../../../../template.js'), 'utf-8', async function (err, data) {
    if (err || typeof data === 'undefined') {
      console.error('template.js doesn\'t exist in ' + _path2.default.join(__dirname, '../template.js'));
      return;
    }
    mkdirsSync(currentDirectory);
    console.log('\nCreating ...');
    template = data.toString();
    caseContent = handleCaseContent(caseContent, Directory.id, false);
    var result = compile({
      template: template,
      keys: Object.keys(caseContent),
      values: Object.values(caseContent)
    });

    _fs2.default.writeFile('' + targetDir, result, 'ascii', function (err) {
      if (err) throw err;
      console.log('Create ' + targetDir + ' successfully!');
    });
  });
}

function getUpdatedCaseByBabel(caseContent, targetDir) {
  var caseContentFiltered = caseContent.children;
  caseContentFiltered.sort(function (a, b) {
    return a.order - b.order;
  });
  var lastStepInAst = void 0;
  var leadingCommentsNumber = 0;
  var trailingCommentsNumber = 0;
  var goalBlockStatementLoc = void 0;
  var updateCommentVisitor = {
    ExpressionStatement: function ExpressionStatement(path) {
      var _path$node = path.node,
          trailingComments = _path$node.trailingComments,
          leadingComments = _path$node.leadingComments;

      var areTrailingComments = trailingComments && trailingComments.length > 0;
      var areLeadingComments = leadingComments && leadingComments.length > 0;
      if (areTrailingComments || areLeadingComments) {
        goalBlockStatementLoc = goalBlockStatementLoc || {
          start: path.parent.start,
          end: path.parent.end
        };
        var comments = trailingComments || leadingComments;
        var number = areTrailingComments ? trailingCommentsNumber : leadingCommentsNumber;
        for (var i = 0; i < comments.length; i++) {
          var e = comments[i];
          if (e.type === 'CommentBlock' && /_Step\d+_/.test(e.value)) {
            var oneCaseContent = caseContentFiltered[number];
            lastStepInAst = number;
            number++;
            if (areTrailingComments) {
              trailingCommentsNumber++;
            } else {
              leadingCommentsNumber++;
            }
            if (oneCaseContent) {
              var name = oneCaseContent.name,
                  expectedResult = oneCaseContent.expectedResult;

              e.value = '\n\t__Step' + number + '__:' + name + '\n\t[Expected Result]:' + expectedResult;
            } else {
              // There are less steps from origin than local
              comments.splice(i);
              break;
            }
          }
        }
      }
    }
  };

  var addCommentVisitor = {
    BlockStatement: function BlockStatement(path) {
      var _path$node2 = path.node,
          start = _path$node2.start,
          end = _path$node2.end,
          body = _path$node2.body;

      if (start === goalBlockStatementLoc.start && end === goalBlockStatementLoc.end) {
        // There are more steps from origin than local
        if (caseContentFiltered.length > lastStepInAst + 1) {
          var lastItem = body[body.length - 1];
          var restComments = caseContentFiltered.splice(lastStepInAst + 1);
          var newComments = restComments.map(function (e, index) {
            return {
              type: 'CommentBlock',
              value: '\n\t__Step' + (lastStepInAst + 2 + index) + '__:' + e.name + '\n\t[Expected Result]:' + e.expectedResult
            };
          });
          var trailingComments = lastItem.trailingComments,
              leadingComments = lastItem.leadingComments;

          if (trailingComments) {
            lastItem.trailingComments = [].concat(_toConsumableArray(trailingComments), _toConsumableArray(newComments));
          } else if (leadingComments) {
            lastItem.leadingComments = [].concat(_toConsumableArray(leadingComments), _toConsumableArray(newComments));
          }
        }
      }
    }
  };

  var file = _fs2.default.readFileSync(targetDir);
  var code = file.toString();
  var parseRes = require('@babel/parser').parse(code, {
    sourceType: 'module'
  });
  (0, _traverse2.default)(parseRes, updateCommentVisitor);
  (0, _traverse2.default)(parseRes, addCommentVisitor);
  var output = (0, _generator2.default)(parseRes, {
    retainFunctionParens: true
  }, code);
  return output.code;
}

function getUpdateCaseByRegex(caseContent, Directory, targetDir) {
  caseContent = handleCaseContent(caseContent, Directory.id, true);
  var data = _fs2.default.readFileSync(targetDir, 'utf-8');
  var str = data.match(/(\/\*(.|\s)*?\*\/)/g);
  var steps = caseContent.children;
  var reg = new RegExp('__Step');
  var title_new = '/* RCI-' + caseContent.externalId + ': ' + caseContent.name + '\n  ' + caseContent.url + '\n\n  Preconditions:' + caseContent.preconditions + '\n  Entry point(/s):' + caseContent.entryPoint + '\n  */';
  var title_reg = new RegExp('RCI-(\\d+)');
  for (var i = 0; i < str.length; i++) {
    if (title_reg.test(str[i])) {
      if (str[i] !== title_new) {
        str[i] = title_new;
      }
    }
  }
  for (var _i = 0, j = 0; _i < str.length; _i++) {
    if (reg.test(str[_i])) {
      if (str[_i] !== steps[j]) {
        str[_i] = steps[j];
      }
      j++;
    }
    if (_i === str.length - 1 && steps.length > j) {
      for (var k = j; k < steps.length; k++) {
        str[_i] = str[_i] + '\n\n' + steps[k];
      }
    }
  }

  var result = data.match(/(\/\*(.|\s)*?\*\/)/g);
  if (result && result.length > 0) {
    for (var _i2 = 0; _i2 < result.length; _i2++) {
      if (str[_i2]) {
        data = data.replace(result[_i2], str[_i2]);
      }
    }
  }
  return data;
}

async function update(caseId, caseContent, Directory, useBabel) {
  var currentDirectory = Directory.name;
  caseContent = caseContent.item;
  if (currentDirectory) {
    currentDirectory = currentDirectory.join('/');
  }
  var projectName = 'RCI-' + caseId + '_' + filterName(caseContent.name) + '.spec.js';
  var targetDir = currentDirectory + '/' + projectName;
  if (!_fs2.default.existsSync(targetDir)) {
    console.log(targetDir + ' doesn\'t exists !');
    return;
  }
  var data = useBabel ? getUpdatedCaseByBabel(caseContent, targetDir) : getUpdateCaseByRegex(caseContent, Directory, targetDir);
  _fs2.default.writeFile('' + targetDir, data, 'ascii', function (err) {
    if (err) throw err;
    console.log('Update ' + targetDir + ' successfully!');
  });
}