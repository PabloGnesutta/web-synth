const Node = require("../Node")
const dirName = "/audio/samples/"
const drumSamples = require("../../data/drumSamples")

const initialGain = 1.2

class Drumkit extends Node {
  static drumkitCount = 0

  constructor() {
    super(initialGain)

    this.name = "Drumkit " + ++Drumkit.drumkitCount
    this.nodeType = "Drumkit"
    this.nodeRol = "Instrument"
    this.buffers = []

    this.inputNode.connect(this.outputNode)

    this.initSamplers()
  }

  async initSamplers() {
    let i = 0
    for (const ds of drumSamples) {
      let response = await fetch(dirName + drumSamples[i++])
      let arrayBuffer = await response.arrayBuffer()
      let audioBuffer = await Node.context.decodeAudioData(arrayBuffer)
      this.buffers.push(audioBuffer)
    }
  }

  playNote(i) {
    this.source = Node.context.createBufferSource();
    this.source.buffer = this.buffers[i];

    this.source.start(0);
    this.source.connect(this.outputNode);
  }

  stopNote(i) {
  }

  onOtherKeyup(key) { }

  destroy() {
    super.destroy()
    this.buffers = []
  }
}

module.exports = Drumkit