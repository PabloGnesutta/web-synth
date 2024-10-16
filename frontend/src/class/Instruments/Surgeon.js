const noteFrequencies = require("../../data/noteFrequencies");
const Node = require("../Node");


const polyphony = 12;
const modulatorPeak = 2000;
const carrierConstraints = { minValue: 0, maxValue: 1, value: 1 };
const modulatorConstraints = { minValue: 0, maxValue: modulatorPeak, value: modulatorPeak };
const initialGain = 0.7;
const oscillatorsPerNote = 3;

class Surgeon extends Node {
  static SurgeonCount = 0;

  constructor(saveObject) {
    super(initialGain, "Instrument", "Surgeon");
    this.name = saveObject?.name || "Surgeon " + ++Surgeon.SurgeonCount;

    this.oscTypes = ["sine", "triangle", "sawtooth", "square"];

    //polyphony
    this.noteIndexInUse = Array(polyphony).fill(null); //noteIndex
    this.available = Array(polyphony).fill(true);
    this.inUse = Array(polyphony).fill(false);

    this.groupADSRGains = Array(polyphony);
    this.groupOscillators = Array(polyphony);
    this.gains = Array(polyphony);

    this.groupGains = Array(oscillatorsPerNote);

    for (let o = 0; o < oscillatorsPerNote; o++) {
      const gain = Node.context.createGain();
      gain.connect(this.outputNode);
      this.groupGains[o] = gain;
    }

    this.inputNode.connect(this.outputNode);

    this.initOscillatorGroupProps(saveObject?.oscillatorGroupProps);
    this.initSurgeonParams(saveObject?.minValues, saveObject?.maxValues);
  }

  initOscillatorGroupProps(saveObjectOscillatorGroupProps) {
    //A D S R detune gain
    this.oscillatorGroupProps = saveObjectOscillatorGroupProps ||
      [
        {
          A: 2.6, D: 0.5, S: 1000, R: 0.3, detune: 0, gain: 0.5,
          type: 'sawtooth', octave: 0, transpose: 0,
          destinations: [['B', 1], ['C', 2], ['Out', 'OUTPUT']],
          destination: 2,
          peak: modulatorPeak, muted: false,
          name: 'A'
        },
        {
          A: 1.9, D: 0, S: 1, R: 0.1, detune: 0, gain: 0.2,
          type: 'sawtooth', octave: 0, transpose: 0,
          destinations: [['A', 0], ['C', 2], ['Out', 'OUTPUT']],
          destination: 'OUTPUT',
          peak: 1, muted: false,
          name: 'B'
        },
        {
          A: 0, D: 0.1, S: 1, R: 0.1, detune: 0, gain: 0.8,
          type: 'sine', octave: 0, transpose: 0,
          destinations: [['A', 0], ['B', 1], ['Out', 'OUTPUT']],
          destination: 'OUTPUT',
          peak: 1, muted: false,
          name: 'C'
        },
      ];
  }

  initSurgeonParams(saveObjectMinValues, saveObjectMaxValues) {
    //A D S R detune gain
    this.minValues = saveObjectMinValues || [0, 0, 0, 0, -100, 0];
    this.maxValues = saveObjectMaxValues ||
      [
        [5, 5, modulatorPeak, 5, 100, 1],
        [5, 5, 1, 5, 100, 1],
        [5, 5, 1, 5, 100, 1],
      ];

    // A D S R
    const setOscillatorGroupProperty = (o, prop, value) => {
      this.oscillatorGroupProps[o][prop] = value;
    };

    this.surgeonParams = [
      {
        name: "A",
        displayName: "attack",
        unit: 's',
        set(i, v) { setOscillatorGroupProperty(i, "A", v); }
      },
      {
        name: "D",
        displayName: "decay",
        unit: 's',
        set(i, v) { setOscillatorGroupProperty(i, "D", v); }
      },
      {
        name: "S",
        displayName: "sustain",
        unit: '',
        set(i, v) { setOscillatorGroupProperty(i, "S", v); }
      },
      {
        name: "R",
        displayName: "release",
        unit: 's',
        set(i, v) { setOscillatorGroupProperty(i, "R", v); }
      },
      {
        name: "detune",
        displayName: "detune",
        unit: '',
        set: (index, value) => {
          this.oscillatorGroupProps[index].detune = value;
          this.groupOscillators.forEach(groupOscillator => {
            groupOscillator[index].detune.setValueAtTime(value, 0);
          });
        }
      },
      {
        name: "gain",
        displayName: "level",
        unit: '',
        set: (index, value) => {
          this.oscillatorGroupProps[index].gain = value;
          this.gains.forEach(gain => {
            gain[index].gain.value = value;
          });
        }
      },
    ];
  }

  setSurgeonParam(oscIndex, paramIndex, value) {
    this.surgeonParams[paramIndex].set(oscIndex, parseFloat(value));
  }

  playNote(noteFreqIndex) {
    //polyphony
    const index = this.getFirstAvailable();
    if (index === -1) return;
    this.setInUse(index, noteFreqIndex);

    const gains = Array(oscillatorsPerNote.length);
    const ADSRGains = Array(oscillatorsPerNote.length);
    const oscillators = Array(oscillatorsPerNote.length);

    // Create 3 oscillators
    for (let o = 0; o < oscillatorsPerNote; o++) {
      oscillators[o] = Node.context.createOscillator();
    }

    for (let o = 0; o < oscillatorsPerNote; o++) {
      const { A, D, S, detune, gain, octave, transpose, peak, type, destination } = this.oscillatorGroupProps[o];

      let noteIndex = noteFreqIndex + 12 * octave + transpose;
      if (noteIndex < 0) noteIndex = 0;
      else if (noteIndex > noteFrequencies.length - 1) noteIndex = noteFrequencies.length - 1;

      const freq = noteFrequencies[noteIndex];

      const ADSRGain = Node.context.createGain();
      const oscillator = oscillators[o];

      const outputGain = Node.context.createGain();
      outputGain.gain.value = gain;

      oscillator.connect(ADSRGain);
      ADSRGain.connect(outputGain);

      // destination
      if (destination === 'OUTPUT') {
        outputGain.connect(this.groupGains[o]);
      } else {
        outputGain.connect(oscillators[destination].frequency);
      }

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, 0);
      oscillator.detune.value = detune;

      const t0 = Node.context.currentTime;
      const t1 = t0 + A;

      oscillator.start(t0);

      ADSRGain.gain.setValueAtTime(0, t0);
      ADSRGain.gain.linearRampToValueAtTime(peak, t1);
      ADSRGain.gain.linearRampToValueAtTime(S, t1 + D);

      gains[o] = outputGain;
      ADSRGains[o] = ADSRGain;
    }

    //polyphony
    this.gains[index] = gains;
    this.groupADSRGains[index] = ADSRGains;
    this.groupOscillators[index] = oscillators;
  }

  stopNote(i) {
    //polyphony
    const index = this.getInuseIndexByNote(i);
    if (index === -1) return;
    const gains = this.gains[index];
    const ADSRGains = this.groupADSRGains[index];
    const oscillators = this.groupOscillators[index];

    const t = Node.context.currentTime;

    for (let o = 0; o < oscillatorsPerNote; o++) {
      const { R } = this.oscillatorGroupProps[o];
      const ADSRGain = ADSRGains[o];

      ADSRGain.gain.cancelScheduledValues(t);
      ADSRGain.gain.setValueAtTime(ADSRGain.gain.value, t);
      ADSRGain.gain.linearRampToValueAtTime(0, t + R);

      oscillators[o].stop(t + R);

      setTimeout(() => {
        oscillators[o].disconnect();
        ADSRGain.disconnect();
        gains[o].disconnect();
      }, R * 1000);
    }

    this.setNotInUse(index);
  }

  toggleOscillatorGroupMute(index) {
    //arreglar en caso de modulator
    this.oscillatorGroupProps[index].muted = !this.oscillatorGroupProps[index].muted;
    if (this.oscillatorGroupProps[index].muted)
      this.groupGains[index].gain.value = 0;
    else
      this.groupGains[index].gain.value = 1;
  }

  setMute(index, value) {
    //arreglar en caso de modulator
    this.oscillatorGroupProps[index].muted = value;
    if (this.oscillatorGroupProps[index].muted)
      this.groupGains[index].gain.value = 0;
    else
      this.groupGains[index].gain.value = 1;
  }

  setType(index, value) {
    this.oscillatorGroupProps[index].type = value;
    this.groupOscillators.forEach(groupOscillator => {
      groupOscillator[index].type = value;
    });
  }

  setOscillatorTarget(originIndex, destination) {
    const oscillatorGroup = this.oscillatorGroupProps[originIndex];
    const maxValues = this.maxValues[originIndex];

    oscillatorGroup.destination = destination;

    if (destination === 'OUTPUT') {
      oscillatorGroup.peak = 1;
      oscillatorGroup.S = 1;
      maxValues[2] = 1; // Sustain
      return carrierConstraints;
    } else {
      oscillatorGroup.peak = modulatorPeak;
      oscillatorGroup.S = 100;
      maxValues[2] = modulatorPeak; // Sustain
      return modulatorConstraints;
    }
  }

  addToOctaveTranspose(index, param, value) {
    this.oscillatorGroupProps[index][param] += value;
  }

  // setOctaveTranspose(index, param, value) {
  //   this.oscillatorGroupProps[index][param] = value;
  // }

  saveString() {
    const instrumentData = {
      name: this.name,
      oscillatorGroupProps: this.oscillatorGroupProps,
      minValues: this.minValues,
      maxValues: this.maxValues
    };
    this.saveParams.forEach(param => instrumentData[param.name] = param.value);
    return JSON.stringify(instrumentData);
  }

  destroy() {
    //chequear
    super.destroy();
    this.inUse = null;
    this.available = null;
    this.noteIndexInUse = null;

    this.surgeonParams = null;
    this.oscillatorGroupProps = null;

    for (let o = 0; o < oscillatorsPerNote; o++) {
      this.groupGains[o].disconnect();
      this.groupGains[o] = null;

      for (let i = 0; i < polyphony; i++) {
        if (this.gains[i]) {
          if (this.gains[i][o]) {
            this.gains[i][o].disconnect();
            this.gains[i][o] = null;
            this.groupADSRGains[i][o].disconnect();
            this.groupADSRGains[i][o] = null;
            this.groupOscillators[i][o].disconnect();
            this.groupOscillators[i][o] = null;
          }
        }
      }
    }

    this.gains = null;
    this.groupADSRGains = null;
    this.groupOscillators = null;
  }

  //Polyphony helper functions

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

module.exports = Surgeon;