const Node = require("./Node");

class Gain extends Node {
  static gainCount = 0

  constructor(name) {
    super()

    this.name = name || "Gain " + ++Gain.gainCount
    this.nodeType = "Gain"

    this.node = Node.context.createGain()
    this.outputNode = this.node

    super.getAudioParams()

    this.audioParams[0].minValue = 0
    this.audioParams[0].maxValue = 1
    this.audioParams[0].step = 0.01
    this.audioParams[0].value = 0.5
  }
}

module.exports = Gain