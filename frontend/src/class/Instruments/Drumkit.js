const Node = require("../Node")
const drumSamples = require("../../data/drumSamples")
const drumKeys = require("../../data/drumKeys")

const initialGain = 0.5

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
    // this.scaleNodes.forEach(sn => {
    //   sn.destroy()
    //   sn.level.disconnect()
    //   sn.level = null
    //   sn = null;
    // })
    // this.scaleNodes = []
  }

  initGain() {
    this.gain = initialGain
    this.level = Node.context.createGain()
    this.level.gain.setValueAtTime(this.gain, 0)
    this.outputNode = this.level
  }

  initSamplers() {
    const that = this;

    drumSamples.forEach((ds, i) => {
      const request = new XMLHttpRequest();
      request.open("GET", "/audio/samples/" + ds.sampleName);
      request.responseType = "arraybuffer";

      request.onload = function () {
        Node.context.decodeAudioData(request.response, (audioBuffer) => {
          that.buffers.push(audioBuffer)
        });
      };
      request.send();
    });
  }

  playNote(i) {
    let noteIndex = i

    const source = Node.context.createBufferSource();
    source.buffer = this.buffers[noteIndex];

    source.connect(this.outputNode);
    source.start(0);
  }

  stopNote(i) {
    // this.scaleNodes[i].stop();
  }

  onOtherKeyup(key) { }
}

module.exports = Drumkit