module.exports = function hasDryWet(target) {
  target.setInnerNodeAudioParam = function (indexOrName, value) {
    const innerNodeAudioParam = target.innerNodeAudioParams[indexOrName];
    innerNodeAudioParam.node[innerNodeAudioParam.nodeAudioParam].setValueAtTime(value, 0);
    target.innerNodeAudioParams[indexOrName].value = parseFloat(value);
  };

  target.destroyers.push(function () { target.innerNodeAudioParams = null; });

  if (!target.saveFunctions) target.saveFunctions = [];

  target.saveFunctions.push(function () {
    return {
      name: 'innerNodeAudioParams',
      value: target.innerNodeAudioParams.map(param => {
        return { name: param.name, value: param.value };
      }),
    };
  });
};