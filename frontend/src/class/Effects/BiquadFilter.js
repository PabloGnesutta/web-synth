const Node = require("../Node");

const initialGain = 1
const QMax = 30
const frequencyMax = 7000

const audioParamsConfig = [
  { name: 'frequency', displayName: 'freq', unit: 'hz', minValue: 20, maxValue: frequencyMax, value: 0, defaultValue: 0, step: 1 },
  { name: 'Q', displayName: 'res', unit: '', minValue: -QMax, maxValue: QMax, value: 0, defaultValue: 0, step: 0.01 },
  { name: 'gain', displayName: 'gain', unit: '', minValue: -QMax, maxValue: QMax, value: 0, defaultValue: 0, step: 0.01 },
]

class BiquadFilter extends Node {
  static bqCount = 0

  constructor(type, name) {
    super(name)

    this.name = name || "Filter " + ++BiquadFilter.bqCount
    this.nodeType = "BiquadFilter"

    this.types = ['lowpass', 'highpass', 'bandpass', 'notch', 'lowshelf', 'highshelf', 'peaking']
    this.type = type || this.types[0]

    this.node = Node.context.createBiquadFilter()
    this.node.type = this.type

    super.getAudioParams(['detune', 'gain'])  //exclude params
    this.initParams()
    this.initGain(initialGain)
  }

  initParams() {
    this.setFrequencyInitialValue()
    this.audioParams.forEach(ap => {
      const index = audioParamsConfig.findIndex(mms => mms.name === ap.name)
      for (let key in ap) {
        ap[key] = audioParamsConfig[index][key]
      }
      ap.unit = audioParamsConfig[index].unit
      ap.displayName = audioParamsConfig[index].displayName
    })
    this.node.frequency.setValueAtTime(audioParamsConfig[0].value, 0)
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
        q.value = 1
        q.step = 0.01
        break;
      default:
        freq = 0
        q.minValue = -100
        q.maxValue = 100
        q.value = 1
        q.step = 0.01
    }
    //freq
    audioParamsConfig[0].value = freq
    audioParamsConfig[0].defaultValue = freq
    //Q
    audioParamsConfig[1].minValue = q.minValue
    audioParamsConfig[1].maxValue = q.maxValue
    audioParamsConfig[1].value = q.value
    audioParamsConfig[1].defaultValue = q.value
    audioParamsConfig[1].step = q.step
  }

}

module.exports = BiquadFilter