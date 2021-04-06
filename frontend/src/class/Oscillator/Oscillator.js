const Node = require("../Node");

class Oscillator extends Node {
  constructor(type, frequency) {
    super()

    this.nodeType = "Oscillator"
    this.types = ['sine', 'triangle', 'sawtooth', 'square']
    this.oscType = type || this.types[0]

    this.frequency = frequency || '440'

    this.node = Node.context.createOscillator()

    super.getAudioParams()
  }

  initGain(initialGain) {
    this.gain = initialGain

    // this.outputNode = Node.context.createGain()
    // this.outputNode.gain.setValueAtTime(this.gain, 0)

    //si querés ver el gain en la interfaz, tenés que setearla como level

    this.level = Node.context.createGain()
    this.level.gain.setValueAtTime(this.gain, 0)
    this.outputNode = this.level

    this.node.connect(this.outputNode)
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