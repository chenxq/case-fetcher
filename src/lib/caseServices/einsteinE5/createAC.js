"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = create;
exports.update = update;

var _generator = _interopRequireDefault(require("@babel/generator"));

var _traverse = _interopRequireDefault(require("@babel/traverse"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const symbolIcon = '#####';

function compile({
  keys,
  values,
  template
}) {
  values = values.map(value => {
    if (Array.isArray(value)) {
      value = value.join(`${symbolIcon}n`);
    }

    return value;
  });
  let renderTemplate;
  const str = `return ${symbolIcon}\`${template}${symbolIcon}\``.replace(new RegExp(symbolIcon, 'g'), '\\');

  try {
    renderTemplate = new Function(...keys, str);
  } catch (e) {
    console.log(e, str, keys, values);
  }

  return renderTemplate(...values);
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

function filterName(str) {
  // filter illegal characters in windows files
  str = str.replace(/[\\\\/:*?\"<>|]/g, '');
  str = str.replace(/\s/g, '_');
  str = str.replace(/\//g, '_or_');
  return str;
}

function formatText(str) {
  const formatedText = str.replace(/(")/gm, '').replace(/^\s+|\s+$/g, '').replace(/(\n|\r|\t)+/gm, '\n').replace(/\n/gm, '\n\t\t\t\t\t\t');
  return formatedText;
}

function handleCaseBody(caseContent, update = false) {
  for (const key in caseContent) {
    if (key === 'dateCreated' || key === 'lastUpdated') {
      caseContent[key] = new Date(caseContent[key]).toUTCString().split('GMT')[0];
    } else if (key === 'preconditions') {
      caseContent.preconditions = formatText(caseContent.preconditions.split('Account type(/s):')[0]);
      caseContent.preconditions = `\t\t\t\t<Given desc={\\\`\r\t\t\t\t\t\t${caseContent.preconditions}\\\`} />`;
    } else if (key === 'children') {
      caseContent[key] = caseContent[key].sort((item, next) => item.order - next.order);
      caseContent[key] = caseContent[key].map((item, index) => {
        if (update) {
          item = `/*\n\t__Step${index + 1}__:${item.name}\n\t[Expected Result]:${item.expectedResult}\n*/`;
        } else {
          item.expectedResult = formatText(item.expectedResult);
          item = item.expectedResult.indexOf('\n') > -1 ? `\t\t\t\t<When desc="${item.name.replace(/(")/gm, '').replace(/^\s+|\s+$/g, '')}" />\n\t\t\t\t<Then \n\t\t\t\t\tdesc={\\\`\r\t\t\t\t\t\t${item.expectedResult}\\\`} />` : `\t\t\t\t<When desc="${item.name.replace(/(")/gm, '').replace(/^\s+|\s+$/g, '')}" />\n\t\t\t\t<Then desc="${item.expectedResult}" />`;
        }

        return item;
      });

      if (!update) {
        caseContent[key] = caseContent[key].join('\n');
      }
    } else if (key === 'createdBy' || key === 'lastUpdatedBy' && caseContent[key] === null) {
      caseContent[key] = '';
    }
  }

  return caseContent;
}

function handleCaseContent(caseContent, suiteId, update = false) {
  const baseUrl = 'http://einstein.int.ringcentral.com/?project=1309';
  suiteId.unshift(baseUrl);
  const url = `${suiteId.join('&suite=')}&case=${caseContent.id}`;
  const entryPoints = caseContent.preconditions.split('Entry point(/s):')[1].split('\n').filter(e => e.replace(/(\r\n|\n|\r|\t|\s)/gm, ''));
  caseContent = Object.assign({
    url,
    entryPoints
  }, caseContent);
  caseContent = handleCaseBody(caseContent);
  let entryPointNumber = 0;

  if (entryPoints.length === 0) {
    caseContent.scenario = `@autorun(test.skip)
@title("${caseContent.name}")
class PleaseDefineYourClassName extends Step {
  run() {
    return (
      <Scenario desc="${caseContent.name}" >
${caseContent.preconditions}
${caseContent.children}
      </Scenario>
    );
  }
}`;
  } else {
    caseContent.scenario = Object.values(entryPoints).map(entryPoint => {
      entryPointNumber += 1;
      entryPoint = entryPoint.replace(/^\s+|\s+$/g, '');
      return `
@autorun(test.skip)
@title("${entryPoint}")
class PleaseDefineYourClassName${entryPointNumber} extends Step {
  run() {
    return (
      <Scenario desc="${entryPoint}" >
${caseContent.preconditions}
${caseContent.children}
      </Scenario>
    );
  }
}`;
    });
  }

  return caseContent;
}

async function create(caseId, caseContent, Directory) {
  let template = '';
  let currentDirectory = Directory.name;

  if (currentDirectory) {
    currentDirectory = currentDirectory.join('/');
  }

  const projectName = `RCI-${caseId}_${filterName(caseContent.name)}ac.spec.js`;
  const targetDir = `${currentDirectory}/${projectName}`;

  if (_fs.default.existsSync(targetDir)) {
    console.log(`${targetDir} exists !`);
    return;
  }

  console.log('-------------->>>>>>>> current path : ', __dirname);

  _fs.default.readFile(_path.default.join(__dirname, '../../../templates/template.jsx'), 'utf-8', async (err, data) => {
    if (err || typeof data === 'undefined') {
      console.error(`template.jsx doesn't exist in ${_path.default.join(__dirname, '../template.jsx')}`);
      return;
    }

    mkdirsSync(currentDirectory);
    console.log('\nCreating ...');
    template = data.toString();
    caseContent = handleCaseContent(caseContent, Directory.id, false);
    const result = compile({
      template,
      keys: Object.keys(caseContent),
      values: Object.values(caseContent)
    });

    _fs.default.writeFile(`${targetDir}`, result, 'ascii', err => {
      if (err) throw err;
      console.log(`Create ${targetDir} successfully!`);
    });
  });
}

function getUpdatedCaseByBabel(caseContent, targetDir) {
  const caseContentFiltered = caseContent.children;
  caseContentFiltered.sort((a, b) => a.order - b.order);
  let lastStepInAst;
  let leadingCommentsNumber = 0;
  let trailingCommentsNumber = 0;
  let goalBlockStatementLoc;
  const updateCommentVisitor = {
    ExpressionStatement(path) {
      const {
        trailingComments,
        leadingComments
      } = path.node;
      const areTrailingComments = trailingComments && trailingComments.length > 0;
      const areLeadingComments = leadingComments && leadingComments.length > 0;

      if (areTrailingComments || areLeadingComments) {
        goalBlockStatementLoc = goalBlockStatementLoc || {
          start: path.parent.start,
          end: path.parent.end
        };
        const comments = trailingComments || leadingComments;
        let number = areTrailingComments ? trailingCommentsNumber : leadingCommentsNumber;

        for (let i = 0; i < comments.length; i++) {
          const e = comments[i];

          if (e.type === 'CommentBlock' && /_Step\d+_/.test(e.value)) {
            const oneCaseContent = caseContentFiltered[number];
            lastStepInAst = number;
            number++;

            if (areTrailingComments) {
              trailingCommentsNumber++;
            } else {
              leadingCommentsNumber++;
            }

            if (oneCaseContent) {
              const {
                name,
                expectedResult
              } = oneCaseContent;
              e.value = `\n\t__Step${number}__:${name}\n\t[Expected Result]:${expectedResult}`;
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
  const addCommentVisitor = {
    BlockStatement(path) {
      const {
        start,
        end,
        body
      } = path.node;

      if (start === goalBlockStatementLoc.start && end === goalBlockStatementLoc.end) {
        // There are more steps from origin than local
        if (caseContentFiltered.length > lastStepInAst + 1) {
          const lastItem = body[body.length - 1];
          const restComments = caseContentFiltered.splice(lastStepInAst + 1);
          const newComments = restComments.map((e, index) => ({
            type: 'CommentBlock',
            value: `\n\t__Step${lastStepInAst + 2 + index}__:${e.name}\n\t[Expected Result]:${e.expectedResult}`
          }));
          const {
            trailingComments,
            leadingComments
          } = lastItem;

          if (trailingComments) {
            lastItem.trailingComments = [...trailingComments, ...newComments];
          } else if (leadingComments) {
            lastItem.leadingComments = [...leadingComments, ...newComments];
          }
        }
      }
    }

  };

  const file = _fs.default.readFileSync(targetDir);

  const code = file.toString();

  const parseRes = require('@babel/parser').parse(code, {
    sourceType: 'module'
  });

  (0, _traverse.default)(parseRes, updateCommentVisitor);
  (0, _traverse.default)(parseRes, addCommentVisitor);
  const output = (0, _generator.default)(parseRes, {
    retainFunctionParens: true
  }, code);
  return output.code;
}

function getUpdateCaseByRegex(caseContent, Directory, targetDir) {
  caseContent = handleCaseContent(caseContent, Directory.id, true);

  let data = _fs.default.readFileSync(targetDir, 'utf-8');

  const str = data.match(/(\/\*(.|\s)*?\*\/)/g);
  const steps = caseContent.children;
  const reg = new RegExp('__Step');
  const title_new = `/* RCI-${caseContent.externalId}: ${caseContent.name}
  ${caseContent.url}

  Preconditions:${caseContent.preconditions}
  Entry point(/s):${caseContent.entryPoints}
  */`;
  const title_reg = new RegExp('RCI-(\\d+)');

  for (let i = 0; i < str.length; i++) {
    if (title_reg.test(str[i])) {
      if (str[i] !== title_new) {
        str[i] = title_new;
      }
    }
  }

  for (let i = 0, j = 0; i < str.length; i++) {
    if (reg.test(str[i])) {
      if (str[i] !== steps[j]) {
        str[i] = steps[j];
      }

      j++;
    }

    if (i === str.length - 1 && steps.length > j) {
      for (let k = j; k < steps.length; k++) {
        str[i] = `${str[i]}\n\n${steps[k]}`;
      }
    }
  }

  const result = data.match(/(\/\*(.|\s)*?\*\/)/g);

  if (result && result.length > 0) {
    for (let i = 0; i < result.length; i++) {
      if (str[i]) {
        data = data.replace(result[i], str[i]);
      }
    }
  }

  return data;
}

async function update(caseId, caseContent, Directory, useBabel) {
  let currentDirectory = Directory.name;

  if (caseContent.item) {
    caseContent = caseContent.item;
  }

  if (currentDirectory) {
    currentDirectory = currentDirectory.join('/');
  }

  const projectName = `RCI-${caseId}_${filterName(caseContent.name)}.spec.js`;
  const targetDir = `${currentDirectory}/${projectName}`;

  if (!_fs.default.existsSync(targetDir)) {
    console.log(`${targetDir} doesn't exists !`);
    return;
  }

  const data = useBabel ? getUpdatedCaseByBabel(caseContent, targetDir) : getUpdateCaseByRegex(caseContent, Directory, targetDir);

  _fs.default.writeFile(`${targetDir}`, data, 'ascii', err => {
    if (err) throw err;
    console.log(`Update ${targetDir} successfully!`);
  });
}