const Node = require("../Node");

const initialGain = 1;

class Gain extends Node {
  static gainCount = 0

  constructor(name) {
    super()

    this.name = name || "Gain " + ++Gain.gainCount
    this.nodeType = "Gain"

    this.node = Node.context.createGain()
    this.initGain(initialGain)
  }
}
module.exports = Gain