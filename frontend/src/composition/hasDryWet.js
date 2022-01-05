const Node = require("../class/Node");

module.exports = function hasDryWet(target, initialValue = 1) {
  target.dryGain = Node.context.createGain();
  target.wetGain = Node.context.createGain();

  target.inputNode.connect(target.dryGain);
  target.node.connect(target.wetGain);

  target.dryGain.connect(target.outputNode);
  target.wetGain.connect(target.outputNode);

  target.dryWet = {
    displayName: "dry/wet",
    unit: '', //%
    minValue: 0,
    maxValue: 1,
    value: 1,
  };

  target.setDryWet = function (value) {
    target.wetGain.gain.value = value;
    target.dryGain.gain.value = value - 1;
    target.dryWet.value = value;
  };

  // set default value
  target.setDryWet(initialValue);

  target.destroyers.push(function () {
    target.dryGain.disconnect();
    target.wetGain.disconnect();

    target.dryGain = null;
    target.wetGain = null;
  });

  if (!target.saveFunctions) target.saveFunctions = [];

  target.saveFunctions.push(function () {
    return {
      name: 'dryWet',
      value: target.dryWet.value
    };
  });
};