import generate from '@babel/generator';
import traverse from '@babel/traverse';
import format from 'string-template';
import path from 'path';
import fs from 'fs';

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

function filterName(str) {
  // filter illegal characters in windows files
  str = str.replace(/[\\\\/:*?\"<>|]/g, '');
  str = str.replace(/\s/g, '_');
  str = str.replace(/\//g, '_or_');
  return str;
}

function formatText(str) {
  const formatedText = str
    .replace(/(")/gm, '')
    .replace(/^\s+|\s+$/g, '')
    .replace(/(\n|\r|\t)+/gm, '\n')
    .replace(/\n/gm, '\n\t\t\t\t\t\t');
  return formatedText;
}

function handleCaseBody(caseContent, update = false) {
  for (const key in caseContent) {
    if (key === 'dateCreated' || key === 'lastUpdated') {
      caseContent[key] = new Date(caseContent[key])
        .toUTCString()
        .split('GMT')[0];
    } else if (key === 'preconditions') {
      caseContent.preconditions = formatText(
        caseContent.preconditions.split('Account type(/s):')[0],
      );
      caseContent.preconditions = `\t\t\t\t<Given desc={\`\r\t\t\t\t\t\t${
        caseContent.preconditions
        }\`} />`;
    } else if (key === 'children') {
      caseContent[key] = caseContent[key].sort(
        (item, next) => item.order - next.order,
      );
      caseContent[key] = caseContent[key].map((item, index) => {
        if (update) {
          item = `/*\n\t__Step${index + 1}__:${
            item.name
            }\n\t[Expected Result]:${item.expectedResult}\n*/`;
        } else {
          item.expectedResult = formatText(item.expectedResult);

          item =
            item.expectedResult.indexOf('\n') > -1
              ? `\t\t\t\t<When desc="${item.name
                .replace(/(")/gm, '')
                .replace(
                  /^\s+|\s+$/g,
                  '',
                )}" />\n\t\t\t\t<Then \n\t\t\t\t\tdesc={\`\r\t\t\t\t\t\t${
              item.expectedResult
              }\`} />`
              : `\t\t\t\t<When desc="${item.name
                .replace(/(")/gm, '')
                .replace(/^\s+|\s+$/g, '')}" />\n\t\t\t\t<Then desc="${
              item.expectedResult
              }" />`;
        }
        return item;
      });
      if (!update) {
        caseContent[key] = caseContent[key].join('\n');
      }
    } else if (
      key === 'createdBy' ||
      (key === 'lastUpdatedBy' && caseContent[key] === null)
    ) {
      caseContent[key] = '';
    }
  }
  return caseContent;
}

function handleCaseContent(caseContent, suiteId, update = false) {
  const baseUrl = 'http://einstein.int.ringcentral.com/?project=1309';
  suiteId.unshift(baseUrl);
  const url = `${suiteId.join('&suite=')}&case=${caseContent.id}`;
  const entryPoints = caseContent.preconditions
    .split('Entry point(/s):')[1]
    .split('\n')
    .filter((e) => e.replace(/(\r\n|\n|\r|\t|\s)/gm, ''));
  caseContent = Object.assign({ url, entryPoints }, caseContent);
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
    caseContent.scenario = Object.values(entryPoints).map((entryPoint) => {
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

export async function create(caseId, caseContent, Directory) {
  let template = '';
  let currentDirectory = Directory.name;
  if (currentDirectory) {
    currentDirectory = currentDirectory.join('/');
  }
  const projectName = `RCI-${caseId}_${filterName(caseContent.name)}ac.spec.js`;
  const targetDir = `${currentDirectory}/${projectName}`;
  if (fs.existsSync(targetDir)) {
    console.log(`${targetDir} exists !`);
    return;
  }
  fs.readFile(
    path.join(__dirname, '../../../templates/template.jsx'),
    'utf-8',
    async (err, data) => {
      if (err || typeof data === 'undefined') {
        console.error(
          `template.jsx doesn't exist in ${path.join(
            __dirname,
            '../template.jsx',
          )}`,
        );
        return;
      }
      mkdirsSync(currentDirectory);
      console.log('\nCreating ...');
      template = data.toString();
      caseContent = handleCaseContent(caseContent, Directory.id, false);
      const result = format(template, caseContent)

      fs.writeFile(`${targetDir}`, result, 'ascii', (err) => {
        if (err) throw err;
        console.log(`Create ${targetDir} successfully!`);
      });
    },
  );
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
      const { trailingComments, leadingComments } = path.node;
      const areTrailingComments =
        trailingComments && trailingComments.length > 0;
      const areLeadingComments = leadingComments && leadingComments.length > 0;
      if (areTrailingComments || areLeadingComments) {
        goalBlockStatementLoc = goalBlockStatementLoc || {
          start: path.parent.start,
          end: path.parent.end,
        };
        const comments = trailingComments || leadingComments;
        let number = areTrailingComments
          ? trailingCommentsNumber
          : leadingCommentsNumber;
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
              const { name, expectedResult } = oneCaseContent;
              e.value = `\n\t__Step${number}__:${name}\n\t[Expected Result]:${expectedResult}`;
            } else {
              // There are less steps from origin than local
              comments.splice(i);
              break;
            }
          }
        }
      }
    },
  };

  const addCommentVisitor = {
    BlockStatement(path) {
      const { start, end, body } = path.node;
      if (
        start === goalBlockStatementLoc.start &&
        end === goalBlockStatementLoc.end
      ) {
        // There are more steps from origin than local
        if (caseContentFiltered.length > lastStepInAst + 1) {
          const lastItem = body[body.length - 1];
          const restComments = caseContentFiltered.splice(lastStepInAst + 1);
          const newComments = restComments.map((e, index) => ({
            type: 'CommentBlock',
            value: `\n\t__Step${lastStepInAst + 2 + index}__:${
              e.name
              }\n\t[Expected Result]:${e.expectedResult}`,
          }));
          const { trailingComments, leadingComments } = lastItem;
          if (trailingComments) {
            lastItem.trailingComments = [...trailingComments, ...newComments];
          } else if (leadingComments) {
            lastItem.leadingComments = [...leadingComments, ...newComments];
          }
        }
      }
    },
  };

  const file = fs.readFileSync(targetDir);
  const code = file.toString();
  const parseRes = require('@babel/parser').parse(code, {
    sourceType: 'module',
  });
  traverse(parseRes, updateCommentVisitor);
  traverse(parseRes, addCommentVisitor);
  const output = generate(
    parseRes,
    {
      retainFunctionParens: true,
    },
    code,
  );
  return output.code;
}
