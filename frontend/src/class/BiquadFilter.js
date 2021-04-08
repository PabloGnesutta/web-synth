const Node = require("./Node");

const initialGain = 0.5
const QMax = 30
const frequencyMax = 7000
// const detuneMax = 100

const audioParamContraints = [
  { name: 'frequency', minValue: 20, maxValue: frequencyMax, value: 0, defaultValue: 0, step: 1 },
  { name: 'Q', minValue: -QMax, maxValue: QMax, value: 0, defaultValue: 0, step: 0.01 },
  // { name: 'detune', minValue: -detuneMax, maxValue: detuneMax, value: 0, step: 1 },
  // { name: 'gain', minValue: 0, maxValue: 1, value: 0.5, step: 0.01 },
]

class BiquadFilter extends Node {
  static bqCount = 0

  constructor(type, name) {
    super(name)

    this.name = name || "Filter " + ++BiquadFilter.bqCount
    this.nodeType = "BiquadFilter"

    this.types = ['lowpass', 'highpass', 'bandpass', 'notch']
    this.type = type || this.types[0]

    this.node = Node.context.createBiquadFilter()
    this.node.type = this.type

    super.getAudioParams(['gain', 'detune'])  //exclude params
    this.initParams()
    this.initGain(initialGain)
  }

  initParams() { //setMinMaxStep
    this.setFrequencyInitialValue()
    this.audioParams.forEach(ap => {
      const index = audioParamContraints.findIndex(mms => mms.name === ap.name)
      for (let key in ap) {
        ap[key] = audioParamContraints[index][key]
      }
    })
    this.node.frequency.setValueAtTime(audioParamContraints[0].value, 0)
  }

  setType(type) {
    super.setType(type)
    this.initParams()
  }

  setFrequencyInitialValue() {
    let freq
    let q = {}
    switch (this.type) {
      case "lowpass":
        freq = frequencyMax
        q.minValue = -30
        q.maxValue = 30
        q.value = 0
        q.step = 0.01
        break;
      case "highpass":
        freq = 0
        q.minValue = -20
        q.maxValue = 20
        q.value = 0
        q.step = 0.01
        break;
      case "bandpass":
        freq = 3000
        q.minValue = 0
        q.maxValue = 6
        q.value = 0
        q.step = 0.01
        break;
      case "notch":
        freq = 4000
        q.minValue = 0.01
        q.maxValue = 10
        q.value = 0
        q.step = 0.01
        break;
      default:
        freq = 0
    }
    //freq
    audioParamContraints[0].value = freq
    audioParamContraints[0].defaultValue = freq
    //Q
    audioParamContraints[1].minValue = q.minValue
    audioParamContraints[1].maxValue = q.maxValue
    audioParamContraints[1].value = q.value
    audioParamContraints[1].defaultValue = q.value
    audioParamContraints[1].step = q.step
  }

}

module.exports = BiquadFilter