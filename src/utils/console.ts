import { getNowTime } from './time';

const DEFAULT_LEVEL = 'log';
const types = ['error', 'warn', 'info', 'log', 'verbose', 'debug', 'silly'];

export function logOutput(hooks = {}) {
  const generateOutput = (type) => (...args) => {
    let defaultLevel = DEFAULT_LEVEL;
    if (global.__context__) {
      if (global.__context__.options.isVerbose) {
        defaultLevel = 'verbose';
      }
      if (global.__context__.options.isDebugger) {
        defaultLevel = 'debug';
      }
    }
    if (types.indexOf(type) > types.indexOf(defaultLevel)) {
      return;
    }
    if (typeof hooks[type] === 'function') hooks[type](...args);
    // TODO handle log levels
    process.stdout.write([`[${getNowTime()}] `, ...args, '\n'].join(''));
  };
  types.forEach((type) => {
    global.console[type] = generateOutput(type);
  });
}

logOutput.types = types;
