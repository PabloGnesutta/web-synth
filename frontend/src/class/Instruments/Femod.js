const Node = require("../Node")
const notes = require("../../data/notes")

//repite en surgeon
const polyphony = 15;

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
    this.modDetune = 0

    this.noteIndexInUse = Array(polyphony).fill(null)
    this.available = Array(polyphony).fill(true)
    this.inUse = Array(polyphony).fill(false)

    this.ADSRGains = Array(polyphony)
    this.modulators = Array(polyphony)
    this.modulatorGains = Array(polyphony)
    this.oscillators = Array(polyphony)

    this.inputNode.connect(this.outputNode)

    this.initModulationParams()
    this.initCustomParams()
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
    mod.detune.value = this.modDetune
    mod.connect(modLevel)

    oscillator.frequency.setValueAtTime(freq, t0)
    oscillator.detune.value = detune

    //start note and mod
    mod.start(t0)
    oscillator.start(t0)

    ADSRGain.gain.setValueAtTime(0, t0)
    ADSRGain.gain.linearRampToValueAtTime(peak, t1)
    ADSRGain.gain.linearRampToValueAtTime(S, t1 + D)

    this.modulatorGains[index] = modLevel
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

    //anda bien para memory leak pero el release la caga, por eso comenté la modulación
    setTimeout(() => {
      oscillator.disconnect()
      ADSRGain.disconnect()
      // modulator.disconnect()
      // this.modulatorGains[index].disconnect()
    }, R * 1000);

    this.setNotInUse(index)
  }

  setCustomParam(index, value) {
    const customParam = this.customParams[index];
    customParam.value = value
    customParam.set(parseFloat(value))
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
        set(v) { setScaleNodeProperty("A", v) }
      },
      {
        name: "decay",
        displayName: "decay",
        unit: 's',
        minValue: 0.01,
        maxValue: 3,
        value: D,
        set(v) { setScaleNodeProperty("D", v) }
      },
      {
        name: "sustain",
        displayName: "sustain",
        unit: '',
        minValue: 0,
        maxValue: 1,
        value: S,
        set(v) { setScaleNodeProperty("S", v) }
      },
      {
        name: "release",
        displayName: "release",
        unit: 's',
        minValue: 0.001,
        maxValue: 5,
        value: R,
        set(v) { setScaleNodeProperty("R", v) }
      },
      {
        name: "detune",
        displayName: "fine",
        unit: '%',
        minValue: -100,
        maxValue: 100,
        value: 0,
        set(v) { setDetune(v) }
      },
    ]
  }

  setModulationParam(index, value) {
    const modulationParams = this.modulationParams[index];
    modulationParams.value = value
    modulationParams.set(value)
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
    const setModDetune = (value) => {
      this.modDetune = value
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
        set(v) { setModLevel(v) }
      },
      {
        name: "modDetune",
        displayName: "fine",
        unit: '',
        minValue: -100,
        maxValue: 100,
        value: 0,
        set(v) { setModDetune(v) }
      },
    ]
  }

  saveString() {
    return JSON.stringify({
      nodeRol: this.nodeRol,
      nodeType: this.nodeType,
      gain: this.gain,
      customParams: this.customParams,
      modulationParams: this.modulationParams
    })
  }

  destroy() {
    super.destroy()

    this.inUse = null
    this.available = null
    this.noteIndexInUse = null
    this.modulationParams = null

    for (let i = 0; i < polyphony; i++)
      if (this.ADSRGains[i]) {
        this.ADSRGains[i].disconnect()
        this.modulators[i].disconnect()
        this.oscillators[i].disconnect()
      }

    this.ADSRGains = null
    this.modulators = null
    this.oscillators = null
  }

  getFirstAvailable() {
    let found = false
    let index = -1
    while (!found && index < polyphony) {
      index++
      found = this.available[index]
    }
    if (!found) index = -1
    else this.available[index] = false
    return index
  }

  setInUse(inUseIndex, noteIndex) {
    this.inUse[inUseIndex] = true
    this.noteIndexInUse[inUseIndex] = noteIndex
  }

  setNotInUse(index) {
    this.inUse[index] = false
    this.available[index] = true
  }

  getInuseIndexByNote(i) {
    return this.noteIndexInUse.findIndex(ni => ni === i)
  }
}

module.exports = Femod