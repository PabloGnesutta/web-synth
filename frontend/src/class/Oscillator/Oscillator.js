const Node = require("../Node");

class Oscillator extends Node {
  constructor(initialGain) {
    super(initialGain);
    // this.nodeType = "Oscillator"
    this.types = ['sine', 'triangle', 'sawtooth', 'square'];
    this.type = 'triangle';
    this.status = "STOPPED";
    this.node = Node.context.createOscillator();
  }

  connectNativeNode(node, name) {
    this.outputNode.connect(node);
    return node;
  }

}

module.exports = Oscillator;