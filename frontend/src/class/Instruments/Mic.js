const Node = require("../Node")

const initialGain = 0.05

class Mic extends Node {
  static micCount = 0

  constructor(stream) {
    super(initialGain)

    this.name = "Mic " + ++Mic.micCount;
    this.nodeType = "Mic"
    this.nodeRol = "Instrument"

    this.node = Node.context.createDynamicsCompressor()
    this.mic = Node.context.createMediaStreamSource(stream);
    this.mic.connect(this.node);
    this.node.connect(this.outputNode)

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

  setAudioParam(index, value) {
    let curvedValue = parseFloat(value)

    const param = this.audioParams[index];
    this.node[param.name].setValueAtTime(curvedValue, 0);
    this.audioParams[index].value = parseFloat(value);
  }

  playNote(i) {
  }

  stopNote(i) {
  }

  onOtherKeyup(key) {
  }


}

module.exports = Mic