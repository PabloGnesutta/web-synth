const { addSaveFunction } = require("../class/nodeUtils");


module.exports = function hasDryWet(target) {
  target.setInnerNodeAudioParam = function (indexOrName, value) {
    const innerNodeAudioParam = target.innerNodeAudioParams[indexOrName];
    innerNodeAudioParam.node[innerNodeAudioParam.nodeAudioParam].setValueAtTime(value, 0);
    target.innerNodeAudioParams[indexOrName].value = parseFloat(value);
  };

  target.destroyers.push(() => target.innerNodeAudioParams = null);

  addSaveFunction(target, () => ({
    name: 'innerNodeAudioParams',
    value: target.innerNodeAudioParams.map(param => ({ name: param.name, value: param.value })),
  }));
};