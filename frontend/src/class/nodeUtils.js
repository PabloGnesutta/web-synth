function runSaveFunctions(nodeData, functions) {
  functions.forEach(fn => {
    const { name, value } = fn();
    nodeData[name] = value;
  });
}

function addSaveFunction(target, fn) {
  if (!target.saveFunctions) {
    target.saveFunctions = [];
  }
  target.saveFunctions.push(fn);
}


module.exports = {
  addSaveFunction,
  runSaveFunctions,
};
