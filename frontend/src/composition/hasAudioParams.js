module.exports = function hasDryWet(target) {
  target.setAudioParam = function (indexOrName, value) {
    let index = indexOrName;
    if (typeof (indexOrName) !== 'number')
      index = target.audioParams.findIndex(ap => ap.name === indexOrName);

    let curvedValue = parseFloat(value);

    const param = target.audioParams[index];
    target.node[param.name].setValueAtTime(curvedValue, 0);
    target.audioParams[index].value = parseFloat(value);
  };

  target.destroyers.push(() => {
    target.audioParams = null;
  });

  target.saveParams.push({ name: 'audioParams', value: target.audioParams });
};