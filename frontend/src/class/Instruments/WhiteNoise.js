const Node = require("../Node")
const initialGain = 1
const QMax = 30
const frequencyMax = 7000

class WhiteNoise extends Node {
  static noiseCount = 0

  constructor() {
    super(initialGain)

    this.name = name || "Noise " + ++WhiteNoise.noiseCount
    this.nodeType = "WhiteNoise"
    this.nodeRol = "Instrument"

    this.playing = false

    this.createWhiteNoiseBuffer()
    this.node = Node.context.createBiquadFilter()
    this.node.type = 'bandpass'

    this.mod = Node.context.createOscillator()
    this.modGain = Node.context.createGain()
    this.mod.connect(this.modGain)
    this.modGain.gain.value = 500
    this.mod.start()
    this.modGain.connect(this.node.frequency)

    this.node.connect(this.outputNode)
    this.inputNode.connect(this.outputNode)

    this.initAudioParams()
    this.initInnerNodeAudioParams()
  }

  playNote(i) {
    if (this.playing) return
    const filterFreq = i.map(15, 0, 500, frequencyMax);
    this.node.frequency.setValueAtTime(filterFreq, 0)

    this.whiteNoise = Node.context.createBufferSource();
    this.whiteNoise.buffer = this.noiseBuffer;
    this.whiteNoise.loop = true;

    this.whiteNoise.start(0)
    this.whiteNoise.connect(this.node)
    this.playing = true
  }

  stopNote(i) {
    if (!this.playing) return
    this.whiteNoise.disconnect()
    this.whiteNoise.stop()
    this.playing = false
  }

  onOtherKeyup(key) {
  }

  initAudioParams() {
    this.audioParams = [
      {
        name: 'frequency', displayName: 'cutoff', unit: 'hz',
        minValue: 20, maxValue: frequencyMax, value: frequencyMax, defaultValue: frequencyMax, step: 1
      },
      {
        name: 'Q', displayName: 'res', unit: '',
        minValue: -QMax, maxValue: QMax, value: 20, defaultValue: 20, step: 0.01
      },
    ]
  }

  setAudioParam(index, value) {
    let curvedValue = parseFloat(value)

    const param = this.audioParams[index];
    this.node[param.name].setValueAtTime(curvedValue, 0);
    this.audioParams[index].value = parseFloat(value);
  }

  initInnerNodeAudioParams() {
    this.innerNodeAudioParams = [
      {
        name: 'modFrequency', displayName: 'mod freq', unit: 'hz',
        minValue: 0, maxValue: 500, value: 8, defaultValue: 8, step: 0.01,
        node: this.mod, nodeAudioParam: 'frequency'
      },
      {
        name: 'modAmount', displayName: 'mod amt', unit: '', //%
        minValue: 0, maxValue: 1000, value: 600, defaultValue: 600, step: 0.01,
        node: this.modGain, nodeAudioParam: 'gain'
      },
    ]
  }

  setInnerNodeAudioParam(indexOrName, value) {
    let index = indexOrName
    if (typeof (indexOrName) !== 'number') index = this.innerNodeAudioParams.findIndex(inap => inap.name === indexOrName)

    const innerNodeAudioParam = this.innerNodeAudioParams[index];
    innerNodeAudioParam.node[innerNodeAudioParam.nodeAudioParam].setValueAtTime(value, 0);
    this.innerNodeAudioParams[index].value = parseFloat(value);
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