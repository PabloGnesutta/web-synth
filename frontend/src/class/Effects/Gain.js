const Node = require("../Node");

const initialGain = 1;

class Gain extends Node {
  static gainCount = 0

  constructor(name) {
    super(initialGain)

    this.name = name || "Gain " + ++Gain.gainCount
    this.nodeType = "Gain"

    this.inputNode.connect(this.outputNode)
  }

  connectNativeNode(node, name) {
    this.outputNode.connect(node)
    this.outputs.push({ node, name: name || "Some Native Node" })
    return node
  }
}
module.exports = Gain