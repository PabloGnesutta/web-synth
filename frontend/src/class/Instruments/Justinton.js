const Node = require("../Node")
const ADSROsc = require("../Oscillator/ADSROsc")
const noteKeys = require("../../data/noteKeys")
const notes = require("../../data/notes")

const noteFreqIndex = 1

const initialGain = 0.5
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

    this.inputNode.connect(this.outputNode)

    this.oscillatorArray = [
      { A, D, S, R, gain: 1, type: 'triangle' },
      { A, D, S, R, gain: 1, type: 'sawtooth' }
    ]

    this.initCustomParams()
    this.initOscillators()
  }

  initOscillators() {
    for (let i = 0; i < noteKeys.length; i++) {
      let oscillators = []
      this.oscillatorArray.forEach(o => {
        const osc = new ADSROsc(o.type);
        osc.A = A
        osc.D = D
        osc.S = S
        osc.R = R
        osc.connectNativeNode(this.outputNode);
        oscillators.push(osc)
      })
      this.scaleNodes.push(oscillators);
    }
  }

  playNote(i) {
    let noteIndex = i + 12 * this.octave + this.transpose
    if (noteIndex < 0) noteIndex = 0
    if (noteIndex > notes.length - 1) noteIndex = notes.length - 1

    for (let o = 0; o < this.oscillatorArray.length; o++) {
      this.scaleNodes[i][o].startWithFrequency(notes[noteIndex][noteFreqIndex]); //.waveLength probar
    }
  }

  stopNote(i) {
    for (let o = 0; o < this.oscillatorArray.length; o++) {
      this.scaleNodes[i][o].stop();
    }
  }

  onOtherKeyup(key) {
    if (key === "z" && this.octave > 1) this.octave--;
    if (key === "x") this.octave = this.octave < 8 ? this.octave + 1 : this.octave;
    if (key === "c") this.transpose = this.transpose <= -12 ? -12 : this.transpose - 1;
    if (key === "v") this.transpose = this.transpose < 12 ? this.transpose + 1 : this.transpose;
  }

  setType(index, value) {
    this.scaleNodes.forEach(sn => {
      sn[index].type = value
      sn[index].node.type = value
    })
  }

  setCustomParam(oscIndex, cpIndex, value) {
    const customParam = this.customParams[cpIndex];
    customParam.value = value
    customParam.set(oscIndex, parseFloat(value))
  }

  initCustomParams() {
    const setScaleNodeProperty = (index, prop, value) => {
      this.scaleNodes.forEach(sn => {
        sn[index][prop] = value
      })
    }

    const setDetune = (index, value) => {
      this.scaleNodes.forEach(sn => {
        sn[index].detuneValue = value
        sn[index].node.detune.setValueAtTime(value, 0)
      })
    }

    const setGain = (index, value) => {
      this.scaleNodes.forEach(sn => {
        sn[index].outputNode.gain.value = value
      })
    }

    this.customParams = [
      {
        name: "attack",
        displayName: "attack",
        unit: 's',
        minValue: 0,
        maxValue: 5,
        value: A,
        defaultValue: A,
        step: 0.01,
        set(i, v) { setScaleNodeProperty(i, "A", v) }
      },
      {
        name: "decay",
        displayName: "decay",
        unit: 's',
        minValue: 0.01,
        maxValue: 3,
        value: D,
        defaultValue: D,
        step: 0.01,
        set(i, v) { setScaleNodeProperty(i, "D", v) }
      },
      {
        name: "sustain",
        displayName: "sustain",
        unit: '',
        minValue: 0,
        maxValue: 1,
        value: S,
        defaultValue: S,
        step: 0.01,
        set(i, v) { setScaleNodeProperty(i, "S", v) }
      },
      {
        name: "release",
        displayName: "release",
        unit: 's',
        minValue: 0.001,
        maxValue: 5,
        value: R,
        defaultValue: R,
        step: 0.001,
        set(i, v) { setScaleNodeProperty(i, "R", v) }
      },
      {
        name: "detune",
        displayName: "fine",
        unit: '%',
        minValue: -100,
        maxValue: 100,
        value: 0,
        defaultValue: 0,
        step: 0.1,
        set(i, v) { setDetune(i, v) }
      },
      {
        name: "gain",
        displayName: "gain",
        unit: '',
        minValue: 0,
        maxValue: 1,
        value: 0.7,
        defaultValue: 0.7,
        set(i, v) { setGain(i, v) }
      },
    ]
  }

  destroy() {
    super.destroy(true)
    this.scaleNodes.forEach(sn => {
      sn.ADSRGain.disconnect()
      sn.ADSRGain = null
      sn.destroy()
      sn = null;
    })
    this.scaleNodes = []
  }
}

module.exports = Duette