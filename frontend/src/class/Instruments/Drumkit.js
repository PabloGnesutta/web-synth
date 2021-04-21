const Node = require("../Node")
const drumSamples = require("../../data/drumSamples")
// const drumKeys = require("../../data/drumKeys")

const ctx = Node.context
const dirName = "/audio/samples/"
const initialGain = 1.2

class Drumkit extends Node {
  static drumkitCount = 0

  constructor(tpye, name) {
    super(name)

    this.name = name || "Drumkit " + ++Drumkit.drumkitCount
    this.nodeType = "Drumkit"
    this.nodeRol = "Instrument"

    this.scaleNodes = []
    this.buffers = []

    this.initGain()
    this.initSamplers()
  }

  destroy() {
    super.destroy(true)
    this.buffers = []
  }

  initGain() {
    this.gain = initialGain
    this.level = Node.context.createGain()
    this.level.gain.setValueAtTime(this.gain, 0)
    this.outputNode = this.level
  }

  async initSamplers() {
    let i = 0
    //hago for of para que se lean en orden
    for (const ds of drumSamples) {
      let response = await fetch(dirName + drumSamples[i++].sampleName)
      let arrayBuffer = await response.arrayBuffer()
      let audioBuffer = await Node.context.decodeAudioData(arrayBuffer)
      this.buffers.push(audioBuffer)
    }
  }

  playNote(i) {
    let noteIndex = i

    const source = Node.context.createBufferSource();
    source.buffer = this.buffers[noteIndex];

    source.connect(this.outputNode);
    source.start(0);
  }

  stopNote(i) { }

  onOtherKeyup(key) { }
}

module.exports = Drumkit