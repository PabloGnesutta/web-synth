const Node = require("./Node");

const QMax = 30
const detuneMax = 100
const frequencyMax = 7000

const minMaxStep = [
  { name: 'frequency', minValue: 0, maxValue: frequencyMax, value: 0, step: 1 },
  { name: 'detune', minValue: -detuneMax, maxValue: detuneMax, value: 0, step: 1 },
  { name: 'Q', minValue: -QMax, maxValue: QMax, value: 0, step: 0.01 },
  { name: 'gain', minValue: 0, maxValue: 1, value: 0.5, step: 0.01 },
]

class BiquadFilter extends Node {
  static bqCount = 0

  constructor(type, name) {
    super(name)

    this.name = name || "Filter " + ++BiquadFilter.bqCount
    this.nodeType = "BiquadFilter"
    this.types = ['lowpass', 'highpass', 'bandpass', 'notch']

    this.oscType = type || this.types[0]

    this.node = Node.context.createBiquadFilter()
    this.node.type = this.oscType

    this.setFrequencyInitialValue()
    this.node.frequency.setValueAtTime(minMaxStep[0].value, 0)

    this.outputNode = this.node

    super.getAudioParams(['gain', 'detune'])  //exclude params
    this.setMinMaxStep()
  }

  setMinMaxStep() {
    this.audioParams.forEach(ap => {
      const index = minMaxStep.findIndex(mms => mms.name === ap.name)
      for (let key in ap) {
        ap[key] = minMaxStep[index][key]
      }
    })
  }

  setFrequencyInitialValue() {
    let value
    switch (this.oscType) {
      case "lowpass":
        value = frequencyMax
        break;
      case "highpass":
        value = 0
        break;
      case "bandpass":
        value = 4000
        break;
      case "notch":
        value = 4000
        break;
      default:
        value = 0
    }
    minMaxStep[0].value = value
  }

}

module.exports = BiquadFilter