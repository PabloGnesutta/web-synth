const Node = require("../Node");
const noteFrequencies = require("../../data/noteFrequencies");

const polyphony = 15;
const peak = 1;
const initialGain = 0.5;

class Femod extends Node {
  static femodCount = 0;

  constructor(saveObjct) {
    super(initialGain, "Instrument", "Femod");

    ++Femod.femodCount;
    this.name = saveObjct?.name || "Femod " + Femod.femodCount;

    this.types = ["sine", "triangle", "sawtooth", "square"];
    this.type = saveObjct?.type || "sawtooth";

    this.noteIndexInUse = Array(polyphony).fill(null);
    this.available = Array(polyphony).fill(true);
    this.inUse = Array(polyphony).fill(false);

    this.ADSRGains = Array(polyphony);
    this.modulators = Array(polyphony);
    this.modulatorGains = Array(polyphony);
    this.oscillators = Array(polyphony);

    this.inputNode.connect(this.outputNode);

    this.initModulationParams(saveObjct?.modulationParams);
    this.initCustomParams(saveObjct?.customParams);
  }

  initCustomParams(saveObjctCustomParams) {
    this.customParams = [
      {
        name: "A",
        displayName: "attack",
        unit: 's',
        minValue: 0,
        maxValue: 5,
        value: 0.1,
      },
      {
        name: "D",
        displayName: "decay",
        unit: 's',
        minValue: 0.01,
        maxValue: 3,
        value: 1,
      },
      {
        name: "S",
        displayName: "sustain",
        unit: '',
        minValue: 0,
        maxValue: 1,
        value: 0.5,
      },
      {
        name: "R",
        displayName: "release",
        unit: 's',
        minValue: 0.001,
        maxValue: 5,
        value: 2,
      },
      {
        name: "detune",
        displayName: "fine",
        unit: '%',
        minValue: -100,
        maxValue: 100,
        value: 0,
      },
    ];

    const valuesToLoad = saveObjctCustomParams || this.customParams;
    for (let i = 0; i < this.customParams.length; i++) {
      this.setCustomParam(i, valuesToLoad[i].value);
    }
  }

  setCustomParam(paramIndex, value) {
    const customParam = this.customParams[paramIndex];
    customParam.value = value;
    this[customParam.name] = parseFloat(value);
  }

  initModulationParams(saveObjctModulationParams) {
    this.modulationParams = [
      {
        name: "modType",
        displayName: "mod type",
        value: "triangle",
        types: ['sine', 'triangle', 'sawtooth', 'square'],
      },
      {
        name: "modLevelValue",
        displayName: "mod amt",
        unit: '',
        minValue: 0,
        maxValue: 3000,
        value: 100,
      },
      {
        name: "modDetune",
        displayName: "fine",
        unit: '',
        minValue: -100,
        maxValue: 100,
        value: 0,
      },
    ];

    const valuesToLoad = saveObjctModulationParams || this.modulationParams;
    for (let i = 0; i < this.modulationParams.length; i++) {
      this.setModulationParam(i, valuesToLoad[i].value);
    }
  }

  setModulationParam(paramIndex, value) {
    const modulationParam = this.modulationParams[paramIndex];
    modulationParam.value = value;
    this[modulationParam.name] = value;
  }

  setType(value) {
    this.type = value;
  }

  playNote(i) {
    //polyphony
    const index = this.getFirstAvailable();
    if (index === -1) return;
    this.setInUse(index, i);

    let detune = this.customParams[4].value;

    const freq = noteFrequencies[i];
    const t0 = Node.context.currentTime;
    const t1 = t0 + this.A;

    const ADSRGain = Node.context.createGain();
    ADSRGain.connect(this.outputNode);

    const oscillator = Node.context.createOscillator();
    oscillator.type = this.type;
    oscillator.connect(ADSRGain);
    oscillator.start(t0);

    //FM
    const modLevel = Node.context.createGain();
    const mod = Node.context.createOscillator();
    mod.start(t0);

    modLevel.connect(oscillator.frequency);
    modLevel.gain.setValueAtTime(this.modLevelValue, t0);
    mod.type = this.modType;

    mod.frequency.setValueAtTime(freq, t0); //sync with note freq
    mod.detune.value = this.modDetune;
    mod.connect(modLevel);

    oscillator.frequency.setValueAtTime(freq, t0);
    oscillator.detune.value = detune;

    ADSRGain.gain.setValueAtTime(0, t0);
    ADSRGain.gain.linearRampToValueAtTime(peak, t1);
    ADSRGain.gain.linearRampToValueAtTime(this.S, t1 + this.D);

    this.modulatorGains[index] = modLevel;
    this.modulators[index] = mod;
    this.ADSRGains[index] = ADSRGain;
    this.oscillators[index] = oscillator;
  }

  stopNote(i) {
    const index = this.getInuseIndexByNote(i);
    if (index === -1) return;
    const ADSRGain = this.ADSRGains[index];
    const oscillator = this.oscillators[index];
    const modulator = this.modulators[index];

    const t = Node.context.currentTime;

    ADSRGain.gain.cancelScheduledValues(t);
    ADSRGain.gain.setValueAtTime(ADSRGain.gain.value, t);
    ADSRGain.gain.linearRampToValueAtTime(0, t + this.R);

    oscillator.stop(t + this.R);
    modulator.stop(t + this.R);

    setTimeout(() => {
      oscillator.disconnect();
      ADSRGain.disconnect();
      // anda bien para memory leak pero el release la caga:
      // modulator.disconnect()
      // this.modulatorGains[index].disconnect()
    }, this.R * 1000);

    this.setNotInUse(index);
  }

  saveString() {
    const jsonString = {
      name: this.name,
      type: this.type,
      customParams: this.customParams.map(param => {
        return { name: param.name, value: param.value };
      }),
      modulationParams: this.modulationParams.map(param => {
        return { name: param.name, value: param.value };
      }),
    };

    this.saveParams.forEach(param => {
      jsonString[param.name] = param.value;
    });

    return JSON.stringify(jsonString);
  }

  destroy() {
    super.destroy();

    this.inUse = null;
    this.available = null;
    this.noteIndexInUse = null;
    this.modulationParams = null;

    for (let i = 0; i < polyphony; i++)
      if (this.ADSRGains[i]) {
        this.ADSRGains[i].disconnect();
        this.modulators[i].disconnect();
        this.oscillators[i].disconnect();
      }

    this.ADSRGains = null;
    this.modulators = null;
    this.oscillators = null;
  }

  // Polyphony helper functions

  getFirstAvailable() {
    let found = false;
    let index = -1;
    while (!found && index < polyphony) {
      index++;
      found = this.available[index];
    }
    if (!found) index = -1;
    else this.available[index] = false;
    return index;
  }

  setInUse(inUseIndex, noteIndex) {
    this.inUse[inUseIndex] = true;
    this.noteIndexInUse[inUseIndex] = noteIndex;
  }

  setNotInUse(index) {
    this.inUse[index] = false;
    this.available[index] = true;
  }

  getInuseIndexByNote(i) {
    return this.noteIndexInUse.findIndex(ni => ni === i);
  }
}

module.exports = Femod;