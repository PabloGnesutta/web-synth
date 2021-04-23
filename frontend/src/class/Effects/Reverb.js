const Node = require("../Node");
const dirName = "/audio/impulse_responses/"

const initialGain = 1

class Reverb extends Node {
  static reverbCount = 0

  constructor() {
    super(initialGain)

    this.name = "Reverb " + ++Reverb.reverbCount
    this.nodeType = "Reverb"
    this.types = ['Five Columns', 'Bottle Hall', 'Deep Space', 'In The Silo', 'In The Other Silo', 'Chateau Outside', 'Damp Lg Room']
    this.type = 'In The Silo'

    this.convolver = Node.context.createConvolver()
    this.dryGain = Node.context.createGain()
    this.wetGain = Node.context.createGain()

    this.inputNode.connect(this.convolver)
    this.inputNode.connect(this.dryGain)
    this.convolver.connect(this.wetGain)

    this.dryGain.connect(this.outputNode)
    this.wetGain.connect(this.outputNode)

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