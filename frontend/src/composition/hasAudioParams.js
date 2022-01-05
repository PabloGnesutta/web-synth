module.exports = function hasDryWet(target) {
  target.setAudioParam = function (paramIndex, value) {
    const param = target.audioParams[paramIndex];
    let newValue = parseFloat(value);

    target.node[param.name].setValueAtTime(newValue, 0);
    target.audioParams[paramIndex].value = newValue;
  };

  target.destroyers.push(function () { target.audioParams = null; });

  if (!target.saveFunctions) target.saveFunctions = [];

  target.saveFunctions.push(function () {
    return {
      name: 'audioParams',
      value: target.audioParams.map(param => {
        return { name: param.name, value: param.value };
      }),
    };
  });
};