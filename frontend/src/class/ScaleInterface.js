const Node = require("./Node")
const ADSROscillator = require("./Oscillator/ADSROscillator")
const notes = require("../data/notes")
const noteKeys = require("../data/noteKeys")

const initialGain = 0.5
const initialA = 0
const initialD = 0
const initialS = 1
const initialR = 0.1
const initialDetune = 0;

class ScaleInterface extends Node {
  static SICOunt = 0

  constructor(tpye, name) {
    super(name)
    this.name = name || "Justinton " + ++ScaleInterface.SICOunt
    this.nodeType = "ScaleInterface"
    this.types = ["sine", "triangle", "sawtooth", "square"]
    this.type = tpye || "sawtooth"

    this.octave = 3
    this.transpose = 0

    this.A = initialA
    this.D = initialD
    this.S = initialS
    this.R = initialR

    this.scaleNodes = []

    this.initGain()
    this.initCustomParams()
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
      const osc = new ADSROscillator(this.type, notes[nk.noteIndex].freq);
      osc.A = initialA
      osc.D = initialD
      osc.S = initialS
      osc.R = initialR
      osc.connectNativeNode(this.outputNode);
      this.scaleNodes.push(osc);
    });
  }

  setType(value) {
    this.type = value
    this.scaleNodes.forEach(sn => {
      sn.oscType = value
      sn.node.type = value
    })
  }

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
    if (key === "x") this.octave++;
    if (key === "c") this.transpose--;
    if (key === "v") this.transpose++;
  }

  processKeydown(e) {
    const noteKeyIndex = noteKeys.findIndex((nk) => e.key === nk.key);
    if (noteKeyIndex != -1) this.playNote(noteKeyIndex)
    // else this.onOtherKeydown()
  }

  processKeyup(e) {
    const noteKeyIndex = noteKeys.findIndex((nk) => e.key === nk.key);
    if (noteKeyIndex != -1) this.stopNote(noteKeyIndex)
    else this.onOtherKeyup(e.key)
  }

  initCustomParams() {
    //set destination node audio param
    const setDetune = (value) => {
      this.scaleNodes.forEach(sn => {
        sn.node.detune.setValueAtTime(value, 0)
        sn.detuneValue = value
      })
    }

    //set destination simple value
    const setADSR = (param, value) => {
      this.scaleNodes.forEach(sn => {
        sn[param] = value
      })
    }

    this.customParams = [

      {
        name: "attack",
        displayName: "attack",
        unit: 's',
        minValue: 0,
        maxValue: 1,
        value: initialA,
        defaultValue: initialA,
        step: 0.01,
        set(v) { setADSR("A", v) }
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
        set(v) { setADSR("D", v) }
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
        set(v) { setADSR("S", v) }
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
        set(v) { setADSR("R", v) }
      },
      {
        name: "detune",
        displayName: "fine",
        unit: 'hz',
        minValue: -100,
        maxValue: 100,
        value: initialDetune,
        defaultValue: initialDetune,
        step: 0.1,
        set(v) { setDetune(v) }
      },
    ]

  }
}

module.exports = ScaleInterface