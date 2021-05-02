const Node = require("../Node")
const SurgeonOsc = require("../Oscillator/SurgeonOsc")
const noteKeys = require("../../data/noteKeys")
const notes = require("../../data/notes")

const noteFreqIndex = 1

const initialGain = 0.7
const A = 0
const D = 0
const S = 1
const R = 0.1

carrierConstraints = { minValue: 0, maxValue: 1, value: 1 }
modulatorConstraints = { minValue: 0, maxValue: 3000, value: 100 }


class Surgeon extends Node {
  static SurgeonCount = 0

  constructor() {
    super(initialGain)

    this.name = "Surgeon " + ++Surgeon.SurgeonCount
    this.nodeType = "Surgeon"
    this.nodeRol = "Instrument"

    this.oscTypes = ["sine", "triangle", "sawtooth", "square"]

    this.scaleNodes = []

    //A;D;S;R;detine;gain tiene que estar en este orden
    this.oscillatorGroups = [
      {
        A: 0.1, D: 0.5, S: 1, R: 0.3, detune: 0, gain: 0.6,
        peak: 1, type: 'triangle', destination: 'OUTPUT', muted: false,
        destinations: [['B', 1], ['C', 2], ['Out', 'OUTPUT']],
        name: 'A'
      },
      {
        A: 1.9, D, S: 1, R, detune: 0, gain: 0.3,
        peak: 1, type: 'sawtooth', destination: 'OUTPUT', muted: false,
        destinations: [['A', 0], ['C', 2], ['Out', 'OUTPUT']],
        name: 'B'
      },
      {
        A: 0, D: 0.1, S: 0, R: 0.1, detune: 0, gain: 0.8,
        peak: 1, type: 'sine', destination: 'OUTPUT', muted: false,
        destinations: [['A', 0], ['B', 1], ['Out', 'OUTPUT']],
        name: 'C'
      },
    ]

    this.oscillatorsPerNote = this.oscillatorGroups.length

    this.groupADSRGains = Array(noteKeys.length)
    this.groupOscillators = Array(noteKeys.length)

    this.groupGains = Array(this.oscillatorsPerNote.length)
    this.groupOctaveTranspose = Array(this.oscillatorsPerNote.length)

    for (let i = 0; i < this.oscillatorsPerNote; i++) {
      const gain = Node.context.createGain()
      gain.connect(this.outputNode)

      this.groupGains[i] = gain
      this.groupADSRGains[i] = Node.context.createGain()
      this.groupOctaveTranspose[i] = [3, 0]
    }

    this.inputNode.connect(this.outputNode)

    this.initSurgeonParams()
    // this.initOscillators()
  }

  destroy() {
    super.destroy()
    for (let i = 0; i < this.oscillatorsPerNote; i++) {
    }
  }

  setOscillatorTarget(origin, destination) {
    const oscillatorGroup = this.oscillatorGroups[origin]

    oscillatorGroup.destination = destination

    if (destination === 'OUTPUT') {
      oscillatorGroup.peak = 1
      oscillatorGroup.S = 1
      return carrierConstraints
    } else {
      oscillatorGroup.peak = 1000
      oscillatorGroup.S = 1000
      return modulatorConstraints
    }
  }

  playNote(i) {
    let ADSRGains = Array(this.oscillatorsPerNote)
    let oscillators = Array(this.oscillatorsPerNote)

    for (let o = 0; o < this.oscillatorsPerNote; o++) {
      oscillators[o] = Node.context.createOscillator()
    }

    for (let o = 0; o < this.oscillatorsPerNote; o++) {

      let noteIndex = i + 12 * this.groupOctaveTranspose[o][0] + this.groupOctaveTranspose[o][1]
      if (noteIndex < 0) noteIndex = 0
      else if (noteIndex > notes.length - 1) noteIndex = notes.length - 1

      let freq = notes[noteIndex][noteFreqIndex]
      let { A, D, S, detune, peak, type, destination } = this.oscillatorGroups[o]

      let ADSRGain = Node.context.createGain()
      let oscillator = oscillators[o]


      let val = 0
      oscillator.connect(ADSRGain)
      if (destination !== 'OUTPUT') {
        val = 100
        ADSRGain.connect(oscillators[destination].frequency) //detination!
        ADSRGain.gain.value = 1000
      } else {

        ADSRGain.connect(this.groupGains[o]) //detination!
      }

      oscillator.type = type
      oscillator.frequency.setValueAtTime(freq, 0)
      oscillator.detune.value = detune

      const t0 = Node.context.currentTime
      const t1 = t0 + A

      oscillator.start(t0)

      ADSRGain.gain.setValueAtTime(val, t0)
      ADSRGain.gain.linearRampToValueAtTime(peak, t1)
      ADSRGain.gain.linearRampToValueAtTime(S, t1 + D)

      // oscillators[o] = oscillator
      ADSRGains[o] = ADSRGain
    }

    this.groupADSRGains[i] = ADSRGains
    this.groupOscillators[i] = oscillators
  }

  stopNote(i) {
    const ADSRGains = this.groupADSRGains[i]
    const oscillators = this.groupOscillators[i]

    const t = Node.context.currentTime

    for (let o = 0; o < this.oscillatorsPerNote; o++) {
      const { R } = this.oscillatorGroups[o]
      const ADSRGain = ADSRGains[o]

      ADSRGain.gain.cancelScheduledValues(t);
      ADSRGain.gain.setValueAtTime(ADSRGain.gain.value, t);
      ADSRGain.gain.linearRampToValueAtTime(0, t + R)

      oscillators[o].stop(t + R)
      //set timeout R to kill ADSRGain and connections?
    }
  }

  onOtherKeyup(key) {
    //   if (key === "z" && this.octave > 1) this.octave--;
    //   if (key === "x") this.octave = this.octave < 8 ? this.octave + 1 : this.octave;
    //   if (key === "c") this.transpose = this.transpose <= -12 ? -12 : this.transpose - 1;
    //   if (key === "v") this.transpose = this.transpose < 12 ? this.transpose + 1 : this.transpose;
  }

  toggleMute(index) {
    this.oscillatorGroups[index].muted = !this.oscillatorGroups[index].muted
    if (this.oscillatorGroups[index].muted)
      this.groupGains[index].gain.value = 0
    else
      this.groupGains[index].gain.value = 1
  }

  setType(index, value) {
    //agregar modificar en tiempo real
    this.oscillatorGroups[index].type = value
  }

  setSurgeonParam(oscIndex, paramIndex, value) {
    const customParam = this.duetteParams[paramIndex];
    customParam.set(oscIndex, parseFloat(value))
  }

  initSurgeonParams() {
    const setScaleNodeProperty = (index, prop, value) => {
      this.oscillatorGroups[index][prop] = value
    }

    const setDetune = (index, value) => {
      //agregar modificar en tiempo real
      this.oscillatorGroups[index].detune = value
    }

    const setGain = (index, value) => {
      this.oscillatorGroups[index].gain = value
      this.groupGains[index].gain.value = value
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