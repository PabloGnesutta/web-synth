const Node = require("../Node");
const initialGain = 1

class Compressor extends Node {
  static compressorCount = 0
  constructor() {
    super(initialGain)

    this.name = "Comp " + ++Compressor.compressorCount
    this.nodeType = "Compressor"

    this.node = Node.context.createDynamicsCompressor()
    this.dryGain = Node.context.createGain()
    this.wetGain = Node.context.createGain()

    this.inputNode.connect(this.node)
    this.inputNode.connect(this.dryGain)
    this.node.connect(this.wetGain)

    this.dryGain.connect(this.outputNode)
    this.wetGain.connect(this.outputNode)

    this.initAudioParams()
    this.initDryWet()
  }

  initAudioParams() {
    this.audioParams = [
      {
        name: 'threshold', displayName: 'treshold', unit: '',
        minValue: -100, maxValue: 0, value: -24,
      },
      {
        name: 'knee', displayName: 'knee', unit: '',
        minValue: 0, maxValue: 40, value: 30,
      },
      {
        name: 'ratio', displayName: 'ratio', unit: '',
        minValue: 1, maxValue: 20, value: 12,
      },
      {
        name: 'attack', displayName: 'attack', unit: 's',
        minValue: 0, maxValue: 1, value: 0,
      },
      {
        name: 'release', displayName: 'release', unit: 's',
        minValue: 0, maxValue: 1, value: 0.3,
      },
    ]
  }

  setAudioParam(indexOrName, value) {
    let index = indexOrName
    if (typeof (indexOrName) !== 'number') index = this.audioParams.findIndex(ap => ap.name === indexOrName)

    let curvedValue = parseFloat(value)

    const param = this.audioParams[index];
    this.node[param.name].setValueAtTime(curvedValue, 0);
    this.audioParams[index].value = parseFloat(value);
  }

  initDryWet() {
    this.dryWet = {
      name: "dry/wet",
      displayName: "dry/wet",
      unit: '', //%
      minValue: 0,
      maxValue: 1,
      value: 1,
    }
  }

  setDryWet(value) {
    this.wetGain.gain.value = value
    this.dryGain.gain.value = value - 1
    this.dryWet.value = value
  }

  destroy() {
    super.destroy()
    this.dryGain.disconnect()
    this.wetGain.disconnect()

    this.dryGain = null
    this.wetGain = null
  }

  saveString() {
    return JSON.stringify({
      nodeType: this.nodeType,
      gain: this.gain,
      audioParams: this.this.audioParams,
      dryWet: this.dryWet
    })
  }
}

module.exports = Compressor