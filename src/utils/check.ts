function isPlainobject(value) {
  return value && Object.prototype === value.__proto__;
}

function isNil(value) {
  return typeof value === 'undefined' || value === null;
}

function checkValidity(dir) {
  if (isNil(dir) || (Array.isArray(dir) && dir.length === 0)) {
    return ['./'];
  }
  return dir;
}

export { isPlainobject, isNil, checkValidity };
