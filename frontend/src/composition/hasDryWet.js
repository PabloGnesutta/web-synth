const { addSaveFunction } = require("../class/nodeUtils");
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
    // Equal power crossfade
    target.dryGain.gain.value = Math.cos(value * 0.5 * Math.PI);
    target.wetGain.gain.value = Math.cos((1.0 - value) * 0.5 * Math.PI);
    target.dryWet.value = value;
  };

  // set default value
  target.setDryWet(initialValue);

  target.destroyers.push(() => {
    target.dryGain.disconnect();
    target.wetGain.disconnect();

    target.dryGain = null;
    target.wetGain = null;
  });

  addSaveFunction(target, () => ({
    name: 'dryWet',
    value: target.dryWet.value
  }));
};