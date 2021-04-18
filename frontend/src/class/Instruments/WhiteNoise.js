const Node = require("../Node")

const initialGain = 0.5
const audioParamsConfig = [
  { name: 'playbackRate', displayName: 'playback rate', unit: '', minValue: 0, maxValue: 1, value: 1, defaultValue: 1, step: 0.001 },
]

class WhiteNoise extends Node {
  static noiseCount = 0

  constructor(name) {
    super(name)

    this.name = name || "Noise " + ++WhiteNoise.noiseCount
    this.nodeType = "WhiteNoise"
    this.nodeRol = "Instrument"

    this.playing = false

    this.createWhiteNoiseBuffer()
    this.node = Node.context.createGain()

    // super.getAudioParams(['detune'])
    super.initParams(audioParamsConfig)
    this.initGain(initialGain)
  }

  playNote(noteIndex) {
    if (this.playing) return
    this.whiteNoise = Node.context.createBufferSource();
    this.whiteNoise.connect(this.node)
    this.whiteNoise.buffer = this.noiseBuffer;
    this.whiteNoise.loop = true;
    this.whiteNoise.start()
    this.playing = true
  }

  stopNote(noteIndex) {
    if (!this.playing) return
    this.whiteNoise.stop()
    this.playing = false
  }

  initGain(initialGain) {
    this.gain = initialGain

    this.level = Node.context.createGain()
    this.level.gain.setValueAtTime(this.gain, 0)
    this.outputNode = this.level

    this.node.connect(this.outputNode)
  }

  createWhiteNoiseBuffer() {
    const bufferSize = 2 * Node.context.sampleRate;
    this.noiseBuffer = Node.context.createBuffer(
      1,
      bufferSize,
      Node.context.sampleRate
    );

    const output = this.noiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
  }
}

module.exports = WhiteNoise