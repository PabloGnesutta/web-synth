const Node = require("../Node");

const initialGain = 1
const freqMax = 7000
const QMax = 30

class BiquadFilter extends Node {
  static filterCount = 0

  constructor() {
    super(initialGain)

    this.name = "Filter " + ++BiquadFilter.filterCount
    this.nodeType = "BiquadFilter"

    this.type = 'lowpass'
    this.types = ['lowpass', 'highpass', 'bandpass', 'notch', 'lowshelf', 'highshelf', 'peaking']

    this.node = Node.context.createBiquadFilter()
    this.node.type = this.type

    this.dryGain = Node.context.createGain()
    this.wetGain = Node.context.createGain()

    this.inputNode.connect(this.node)
    this.inputNode.connect(this.dryGain)
    this.node.connect(this.wetGain)

    this.dryGain.connect(this.outputNode)
    this.wetGain.connect(this.outputNode)

    this.initAudioParams()
    this.refreshParams()
    this.initDryWet()
  }

  initAudioParams() {
    this.audioParams = [
      {
        name: 'frequency', displayName: 'freq', unit: 'hz',
        minValue: 20, maxValue: freqMax, value: freqMax, defaultValue: freqMax, step: 1
      },
      {
        name: 'Q', displayName: 'res', unit: '',
        minValue: -QMax, maxValue: QMax, value: 0, defaultValue: 0, step: 0.01
      },
      {
        name: 'gain', displayName: 'gain', unit: '',
        minValue: -QMax, maxValue: QMax, value: 0, defaultValue: 0, step: 0.01
      },
    ]
  }

  setAudioParam(index, value) {
    let curvedValue = parseFloat(value)

    const param = this.audioParams[index];
    this.node[param.name].setValueAtTime(curvedValue, 0);
    this.audioParams[index].value = parseFloat(value);
  }

  refreshParams() {
    this.setValuesAccordingToType()
    this.node.frequency.setValueAtTime(this.audioParams[0].value, 0)
  }

  setType(type) {
    this.type = type
    this.node.type = type
    this.refreshParams()
  }

  setValuesAccordingToType() {
    let freq
    let q = {}
    switch (this.type) {
      case "lowpass":
        freq = freqMax
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
    this.audioParams[0].value = freq
    this.audioParams[0].defaultValue = freq
    //Q
    this.audioParams[1].minValue = q.minValue
    this.audioParams[1].maxValue = q.maxValue
    this.audioParams[1].value = q.value
    this.audioParams[1].defaultValue = q.value
    this.audioParams[1].step = q.step
    //gain
  }

  initDryWet() {
    this.dryWet = {
      // name: "dry/wet",
      displayName: "dry/wet",
      unit: '', //%
      minValue: 0,
      maxValue: 1,
      defaultValue: 1,
      value: 1,
      step: 0.01
    }
  }

  setDryWet(value) {
    this.wetGain.gain.value = value
    this.dryGain.gain.value = value - 1
  }

}

module.exports = BiquadFilter