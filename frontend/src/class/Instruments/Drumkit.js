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

    this.buffers = []

    this.initSamplers()
    this.initGain()
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

    //for looper bug
    this.keepOutputAlive = Node.context.createGain()
    this.keepOutputAlive.connect(this.outputNode)
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

    this.source = Node.context.createBufferSource();
    this.source.buffer = this.buffers[noteIndex];

    this.source.start(0);
    this.source.connect(this.outputNode);
  }

  stopNote(i) {
    // this.source.disconnect();
    // this.source.stop(0);
  }

  onOtherKeyup(key) { }
}

module.exports = Drumkit