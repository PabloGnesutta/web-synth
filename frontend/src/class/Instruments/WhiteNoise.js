const Node = require("../Node")

const initialGain = 0
const minMaxStep = [
  { name: 'playbackRate', minValue: 0, maxValue: 1, value: 1, defaultValue: 1, step: 0.001 },
]

class Delay extends Node {
  static noiseCount = 0

  constructor(name) {
    super(name)

    this.name = name || "Noise " + ++Delay.noiseCount
    this.nodeType = "BufferSource"
    this.nodeRol = "Instrument"

    const bufferSize = 2 * Node.context.sampleRate;
    const noiseBuffer = Node.context.createBuffer(
      1,
      bufferSize,
      Node.context.sampleRate
    );

    const output = noiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.node = Node.context.createBufferSource();
    this.node.buffer = noiseBuffer;
    this.node.loop = true;

    super.getAudioParams(['detune'])
    super.setMinMaxStep(minMaxStep)
    this.initGain(initialGain)
    this.node.start()
  }

  initGain(initialGain) {
    this.gain = initialGain

    this.level = Node.context.createGain()
    this.level.gain.setValueAtTime(this.gain, 0)
    this.outputNode = this.level

    this.node.connect(this.outputNode)
  }
}

module.exports = Delay