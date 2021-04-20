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
    this.buffers = [s]
  }

  initGain() {
    this.gain = initialGain
    this.level = Node.context.createGain()
    this.level.gain.setValueAtTime(this.gain, 0)
    this.outputNode = this.level
  }

  initSamplers() {
    const that = this;
    //hacer for común
    drumSamples.forEach((ds, i) => {
      fetch(dirName + ds.sampleName).then(res => { return res.arrayBuffer() })
        .then((arrayBuffer) => {
          Node.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
            that.buffers.push(audioBuffer)
          });
        })
    });
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