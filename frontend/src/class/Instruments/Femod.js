const Node = require("../Node")
const notes = require("../../data/notes")

//repite en surgeon
const polyphony = 3;
let noteIndexInUse = Array(polyphony).fill(null) //noteIndex
let available = Array(polyphony).fill(true)
let inUse = Array(polyphony).fill(false)

const noteFreqIndex = 1
const peak = 1

const initialGain = 0.5

let A = 2
let D = 1
let S = 0.5
let R = 2

class Femod extends Node {
  static femodCount = 0

  constructor() {
    super(initialGain)

    this.name = "Femod " + ++Femod.femodCount
    this.nodeType = "Femod"
    this.nodeRol = "Instrument"

    this.types = ["sine", "triangle", "sawtooth", "square"]
    this.type = "sawtooth"

    this.modLevelValue = 1000
    this.modType = "sine"


    this.ADSRGains = Array(polyphony)
    this.modulators = Array(polyphony)
    this.oscillators = Array(polyphony)

    this.inputNode.connect(this.outputNode)

    this.initModulationParams()
    this.initCustomParams()
  }

  destroy() {
    super.destroy(true)
  }

  setType(value) {
    this.type = value
    //set real time
  }

  playNote(i) {
    //polyphony
    const index = this.getFirstAvailable()
    if (index === -1) return
    this.setInUse(index, i)

    let detune = this.customParams[4].value

    const freq = notes[i]
    const t0 = Node.context.currentTime
    const t1 = t0 + A

    const ADSRGain = Node.context.createGain()
    ADSRGain.connect(this.outputNode)

    const oscillator = Node.context.createOscillator()
    oscillator.type = this.type
    oscillator.connect(ADSRGain)

    //FM
    const modLevel = Node.context.createGain()
    const mod = Node.context.createOscillator()

    modLevel.connect(oscillator.frequency)
    modLevel.gain.setValueAtTime(this.modLevelValue, t0)

    mod.type = this.modType

    mod.frequency.setValueAtTime(freq, t0) //sync with note freq
    mod.detune.value = detune
    mod.connect(modLevel)

    oscillator.frequency.setValueAtTime(freq, t0)
    oscillator.detune.value = detune
    
    //start note and mod
    mod.start(t0)
    oscillator.start(t0)

    ADSRGain.gain.setValueAtTime(0, t0)
    ADSRGain.gain.linearRampToValueAtTime(peak, t1)
    ADSRGain.gain.linearRampToValueAtTime(S, t1 + D)

    this.modulators[index] = mod
    this.ADSRGains[index] = ADSRGain
    this.oscillators[index] = oscillator
  }

  stopNote(i) {
    const index = this.getInuseIndexByNote(i)
    if (index === -1) return
    const ADSRGain = this.ADSRGains[index]
    const oscillator = this.oscillators[index]
    const modulator = this.modulators[index]

    const t = Node.context.currentTime

    ADSRGain.gain.cancelScheduledValues(t);
    ADSRGain.gain.setValueAtTime(ADSRGain.gain.value, t);
    ADSRGain.gain.linearRampToValueAtTime(0, t + R)

    oscillator.stop(t + R)
    modulator.stop(t + R)

    this.setNotInUse(index)
  }

  getFirstAvailable() {
    let found = false
    let index = -1
    while (!found && index < polyphony) {
      index++
      found = available[index]
    }
    if (!found) index = -1
    else available[index] = false
    return index
  }

  setInUse(inUseIndex, noteIndex) {
    inUse[inUseIndex] = true
    noteIndexInUse[inUseIndex] = noteIndex
  }

  setNotInUse(index) {
    inUse[index] = false
    available[index] = true
  }

  getInuseIndexByNote(i) {
    return noteIndexInUse.findIndex(ni => ni === i)
  }

  initCustomParams() {
    const setScaleNodeProperty = (prop, value) => {
      if (prop === 'A') A = value
      else if (prop === 'D') D = value
      else if (prop === 'S') S = value
      else if (prop === 'R') R = value
    }

    const setDetune = (value) => {
      //tiempo real agregar
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
      this.modLevelValue = value
      //tiempo real agregar
    }
    const setModType = (value) => {
      this.modType = value
      //tiempo real agregar
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