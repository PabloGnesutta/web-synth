const Node = require("../Node");

const initialGain = 1;

class Gain extends Node {
  static gainCount = 0

  constructor(name) {
    super()

    this.name = name || "Gain " + ++Gain.gainCount
    this.nodeType = "Gain"
    this.minGain = -3  //phase inverter
    this.maxGain = 3

    this.node = Node.context.createGain()
    this.initGain(initialGain)
  }
}
module.exports = Gain