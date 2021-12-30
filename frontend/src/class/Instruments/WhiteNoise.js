const Node = require("../Node");
const hasAudioParams = require("../../composition/hasAudioParams");
const hasInnerNodeAudioParams = require("../../composition/hasInnerNodeAudioParams");

const QMax = 30;
const frequencyMax = 7000;

const initialGain = 1;

class WhiteNoise extends Node {
  static noiseCount = 0;

  constructor() {
    super(initialGain);

    this.name = name || "Noise " + ++WhiteNoise.noiseCount;
    this.nodeType = "WhiteNoise";
    this.nodeRol = "Instrument";

    this.playing = false;

    this.createWhiteNoiseBuffer();
    this.node = Node.context.createBiquadFilter();
    this.node.type = 'bandpass';

    this.mod = Node.context.createOscillator();
    this.mod.type = 'triangle';
    this.modGain = Node.context.createGain();
    this.mod.connect(this.modGain);
    this.mod.start();
    this.modGain.gain.value = 500;
    this.modGain.connect(this.node.frequency);

    this.node.connect(this.outputNode);
    this.inputNode.connect(this.outputNode);

    this.initAudioParams();
    this.initInnerNodeAudioParams();
  }

  playNote(i) {
    if (this.playing) return;
    const filterFreq = i.map(30, 90, 0, frequencyMax);
    this.node.frequency.setValueAtTime(filterFreq, 0);

    this.whiteNoise = Node.context.createBufferSource();
    this.whiteNoise.buffer = this.noiseBuffer;
    this.whiteNoise.loop = true;

    this.whiteNoise.connect(this.node);
    this.whiteNoise.start(0);
    this.playing = true;
  }

  stopNote(i) {
    if (!this.playing) return;
    this.whiteNoise.disconnect();
    this.whiteNoise.stop();
    this.playing = false;
  }

  onOtherKeyup(key) { }

  initAudioParams() {
    this.audioParams = [
      {
        name: 'frequency', displayName: 'cutoff', unit: 'hz',
        minValue: 20, maxValue: frequencyMax, value: frequencyMax,
      },
      {
        name: 'Q', displayName: 'res', unit: '',
        minValue: 0, maxValue: QMax, value: 20,
      },
    ];

    hasAudioParams(this);
  }

  initInnerNodeAudioParams() {
    this.innerNodeAudioParams = [
      {
        name: 'modFrequency', displayName: 'mod freq', unit: 'hz',
        minValue: 0, maxValue: 200, value: 4,
        node: this.mod, nodeAudioParam: 'frequency'
      },
      {
        name: 'modAmount', displayName: 'mod amt', unit: '', //%
        minValue: 0, maxValue: 1000, value: 600,
        node: this.modGain, nodeAudioParam: 'gain'
      },
    ];

    hasInnerNodeAudioParams(this);
  }

  createWhiteNoiseBuffer() {
    const bufferSize = 2 * Node.context.sampleRate;
    this.noiseBuffer = Node.context.createBuffer(
      1,
      bufferSize,
      Node.context.sampleRate
    );

    const output = this.noiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  destroy() {
    super.destroy();

    this.mod.disconnect();
    this.modGain.disconnect();
  }
}

module.exports = WhiteNoise;