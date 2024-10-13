const hasAudioParams = require("../../composition/hasAudioParams");
const hasInnerNodeAudioParams = require("../../composition/hasInnerNodeAudioParams");
const Node = require("../Node");


const QMax = 30;
const frequencyMax = 7000;
const initialGain = 1;

class WhiteNoise extends Node {
  static noiseCount = 0;

  constructor() {
    super(initialGain, "Instrument", "WhiteNoise");

    this.name = name || "Noise " + ++WhiteNoise.noiseCount;

    this.playing = false;

    this.createWhiteNoiseBuffer();
    this.node = Node.context.createBiquadFilter();
    this.node.type = 'bandpass';

    this.modGain = Node.context.createGain();
    this.modGain.gain.value = 500;
    this.modGain.connect(this.node.frequency);

    this.mod = Node.context.createOscillator();
    this.mod.type = 'triangle';
    this.mod.connect(this.modGain);
    this.mod.start();

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

  initAudioParams() {
    hasAudioParams(this);

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

    for (let i = 0; i < this.audioParams.length; i++) {
      this.setAudioParam(i, this.audioParams[i].value);
    }
  }

  initInnerNodeAudioParams() {
    hasInnerNodeAudioParams(this);

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

    for (let i = 0; i < this.innerNodeAudioParams.length; i++) {
      this.setInnerNodeAudioParam(i, this.innerNodeAudioParams[i].value);
    }
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

  // todo: handle load effect
  saveString() {
    const instrumentData = { name: this.name };
    this.saveParams.forEach(param => instrumentData[param.name] = param.value);
    return JSON.stringify(instrumentData);
  }

  destroy() {
    super.destroy();
    this.mod.disconnect();
    this.modGain.disconnect();
  }
}

module.exports = WhiteNoise;