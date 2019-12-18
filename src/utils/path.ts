import path from 'path';

export function getWorkAbsolutePath(path) {
  return path.resolve(process.cwd(), path);
}

function isAbsolutePath(path) {
  return /^\//.test(path);
}

export function getFile(path) {
  try {
    const _path = isAbsolutePath(path) ? path : getWorkAbsolutePath(path);
    // eslint-disable-next-line
    const config = require(_path);
    return config;
  } catch (error) {
    console.error(`Unexpected import '${path}' in root path.`);
    console.error(error);
    process.exit();
  }
}
