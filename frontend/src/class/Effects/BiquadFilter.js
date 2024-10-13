const hasDryWet = require("../../composition/hasDryWet");
const hasAudioParams = require("../../composition/hasAudioParams");
const hasInnerNodeAudioParams = require("../../composition/hasInnerNodeAudioParams");
const { runSaveFunctions } = require("../nodeUtils");
const Node = require("../Node");


const initialGain = 1;

class BiquadFilter extends Node {
  static filterCount = 0;

  constructor(saveObject) {
    super(initialGain, 'Effect', 'BiquadFilter');

    this.name = saveObject?.name || "Filter " + ++BiquadFilter.filterCount;

    this.types = ['lowpass', 'highpass', 'bandpass', 'notch', 'lowshelf', 'highshelf', 'peaking'];
    this.modTypes = ['sine', 'triangle', 'sawtooth', 'square'];

    this.type = saveObject?.type || 'lowpass';
    this.modType = saveObject?.modType || "sawtooth";

    this.node = Node.context.createBiquadFilter();
    this.node.type = this.type;

    this.mod = Node.context.createOscillator();
    this.modGain = Node.context.createGain();

    this.mod.start();
    this.mod.type = this.modType;
    this.mod.connect(this.modGain);
    this.modGain.connect(this.node.frequency);

    this.inputNode.connect(this.node);

    this.initAudioParams(saveObject?.audioParams);
    this.initInnerNodeAudioParams(saveObject?.innerNodeAudioParams);

    hasDryWet(this, saveObject?.dryWet);
  }

  initAudioParams(saveObjectAudioParams) {
    // Frequency, Resonance (Q), Gain
    this.audioParams = [
      {
        name: 'frequency', displayName: 'freq', unit: 'hz',
        minValue: 20, maxValue: 7000, value: 1000,
      },
      {
        name: 'Q', displayName: 'res', unit: '',
        minValue: -30, maxValue: 30, value: 0,
      },
      {
        name: 'gain', displayName: 'gain', unit: '',
        minValue: 0, maxValue: 3, value: 100,
      },
    ];

    hasAudioParams(this);
    const valuesToLoad = saveObjectAudioParams || this.audioParams;

    for (let i = 0; i < this.audioParams.length; i++) {
      this.setAudioParam(i, valuesToLoad[i].value);
    }

    this.setAudioParamsContraints();
  }

  initInnerNodeAudioParams(saveObjectInnerNodeAudioParams) {
    this.innerNodeAudioParams = [
      {
        name: 'modFrequency', displayName: 'freq', unit: 'hz',
        node: this.mod, nodeAudioParam: 'frequency',
        minValue: 0, maxValue: 60, value: 10,
      },
      {
        name: 'modAmount', displayName: 'amt', unit: '',
        node: this.modGain, nodeAudioParam: 'gain',
        minValue: 0, maxValue: 10000, value: 0,
      },
    ];

    hasInnerNodeAudioParams(this);
    const valuesToLoad = saveObjectInnerNodeAudioParams || this.audioParams;

    for (let i = 0; i < this.innerNodeAudioParams.length; i++) {
      this.setInnerNodeAudioParam(i, valuesToLoad[i].value);
    }
  }

  setAudioParamsContraints() {
    let q = {};
    let gain = {};
    switch (this.type) {
      case "lowpass":
        q.minValue = -30;
        q.maxValue = 30;
        q.value = 0;
        break;
      case "highpass":
        q.minValue = -30;
        q.maxValue = 30;
        q.value = 0;
        break;
      case "bandpass":
        q.minValue = 0;
        q.maxValue = 5;
        q.value = 0;
        break;
      case "notch":
        q.minValue = 0;
        q.maxValue = 5;
        q.value = 1;
        break;
      case "lowshelf":
        gain.minValue = -20;
        gain.maxValue = 20;
        gain.value = 1;
        break;
      case "highshelf":
        gain.minValue = -20;
        gain.maxValue = 20;
        gain.value = 1;
        break;
      case "peaking":
        q.minValue = 0;
        q.maxValue = 20;
        q.value = 1;
        gain.minValue = -20;
        gain.maxValue = 20;
        gain.value = 1;
        break;
    }
    if (q.value !== undefined) {
      this.audioParams[1].minValue = q.minValue;
      this.audioParams[1].maxValue = q.maxValue;
      if (this.audioParams[1].value > q.maxValue || this.audioParams[1].value < q.minValue) {
        let newValue = this.audioParams[1].value > q.maxValue ? q.maxValue : q.minValue;
        this.setAudioParam(1, newValue);
      }
    }
    if (gain.value !== undefined) {
      this.audioParams[2].minValue = gain.minValue;
      this.audioParams[2].maxValue = gain.maxValue;
      if (this.audioParams[2].value > gain.maxValue || this.audioParams[2].value < gain.minValue) {
        let newValue = this.audioParams[2].value > gain.maxValue ? gain.maxValue : gain.minValue;
        this.setAudioParam(2, newValue);

      }
    }
  }

  setType(type) {
    this.type = type;
    this.node.type = type;
    this.setAudioParamsContraints();
  }

  setModType(value) {
    this.mod.type = value;
    this.modType = value;
  }

  saveString() {
    const effectData = {
      name: this.name,
      type: this.type,
      modType: this.modType
    };

    this.saveParams.forEach(param => {
      effectData[param.name] = param.value;
    });

    runSaveFunctions(effectData, this.saveFunctions)
    return JSON.stringify(effectData);
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