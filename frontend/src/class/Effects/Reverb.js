const Node = require("../Node");
const dirName = "/audio/impulse_responses/"

const initialGain = 1

class Reverb extends Node {
  static reverbCount = 0

  constructor(type, name) {
    super(name)

    this.name = name || "Reverb " + ++Reverb.reverbCount
    this.nodeType = "Reverb"
    this.types = ['Five Columns', 'Bottle Hall', 'Deep Space', 'In The Silo', 'In The Other Silo', 'Chateau Outside', 'Damp Lg Room']
    this.type = type || 'In The Silo'

    this.node = Node.context.createGain()
    this.convolver = Node.context.createConvolver()
    this.dryGain = Node.context.createGain()
    this.wetGain = Node.context.createGain()

    this.node.connect(this.convolver)
    this.node.connect(this.dryGain)
    this.convolver.connect(this.wetGain)

    this.initGain(initialGain)

    this.initCustomParams()
    this.initReverb(this.type)
  }

  //se podrían cachear los buffers
  initReverb(type) {
    fetch(dirName + type + '.wav').then(res => { return res.arrayBuffer() })
      .then((arrayBuffer) => {
        Node.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
          this.convolver.buffer = audioBuffer
        });
      })
  }

  initGain(initialGain) {
    this.gain = initialGain

    this.level = Node.context.createGain()
    this.level.gain.setValueAtTime(this.gain, 0)
    this.outputNode = this.level

    this.dryGain.connect(this.outputNode)
    this.wetGain.connect(this.outputNode)
  }

  initCustomParams() {
    const setDryWet = (value) => {
      this.wetGain.gain.value = value
      this.dryGain.gain.value = value.map(0, 1, 1, 0)
    }

    this.customParams = [
      {
        name: "dry/wet",
        displayName: "dry/wet",
        unit: '', //%
        minValue: 0,
        maxValue: 1,
        defaultValue: 0.4,
        value: 0.4,
        step: 0.01,
        set(v) { setDryWet(v) }
      },
    ]
  }

  setType(type) {
    this.initReverb(type)
  }

}

module.exports = Reverb