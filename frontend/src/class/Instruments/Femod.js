const Node = require("../Node")
const ADSROscWithMod = require("../Oscillator/ADSROscWithMod")
const notes = require("../../data/notes")
const noteKeys = require("../../data/noteKeys")

const initialGain = 0.5
const initialA = 0
const initialD = 0
const initialS = 1
const initialR = 0.1
const initialDetune = 0;

class Femod extends Node {
  static femodCount = 0

  constructor(tpye, name) {
    super(name)

    this.name = name || "Femod " + ++Femod.femodCount
    this.nodeType = "Femod"
    this.nodeRol = "Instrument"

    this.types = ["sine", "triangle", "sawtooth", "square"]
    this.type = tpye || "sine"

    this.octave = 3
    this.transpose = 0

    this.A = initialA
    this.D = initialD
    this.S = initialS
    this.R = initialR

    this.scaleNodes = []

    this.initGain()
    this.initCustomParams()
    this.initModulationParams()
    this.initOscillators()
  }

  destroy() {
    super.destroy(true)
    this.scaleNodes.forEach(sn => {
      sn.destroy()
      sn.ADSRGain.disconnect()
      sn.ADSRGain = null
      sn.level.disconnect()
      sn.level = null
      sn = null;
    })
    this.scaleNodes = []
  }

  initGain() {
    this.gain = initialGain
    this.level = Node.context.createGain()
    this.level.gain.setValueAtTime(this.gain, 0)
    this.outputNode = this.level
  }

  initOscillators() {
    noteKeys.forEach((nk) => {
      const osc = new ADSROscWithMod(this.type, notes[nk.noteIndex].freq);
      osc.A = initialA
      osc.D = initialD
      osc.S = initialS
      osc.R = initialR
      osc.connectNativeNode(this.outputNode);
      this.scaleNodes.push(osc);
    });
  }

  initModulators() {
    this.scaleNodes.forEach(sn => {
      sn.oscType = value
      sn.node.type = value
    })
  }

  setType(value) {
    this.type = value
    this.scaleNodes.forEach(sn => {
      sn.oscType = value
      sn.node.type = value
    })
  }

  // setModType(value) {
  //   this.type = value
  //   this.scaleNodes.forEach(sn => {
  //     sn.oscType = value
  //     sn.node.type = value
  //   })
  // }

  playNote(i) {
    let noteIndex = i + 12 * this.octave + this.transpose
    if (noteIndex < 0) noteIndex = 0
    if (noteIndex > notes.length - 1) noteIndex = notes.length - 1

    this.scaleNodes[i].startWithFrequency(notes[noteIndex].freq); //.waveLength probar
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
        value: initialA,
        defaultValue: initialA,
        step: 0.01,
        set(v) { setScaleNodeProperty("A", v) }
      },
      {
        name: "decay",
        displayName: "decay",
        unit: 's',
        minValue: 0.01,
        maxValue: 1,
        value: initialD,
        defaultValue: initialD,
        step: 0.01,
        set(v) { setScaleNodeProperty("D", v) }
      },
      {
        name: "sustain",
        displayName: "sustain",
        unit: '',
        minValue: 0,
        maxValue: 1,
        value: initialS,
        defaultValue: initialS,
        step: 0.01,
        set(v) { setScaleNodeProperty("S", v) }
      },
      {
        name: "release",
        displayName: "release",
        unit: 's',
        minValue: 0.001,
        maxValue: 3,
        value: initialR,
        defaultValue: initialR,
        step: 0.001,
        set(v) { setScaleNodeProperty("R", v) }
      },
      {
        name: "detune",
        displayName: "fine",
        unit: '%',
        minValue: -100,
        maxValue: 100,
        value: initialDetune,
        defaultValue: initialDetune,
        step: 0.1,
        set(v) { setDetune(v) }
      },
    ]
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
      {
        name: "type",
        displayName: "mod type",
        type: "triangle",
        types: ['sine', 'triangle', 'sawtooth', 'square'],
        set(v) { setModType(v) }
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