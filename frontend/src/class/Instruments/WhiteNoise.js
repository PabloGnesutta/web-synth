const Node = require("../Node")

const initialGain = 1
const QMax = 30
const frequencyMax = 7000

const audioParamsConfig = [
  {
    name: 'frequency', displayName: 'cutoff', unit: 'hz',
    minValue: 20, maxValue: frequencyMax, value: frequencyMax, defaultValue: frequencyMax, step: 1
  },
  {
    name: 'Q', displayName: 'res', unit: '',
    minValue: -QMax, maxValue: QMax, value: 2, defaultValue: 2, step: 0.01
  },
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
    this.node = Node.context.createBiquadFilter()
    this.node.type = 'bandpass'

    super.getAudioParams(['gain', 'detune'])
    super.initParams(audioParamsConfig)
    this.initGain(initialGain)
  }

  playNote(i) {
    const cutoff = i.map(15, 0, 500, frequencyMax);
    if (this.playing) return
    this.whiteNoise = Node.context.createBufferSource();
    this.whiteNoise.buffer = this.noiseBuffer;
    this.whiteNoise.loop = true;
    this.whiteNoise.connect(this.node)
    this.node.frequency.setValueAtTime(this.node.frequency.value, 0)
    this.node.frequency.setValueAtTime(cutoff, 0)
    this.whiteNoise.start()
    this.playing = true
  }

  stopNote(i) {
    if (!this.playing) return
    this.whiteNoise.stop()
    this.playing = false
  }

  onOtherKeyup(key) {
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