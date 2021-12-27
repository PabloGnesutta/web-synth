const Node = require("../Node");
const hasDryWet = require("../../composition/hasDryWet");
const hasAudioParams = require("../../composition/hasAudioParams");
const hasInnerNodeAudioParams = require("../../composition/hasInnerNodeAudioParams");

const freqMax = 7000;
const QMax = 30;

const initialGain = 1;

class BiquadFilter extends Node {
  static filterCount = 0;

  constructor(name) {
    super(initialGain, 'Effect', 'BiquadFilter');

    this.name = name || "Filter " + ++BiquadFilter.filterCount;

    this.type = 'lowpass';
    this.types = ['lowpass', 'highpass', 'bandpass', 'notch', 'lowshelf', 'highshelf', 'peaking'];

    this.modTypes = ['sine', 'triangle', 'sawtooth', 'square'];
    this.modType = "sawtooth";

    this.node = Node.context.createBiquadFilter();
    this.node.type = this.type;

    this.mod = Node.context.createOscillator();
    this.modGain = Node.context.createGain();

    this.mod.start();
    this.mod.type = this.modType;
    this.mod.connect(this.modGain);
    this.modGain.connect(this.node.frequency);

    this.inputNode.connect(this.node);

    this.initAudioParams();
    this.initInnerNodeAudioParams();
    this.refreshParams();

    hasDryWet(this);
  }

  initAudioParams() {
    this.audioParams = [
      {
        name: 'frequency', displayName: 'freq', unit: 'hz',
        minValue: 20, maxValue: freqMax, value: freqMax,
      },
      {
        name: 'Q', displayName: 'res', unit: '',
        minValue: -QMax, maxValue: QMax, value: 0,
      },
      {
        name: 'gain', displayName: 'gain', unit: '',
        minValue: -QMax, maxValue: QMax, value: 0,
      },
    ];
    hasAudioParams(this);
  }

  initInnerNodeAudioParams() {
    this.innerNodeAudioParams = [
      {
        name: 'modFrequency', displayName: 'freq', unit: 'hz', //%
        minValue: 0, maxValue: 60, value: 0,
        node: this.mod, nodeAudioParam: 'frequency'
      },
      {
        name: 'modAmount', displayName: 'amt', unit: '',
        minValue: 0, maxValue: 10000, value: 0,
        node: this.modGain, nodeAudioParam: 'gain'
      },
    ];
    hasInnerNodeAudioParams(this);
  }

  refreshParams() {
    this.setValuesAccordingToType();
    this.node.frequency.setValueAtTime(this.audioParams[0].value, 0);
    // this.node.Q.setValueAtTime(this.audioParams[1].value, 0)//
    // this.node.gain.setValueAtTime(this.audioParams[2].value, 0)//
  }

  setType(type) {
    this.type = type;
    this.node.type = type;
    this.refreshParams();
  }

  setModType(value) {
    this.mod.type = value;
    this.modType = value;
  }

  setValuesAccordingToType() {
    let freq;
    let q = {};
    switch (this.type) {
      case "lowpass":
        freq = freqMax;
        q.minValue = -30;
        q.maxValue = 30;
        q.value = 0;
        break;
      case "highpass":
        freq = 0;
        q.minValue = -20;
        q.maxValue = 20;
        q.value = 0;
        break;
      case "bandpass":
        freq = 3000;
        q.minValue = 0;
        q.maxValue = 6;
        q.value = 0;
        break;
      case "notch":
        freq = 4000;
        q.minValue = 0.01;
        q.maxValue = 10;
        q.value = 1;
        break;
      case "peaking":
        freq = 4000;
        q.minValue = 0;
        q.maxValue = 100;
        q.value = 1;
        break;
      default:
        freq = 0;
        q.minValue = -100;
        q.maxValue = 100;
        q.value = 1;
    }
    //freq
    this.audioParams[0].value = freq;
    //Q
    this.audioParams[1].minValue = q.minValue;
    this.audioParams[1].maxValue = q.maxValue;
    this.audioParams[1].value = q.value;
    //gain
  }

  saveString() {
    const jsonString = {
      type: this.type,
    };

    this.saveParams.forEach(param => {
      jsonString[param.name] = param.value;
    });

    return JSON.stringify(jsonString);
  }

  destroy() {
    super.destroy();

    this.mod.disconnect();
    this.mod = null;
    this.modGain.disconnect();
    this.modGain = null;
  }
}

module.exports = BiquadFilter;