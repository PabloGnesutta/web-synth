const Node = require("../Node");

class Oscillator extends Node {
  constructor(type, frequency) {
    super()

    this.nodeType = "Oscillator"
    this.types = ['sine', 'triangle', 'sawtooth', 'square']
    this.oscType = type || 'triangle'

    //falta setear el type inicial en el dropdown

    this.frequency = frequency || '440'

    this.node = Node.context.createOscillator()

    super.getAudioParams()
  }

  start() {
    this.node = Node.context.createOscillator()
    this.node.type = this.oscType
    this.node.frequency.setValueAtTime(this.frequency, 0)
    this.node.connect(this.outputNode)
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