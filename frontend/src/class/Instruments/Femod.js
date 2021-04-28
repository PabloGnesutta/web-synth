const Node = require("../Node")
const ADSROscWithMod = require("../Oscillator/ADSROscWithMod")
const noteKeys = require("../../data/noteKeys")
const notes = require("../../data/notes")

const noteFreqIndex = 1

const initialGain = 0.5
const A = 0
const D = 0
const S = 1
const R = 0.1

class Femod extends Node {
  static femodCount = 0

  constructor() {
    super(initialGain)

    this.name = "Femod " + ++Femod.femodCount
    this.nodeType = "Femod"
    this.nodeRol = "Instrument"

    this.types = ["sine", "triangle", "sawtooth", "square"]
    this.type = "sawtooth"

    this.octave = 3
    this.transpose = 0

    this.scaleNodes = []

    this.inputNode.connect(this.outputNode)

    this.initModulationParams()
    this.initCustomParams()
    this.initOscillators()
  }

  destroy() {
    super.destroy(true)
    this.scaleNodes.forEach(sn => {
      sn.ADSRGain.disconnect()
      sn.ADSRGain = null
      sn.modLevel.disconnect()
      sn.mod.disconnect()
      sn.modLevel = null
      sn.mod = null
      sn.destroy()
      sn = null;
    })
    this.scaleNodes = []
  }

  initOscillators() {
    for (let i = 0; i < noteKeys.length; i++) {
      const osc = new ADSROscWithMod(this.type);
      osc.A = A
      osc.D = D
      osc.S = S
      osc.R = R
      osc.connectNativeNode(this.outputNode);
      this.scaleNodes.push(osc);
    }
  }

  setType(value) {
    this.type = value
    this.scaleNodes.forEach(sn => {
      sn.type = value
      sn.node.type = value
    })
  }

  playNote(i) {
    let noteIndex = i + 12 * this.octave + this.transpose
    if (noteIndex < 0) noteIndex = 0
    if (noteIndex > notes.length - 1) noteIndex = notes.length - 1

    this.scaleNodes[i].startWithFrequency(notes[noteIndex][noteFreqIndex]); //.waveLength probar
  }

  stopNote(i) {
    this.scaleNodes[i].stop();
  }

  onOtherKeyup(key) {
    if (key === "z" && this.octave > 1) this.octave--;
    if (key === "x") this.octave = this.octave < 8 ? this.octave + 1 : this.octave;
    if (key === "c") this.transpose = this.transpose <= -12 ? -12 : this.transpose - 1;
    if (key === "v") this.transpose = this.transpose < 12 ? this.transpose + 1 : this.transpose;
  }

  initCustomParams() {
    const setScaleNodeProperty = (prop, value) => {
      this.scaleNodes.forEach(sn => {
        sn[prop] = value
      })
    }

    const setDetune = (value) => {
      this.scaleNodes.forEach(sn => {
        sn.detuneValue = value
        sn.node.detune.setValueAtTime(value, 0)
        sn.mod.detune.setValueAtTime(value, 0)
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
        set(v) { setScaleNodeProperty("A", v) }
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
        set(v) { setScaleNodeProperty("D", v) }
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
        set(v) { setScaleNodeProperty("S", v) }
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
        set(v) { setScaleNodeProperty("R", v) }
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
        set(v) { setDetune(v) }
      },
    ]
  }

  setCustomParam(index, value) {
    const customParam = this.customParams[index];
    customParam.value = value
    customParam.set(parseFloat(value))
  }

  initModulationParams() {
    const setModLevel = (value) => {
      this.scaleNodes.forEach(sn => {
        sn.modLevelValue = value
        sn.modLevel.gain.setValueAtTime(value, 0)
      })
    }
    const setModType = (value) => {
      this.scaleNodes.forEach(sn => {
        sn.modType = value
        sn.mod.type = value
      })
    }
    this.modulationParams = [
      {
        name: "type",
        displayName: "mod type",
        value: "triangle",
        types: ['sine', 'triangle', 'sawtooth', 'square'],
        set(v) { setModType(v) }
      },
      {
        name: "modLevel",
        displayName: "mod amt",
        unit: '',
        minValue: 0,
        maxValue: 3000,
        value: 100,
        defaultValue: 100,
        step: 0.1,
        set(v) { setModLevel(v) }
      },
    ]
  }

  setModulationParam(index, value) {
    const modulationParams = this.modulationParams[index];
    modulationParams.value = value
    modulationParams.set(value)
  }
}

module.exports = Femod