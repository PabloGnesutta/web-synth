const Node = require("../Node");
const dirName = "/audio/impulse_responses/"

const initialGain = 1

class Reverb extends Node {
  static reverbCount = 0

  constructor() {
    super(initialGain)

    this.name = "Reverb " + ++Reverb.reverbCount
    this.nodeType = "Reverb"
    this.types = ['Five Columns', 'Bottle Hall', 'Deep Space', 'In The Silo', 'Chateau Outside', 'Damp Lg Room']
    this.type = 'In The Silo'

    this.convolver = Node.context.createConvolver()
    this.dryGain = Node.context.createGain()
    this.wetGain = Node.context.createGain()

    this.inputNode.connect(this.convolver)
    this.inputNode.connect(this.dryGain)
    this.convolver.connect(this.wetGain)

    this.dryGain.connect(this.outputNode)
    this.wetGain.connect(this.outputNode)

    this.initDryWet()
    this.setType(this.type)
  }

  saveString() {
    return JSON.stringify({
      nodeType: this.nodeType,
      gain: this.gain,
      type: this.type,
      dryWet: this.dryWet
    })
  }

  //se podrían cachear los buffers, o no...
  setType(type) {
    fetch(dirName + type + '.wav').then(res => { return res.arrayBuffer() })
      .then((arrayBuffer) => {
        Node.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
          this.convolver.buffer = audioBuffer
        });
      })
  }

  initDryWet() {
    this.dryWet = {
      name: "dry/wet",
      displayName: "dry/wet",
      unit: '', //%
      minValue: 0,
      maxValue: 1,
      value: 0.3,
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
    this.convolver.disconnect()

    this.dryGain = null
    this.wetGain = null
    this.convolver = null
  }

}

module.exports = Reverb