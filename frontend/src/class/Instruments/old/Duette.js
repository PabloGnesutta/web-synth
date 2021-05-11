const Node = require("../Node")
const ADSROsc = require("../Oscillator/ADSROsc")
const noteKeys = require("../../data/noteKeys")
const notes = require("../../data/notes")

const noteFreqIndex = 1

const initialGain = 0.7
const A = 0
const D = 0
const S = 1
const R = 0.1


class Duette extends Node {
  static DuetteCount = 0

  constructor() {
    super(initialGain)

    this.name = "Duette " + ++Duette.DuetteCount
    this.nodeType = "Duette"
    this.nodeRol = "Instrument"

    this.oscTypes = ["sine", "triangle", "sawtooth", "square"]

    this.octave = 3
    this.transpose = 0


    this.scaleNodes = []
    this.oscillatorGroupGains = []

    this.oscillatorsGroups = [
      { A: 0.1, D: 0.5, S: 0.8, R: 0.3, detune: 0, gain: 0.6, type: 'triangle', muted: false },
      { A: 1.9, D, S, R, detune: 10, gain: 0.3, type: 'sawtooth', muted: false },
      { A: 0, D: 0.1, S: 0, R: 0.1, detune: -10, gain: 0.8, type: 'sine', muted: false },
    ]

    this.oscillatorsPerNote = this.oscillatorsGroups.length

    for (let i = 0; i < this.oscillatorsPerNote; i++) {
      const gain = Node.context.createGain()
      gain.connect(this.outputNode)
      this.oscillatorGroupGains.push(gain)
    }

    this.inputNode.connect(this.outputNode)
    this.lastConnected = 0

    this.initDuetteParams()
    this.initOscillators()

  }

  destroy() {
    super.destroy()
    this.scaleNodes.forEach(sn => {
      for (let i = 0; i < this.oscillatorsPerNote; i++) {
        sn[i].ADSRGain.disconnect()
        sn[i].ADSRGain = null
        sn[i].destroy()
        sn[i] = null;
      }
    })
    this.scaleNodes = []
  }

  initOscillators() {
    for (let i = 0; i < noteKeys.length; i++) {
      let oscillators = []
      this.oscillatorsGroups.forEach((o, l) => {
        const osc = new ADSROsc(o.type);
        osc.outputNode.connect(this.oscillatorGroupGains[l]);
        oscillators.push(osc)
      })
      this.scaleNodes.push(oscillators);
    }
  }

  setOscillatorTarget(origin, destination) {
  }

  playNote(i) {
    let noteIndex = i + 12 * this.octave + this.transpose
    if (noteIndex < 0) noteIndex = 0
    else if (noteIndex > notes.length - 1) noteIndex = notes.length - 1

    let freq = notes[noteIndex]

    for (let o = 0; o < this.oscillatorsPerNote; o++) {
      this.scaleNodes[i][o].startWithFrequency(freq, o); //.waveLength probar
    }
  }

  stopNote(i) {
    for (let o = 0; o < this.oscillatorsPerNote; o++) {
      this.scaleNodes[i][o].stop();
    }
  }

  onOtherKeyup(key) {
    if (key === "z" && this.octave > 1) this.octave--;
    if (key === "x") this.octave = this.octave < 8 ? this.octave + 1 : this.octave;
    if (key === "c") this.transpose = this.transpose <= -12 ? -12 : this.transpose - 1;
    if (key === "v") this.transpose = this.transpose < 12 ? this.transpose + 1 : this.transpose;
  }

  toggleMute(index) {
    this.oscillatorsGroups[index].muted = !this.oscillatorsGroups[index].muted
    if (this.oscillatorsGroups[index].muted)
      this.oscillatorGroupGains[index].gain.value = 0
    else
      this.oscillatorGroupGains[index].gain.value = 1
  }

  setType(index, value) {
    this.scaleNodes.forEach(sn => {
      sn[index].type = value
      sn[index].node.type = value

    })
    this.oscillatorsGroups[index].type = value
  }

  setDuetteParam(oscIndex, paramIndex, value) {
    const customParam = this.duetteParams[paramIndex];
    customParam.set(oscIndex, parseFloat(value))
  }

  initDuetteParams() {
    const setScaleNodeProperty = (index, prop, value) => {
      this.scaleNodes.forEach(sn => {
        sn[index][prop] = value
      })
      this.oscillatorsGroups[index][prop] = value
    }

    const setDetune = (index, value) => {
      this.scaleNodes.forEach(sn => {
        sn[index].detuneValue = value
        sn[index].node.detune.setValueAtTime(value, 0)
      })
      this.oscillatorsGroups[index].detune = value
    }

    const setGain = (index, value) => {
      this.scaleNodes.forEach(sn => {
        sn[index].outputNode.gain.value = value
        sn[index].gain = value
      })
      this.oscillatorsGroups[index].gain = value
    }

    this.duetteParams = [
      {
        name: "A",
        displayName: "attack",
        unit: 's',
        minValue: 0,
        maxValue: 5,
        value: A,
        step: 0.01,
        set(i, v) { setScaleNodeProperty(i, "A", v) }
      },
      {
        name: "D",
        displayName: "decay",
        unit: 's',
        minValue: 0.01,
        maxValue: 3,
        value: D,
        step: 0.01,
        set(i, v) { setScaleNodeProperty(i, "D", v) }
      },
      {
        name: "S",
        displayName: "sustain",
        unit: '',
        minValue: 0,
        maxValue: 1,
        value: S,
        step: 0.01,
        set(i, v) { setScaleNodeProperty(i, "S", v) }
      },
      {
        name: "R",
        displayName: "release",
        unit: 's',
        minValue: 0.001,
        maxValue: 5,
        value: R,
        step: 0.001,
        set(i, v) { setScaleNodeProperty(i, "R", v) }
      },
      {
        name: "detune",
        displayName: "detune",
        unit: '',
        minValue: -100,
        maxValue: 100,
        value: 0,
        step: 0.1,
        set(i, v) { setDetune(i, v) }
      },
      {
        name: "gain",
        displayName: "level",
        unit: '',
        minValue: 0,
        maxValue: 3,
        value: 0.7,
        set(i, v) { setGain(i, v) }
      },
    ]
  }


}

module.exports = Duette