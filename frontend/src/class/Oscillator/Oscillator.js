const Node = require("../Node");

class Oscillator extends Node {
  constructor(initialGain) {
    super(initialGain)
    this.nodeType = "Oscillator"
    this.types = ['sine', 'triangle', 'sawtooth', 'square']
    this.type = 'triangle'
    this.status = "STOPPED"
    this.node = Node.context.createOscillator()
  }

  start() {
    this.node = Node.context.createOscillator()
    this.node.type = this.type
    this.node.connect(this.outputNode)

    this.node.frequency.setValueAtTime(this.frequency, 0)
    this.node.start(0)
    this.status = "STARTED"
  }

  stop() {
    this.node.stop(0)
    this.node.disconnect()
    this.status = "STOPPED"
  }

}

module.exports = Oscillator