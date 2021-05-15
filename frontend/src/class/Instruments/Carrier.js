const Node = require("../Node")
const Oscillator = require("../Oscillator/Oscillator")
const notes = require("../../data/notes")

const initialGain = 0.5
const detuneMax = 100
const initFreq = 220

class Carrier extends Oscillator {
  static carrierCount = 0

  constructor() {
    super(initialGain)

    this.name = "Osc " + ++Carrier.carrierCount
    this.nodeType = "Carrier"
    this.nodeRol = "Instrument"
    this.status = "STOPPED"

    this.frequency = initFreq

    this.initAudioParams()
  }

  initAudioParams() {
    this.audioParams = [
      { name: 'detune', displayName: 'fine', unit: 'hz', minValue: -detuneMax, maxValue: detuneMax, value: 0, },
      { name: 'frequency', displayName: 'freq', unit: 'hz', minValue: 20, maxValue: 7000, value: 220 },
    ]
  }

  setAudioParam(index, value) {
    let curvedValue = parseFloat(value)

    const param = this.audioParams[index];
    this.node[param.name].setValueAtTime(curvedValue, 0);
    this.audioParams[index].value = parseFloat(value);
  }

  playNote(i) {
    this.frequency = notes[i]
    this.node.frequency.setValueAtTime(this.frequency, 0)
  }

  stopNote(i) { }

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

module.exports = Carrier