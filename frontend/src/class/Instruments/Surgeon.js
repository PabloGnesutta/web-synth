const Node = require("../Node")
// const noteKeys = require("../../data/noteKeys")
const notes = require("../../data/notes")

const polyphony = 15;
let noteIndexInUse = Array(polyphony).fill(null) //noteIndex
let available = Array(polyphony).fill(true)
let inUse = Array(polyphony).fill(false)

const noteFreqIndex = 1

const initialGain = 0.7
const A = 0
const D = 0
const S = 1
const R = 0.1

modulatorPeak = 3000
carrierConstraints = { minValue: 0, maxValue: 1, value: 1 }
modulatorConstraints = { minValue: 0, maxValue: modulatorPeak, value: 100 }

class Surgeon extends Node {
  static SurgeonCount = 0

  constructor() {
    super(initialGain)

    this.name = "Surgeon " + ++Surgeon.SurgeonCount
    this.nodeType = "Surgeon"
    this.nodeRol = "Instrument"

    this.oscTypes = ["sine", "triangle", "sawtooth", "square"]

    //related to polyphony
    this.groupADSRGains = Array(polyphony)
    this.groupOscillators = Array(polyphony)
    this.gains = Array(polyphony)

    this.initOscillatorGroupProps()

    this.groupGains = Array(this.oscillatorsPerNote)
    this.groupOctaveTranspose = [
      [0, 0],
      [0, 0],
      [0, 0],
    ]

    for (let o = 0; o < this.oscillatorsPerNote; o++) {
      const gain = Node.context.createGain()
      gain.connect(this.outputNode)
      this.groupGains[o] = gain
    }

    this.inputNode.connect(this.outputNode)
    this.initSurgeonParams()
  }

  //chequear
  destroy() {
    super.destroy()
    for (let i = 0; i < this.oscillatorsPerNote; i++) {
    }
  }

  setOscillatorTarget(origin, destination) {
    const oscillatorGroup = this.oscillatorGroupProps[origin]

    oscillatorGroup.destination = destination

    if (destination === 'OUTPUT') {
      oscillatorGroup.peak = 1
      oscillatorGroup.S = 1
      return carrierConstraints
    } else {
      oscillatorGroup.peak = modulatorPeak
      oscillatorGroup.S = 100
      return modulatorConstraints
    }
  }


  playNote(i) {
    //test polyphony
    const index = this.getFirstAvailable()
    if (index === -1) return
    this.setInUse(index, i)
    //--------------

    let gains = Array(this.oscillatorsPerNote.length)
    let ADSRGains = Array(this.oscillatorsPerNote.length)
    let oscillators = Array(this.oscillatorsPerNote.length)

    for (let o = 0; o < this.oscillatorsPerNote; o++) {
      oscillators[o] = Node.context.createOscillator()
    }

    for (let o = 0; o < this.oscillatorsPerNote; o++) {

      let noteIndex = i + 12 * this.groupOctaveTranspose[o][0] + this.groupOctaveTranspose[o][1]
      if (noteIndex < 0) noteIndex = 0
      else if (noteIndex > notes.length - 1) noteIndex = notes.length - 1

      let freq = notes[noteIndex][noteFreqIndex]
      let { A, D, S, detune, peak, type, destination } = this.oscillatorGroupProps[o]

      let ADSRGain = Node.context.createGain()
      let oscillator = oscillators[o]

      //test
      let gain = Node.context.createGain()
      ADSRGain.connect(gain)
      //----

      oscillator.connect(ADSRGain)

      // destination
      if (destination !== 'OUTPUT') {
        // ADSRGain.connect(oscillators[destination].frequency)
        gain.connect(oscillators[destination].frequency)
      } else {
        gain.connect(this.groupGains[o])
      }

      oscillator.type = type
      oscillator.frequency.setValueAtTime(freq, 0)
      oscillator.detune.value = detune

      const t0 = Node.context.currentTime
      const t1 = t0 + A

      oscillator.start(t0)

      ADSRGain.gain.setValueAtTime(0, t0)
      ADSRGain.gain.linearRampToValueAtTime(peak, t1)
      ADSRGain.gain.linearRampToValueAtTime(S, t1 + D)

      gains[o] = gain
      ADSRGains[o] = ADSRGain
    }

    //test polyphony
    this.gains[index] = gains
    this.groupADSRGains[index] = ADSRGains
    this.groupOscillators[index] = oscillators
    //--------------

    // this.gains[i] = gains
    // this.groupADSRGains[i] = ADSRGains
    // this.groupOscillators[i] = oscillators
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
    // noteIndexInUse[index] = null //optional?
  }

  getInuseIndexByNote(i) {
    return noteIndexInUse.findIndex(ni => ni === i)
  }

  stopNote(i) {
    //test polyphony
    const index = this.getInuseIndexByNote(i)
    if (index === -1) return
    const ADSRGains = this.groupADSRGains[index]
    const oscillators = this.groupOscillators[index]
    //---------------

    // const ADSRGains = this.groupADSRGains[i]
    // const oscillators = this.groupOscillators[i]

    const t = Node.context.currentTime

    for (let o = 0; o < this.oscillatorsPerNote; o++) {
      const { R } = this.oscillatorGroupProps[o]
      const ADSRGain = ADSRGains[o]

      ADSRGain.gain.cancelScheduledValues(t);
      ADSRGain.gain.setValueAtTime(ADSRGain.gain.value, t);
      ADSRGain.gain.linearRampToValueAtTime(0, t + R)

      oscillators[o].stop(t + R)
    }

    this.setNotInUse(index)
  }

  toggleMute(index) {
    //falta arreglar en caso de modulator
    this.oscillatorGroupProps[index].muted = !this.oscillatorGroupProps[index].muted
    if (this.oscillatorGroupProps[index].muted)
      this.groupGains[index].gain.value = 0
    else
      this.groupGains[index].gain.value = 1
  }

  setType(index, value) {
    this.oscillatorGroupProps[index].type = value
    this.groupOscillators.forEach(go => {
      go[index].type = value
    })
  }

  setSurgeonParam(oscIndex, paramIndex, value) {
    const customParam = this.duetteParams[paramIndex];
    customParam.set(oscIndex, parseFloat(value))
  }

  initOscillatorGroupProps() {
    //A;D;S;R;detine;gain tiene que estar en este orden
    this.oscillatorGroupProps = [
      {
        A: 2.6, D: 0.5, S: 520, R: 0.3, detune: 0, gain: 0.5,
        peak: modulatorPeak, type: 'sawtooth', destination: 2, muted: false,
        destinations: [['B', 1], ['C', 2], ['Out', 'OUTPUT']],
        name: 'A', mode: 'MODULATOR'
      },
      {
        A: 1.9, D, S: 1, R, detune: 0, gain: 0.2,
        peak: 1, type: 'sawtooth', destination: 'OUTPUT', muted: false,
        destinations: [['A', 0], ['C', 2], ['Out', 'OUTPUT']],
        name: 'B', mode: 'CARRIER'
      },
      {
        A: 0, D: 0.1, S: 1, R: 0.1, detune: 0, gain: 0.8,
        peak: 1, type: 'sine', destination: 'OUTPUT', muted: false,
        destinations: [['A', 0], ['B', 1], ['Out', 'OUTPUT']],
        name: 'C', mode: 'CARRIER'
      },
    ]
    this.oscillatorsPerNote = this.oscillatorGroupProps.length
  }

  initSurgeonParams() {
    const setScaleNodeProperty = (index, prop, value) => {
      this.oscillatorGroupProps[index][prop] = value
    }

    const setDetune = (index, value) => {
      this.oscillatorGroupProps[index].detune = value
      this.groupOscillators.forEach(go => {
        go[index].detune.setValueAtTime(value, 0)
      })
    }
    const setGain = (index, value) => {
      this.oscillatorGroupProps[index].gain = value
      this.gains.forEach(g => {
        g[index].gain.value = value
      })
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

module.exports = Surgeon