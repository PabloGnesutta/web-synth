const { addSaveFunction } = require("../class/nodeUtils");


module.exports = function hasDryWet(target) {
  target.setAudioParam = function (paramIndex, value) {
    const param = target.audioParams[paramIndex];
    let newValue = parseFloat(value);

    target.node[param.name].setValueAtTime(newValue, 0);
    target.audioParams[paramIndex].value = newValue;
  };

  target.destroyers.push(() => target.audioParams = null);

  addSaveFunction(target, () => ({
    name: 'audioParams',
    value: target.audioParams.map(param => ({ name: param.name, value: param.value })),
  }));
};