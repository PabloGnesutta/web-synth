const Node = require("../Node")
const Oscillator = require("../Oscillator/Oscillator")
const notes = require("../../data/notes")

const noteFreqIndex = 1

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

    this.octave = 3
    this.transpose = 0

    this.initAudioParams()
  }

  initAudioParams() {
    this.audioParams = [
      { name: 'detune', displayName: 'fine', unit: 'hz', minValue: -detuneMax, maxValue: detuneMax, value: 0, defaultValue: 0, step: 0.1 },
    ]
  }

  setAudioParam(index, value) {
    let curvedValue = parseFloat(value)

    const param = this.audioParams[index];
    this.node[param.name].setValueAtTime(curvedValue, 0);
    this.audioParams[index].value = parseFloat(value);
  }

  playNote(i) {
    let noteIndex = i + 12 * this.octave + this.transpose
    if (noteIndex < 0) noteIndex = 0
    if (noteIndex > notes.length - 1) noteIndex = notes.length - 1
    this.frequency = notes[noteIndex][noteFreqIndex]
    this.node.frequency.setValueAtTime(this.frequency, 0)
  }

  stopNote(i) { }

  onOtherKeyup(key) {
    if (key === "z" && this.octave > 1) this.octave--;
    if (key === "x") this.octave = this.octave < 8 ? this.octave + 1 : this.octave;
    if (key === "c") this.transpose = this.transpose <= -12 ? -12 : this.transpose - 1;
    if (key === "v") this.transpose = this.transpose < 12 ? this.transpose + 1 : this.transpose;
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

module.exports = Carrier