const Node = require("../Node")

const initialGain = 0.5

const audioParamsConfig = [
  { name: 'threshold', displayName: 'treshold', unit: '' },
  { name: 'knee', displayName: 'knee', unit: '' },
  { name: 'ratio', displayName: 'ratio', unit: '' },
  { name: 'attack', displayName: 'attack', unit: 's' },
  { name: 'release', displayName: 'release', unit: 's' },
]

class Mic extends Node {
  constructor(stream) {
    super()

    this.name = "Mic"
    this.nodeType = "Mic"
    this.nodeRol = "Instrument"

    this.node = Node.context.createDynamicsCompressor()
    this.mic = Node.context.createMediaStreamSource(stream);
    this.mic.connect(this.node);

    super.getAudioParams()
    this.initParams()
    this.initGain(initialGain)
  }

  initParams() {
    this.audioParams.forEach(ap => {
      const index = audioParamsConfig.findIndex(mms => mms.name === ap.name)
      ap.unit = audioParamsConfig[index].unit
      ap.displayName = audioParamsConfig[index].displayName
    })
  }

  playNote(i) {
  }

  stopNote(i) {
  }

  onOtherKeyup(key) {
  }

  initInnerNodeAudioParams() {
    this.innerNodeAudioParams = [
      {
        name: 'modFrequency', displayName: 'mod freq', unit: 'hz',
        minValue: 0, maxValue: 500, value: 0, defaultValue: 0, step: 0.01,
        node: this.mod, nodeAudioParam: 'frequency'
      },
      {
        name: 'modAmount', displayName: 'mod amt', unit: '', //%
        minValue: 0, maxValue: 1000, value: 500, defaultValue: 500, step: 0.01,
        node: this.modGain, nodeAudioParam: 'gain'
      },
    ]
  }
}

module.exports = Mic