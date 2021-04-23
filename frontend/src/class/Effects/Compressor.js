const Node = require("../Node");
const initialGain = 1

class Compressor extends Node {
  static compressorCount = 0
  constructor() {
    super(initialGain)

    this.name = "Comp " + ++Compressor.compressorCount
    this.nodeType = "Compressor"

    this.node = Node.context.createDynamicsCompressor()
    this.node.connect(this.outputNode)

    //nest step
    this.inputNode.connect(this.node)

    this.initAudioParams()
  }

  initAudioParams() {
    this.audioParams = [
      {
        name: 'threshold', displayName: 'treshold', unit: '',
        minValue: -100, maxValue: 0, value: -24, defaultValue: -24, step: 0.01
      },
      {
        name: 'knee', displayName: 'knee', unit: '',
        minValue: 0, maxValue: 40, value: 30, defaultValue: 30, step: 0.01
      },
      {
        name: 'ratio', displayName: 'ratio', unit: '',
        minValue: 1, maxValue: 20, value: 12, defaultValue: 12, step: 0.01
      },
      {
        name: 'attack', displayName: 'attack', unit: 's',
        minValue: 0, maxValue: 1, value: 0, defaultValue: 0, step: 0.01
      },
      {
        name: 'release', displayName: 'release', unit: 's',
        minValue: 0, maxValue: 1, value: 0.3, defaultValue: 0.3, step: 0.01
      },
    ]
  }
}

module.exports = Compressor