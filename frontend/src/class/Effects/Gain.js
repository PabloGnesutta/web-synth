const Node = require("../Node");

const initialGain = 1;

class Gain extends Node {
  static gainCount = 0;

  constructor(name) {
    super(initialGain, "Effect", "Gain");

    this.name = name || "Gain " + ++Gain.gainCount;

    this.inputNode.connect(this.outputNode);
  }

  connectNativeNode(node) {
    this.outputNode.connect(node);
    return node;
  }

  destroy() {
    super.destroy();
  }
}
module.exports = Gain;