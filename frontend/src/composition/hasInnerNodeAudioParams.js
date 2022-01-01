module.exports = function hasDryWet(target) {
  target.setInnerNodeAudioParam = function (indexOrName, value) {
    console.log('set inner node', indexOrName, value);
    let index = indexOrName;
    if (typeof (indexOrName) !== 'number')
      index = target.innerNodeAudioParams.findIndex(inap => inap.name === indexOrName);

    const innerNodeAudioParam = target.innerNodeAudioParams[index];
    innerNodeAudioParam.node[innerNodeAudioParam.nodeAudioParam].setValueAtTime(value, 0);
    target.innerNodeAudioParams[index].value = parseFloat(value);
  };

  target.destroyers.push(() => {
    target.innerNodeAudioParams = null;
  });

  target.saveParams.push({ name: 'innerNodeAudioParams', value: target.innerNodeAudioParams });
};