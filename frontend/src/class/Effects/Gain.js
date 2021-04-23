const Node = require("../Node");

const initialGain = 1;

class Gain extends Node {
  static gainCount = 0

  constructor(name) {
    super(initialGain)

    this.name = name || "Gain " + ++Gain.gainCount
    this.nodeType = "Gain"

    // this.node = Node.context.createGain()
    // this.node.connect(this.outputNode)
    
    this.inputNode.connect(this.outputNode)
  }
}
module.exports = Gain