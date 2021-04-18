const Oscillator = require("../Oscillator/Oscillator")
const notes = require("../../data/notes")

const initialGain = 0.5
const detuneMax = 100
const initFreq = 220

const audioParamsConfig = [
  { name: 'frequency', displayName: 'freq', unit: 'hz', minValue: 20, maxValue: 8000, value: initFreq, defaultValue: initFreq, step: 1 },
  { name: 'detune', displayName: 'fine', unit: 'hz', minValue: -detuneMax, maxValue: detuneMax, value: 0, defaultValue: 0, step: 0.1 },
]

class Carrier extends Oscillator {
  static carrierCount = 0

  constructor(type, frequency) {
    super(type, frequency || initFreq)

    this.name = "Osc " + ++Carrier.carrierCount
    this.nodeType = "Carrier"
    this.nodeRol = "Instrument"

    this.octave = 3
    this.transpose = 0

    this.status = "STOPPED"

    this.initParams()
    this.initGain(initialGain)
  }

  initParams() {
    this.audioParams.forEach(ap => {
      const index = audioParamsConfig.findIndex(mms => mms.name === ap.name)
      for (let key in ap) {
        ap[key] = audioParamsConfig[index][key]
      }
      ap.unit = audioParamsConfig[index].unit
      ap.displayName = audioParamsConfig[index].displayName
    })
  }

  playNote(i) {
    let noteIndex = i + 12 * this.octave + this.transpose
    if (noteIndex < 0) noteIndex = 0
    if (noteIndex > notes.length - 1) noteIndex = notes.length - 1

    this.frequency = notes[noteIndex].freq
    this.node.frequency.setValueAtTime(this.frequency, 0)
  }

  stopNote(i) { }

  onOtherKeyup(key) {
    if (key === "z" && this.octave > 1) this.octave--;
    if (key === "x") this.octave = this.octave < 8 ? this.octave + 1 : this.octave;
    if (key === "c") this.transpose = this.transpose <= -12 ? -12 : this.transpose - 1;
    if (key === "v") this.transpose = this.transpose < 12 ? this.transpose + 1 : this.transpose;
  }
}

module.exports = Carrier