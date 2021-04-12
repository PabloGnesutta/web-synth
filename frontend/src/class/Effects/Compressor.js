const Node = require("../Node");

const initialGain = 1

const audioParamsConfig = [
  { name: 'threshold', displayName: 'treshold', unit: '' },
  { name: 'knee', displayName: 'knee', unit: '' },
  { name: 'ratio', displayName: 'ratio', unit: '' },
  { name: 'attack', displayName: 'attack', unit: 's' },
  { name: 'release', displayName: 'release', unit: 's' },
]

class Compressor extends Node {
  static compressorCount = 0
  constructor(name) {
    super(name)

    this.name = name || "Comp " + ++Compressor.compressorCount
    this.nodeType = "Compressor"

    this.node = Node.context.createDynamicsCompressor()

    super.getAudioParams()
    this.initParams()
    this.initGain(initialGain)
  }

  initParams() {
    this.audioParams.forEach(ap => {
      const index = audioParamsConfig.findIndex(mms => mms.name === ap.name)
      //preserve default values
      ap.unit = audioParamsConfig[index].unit
      ap.displayName = audioParamsConfig[index].displayName
    })
  }
}

module.exports = Compressor