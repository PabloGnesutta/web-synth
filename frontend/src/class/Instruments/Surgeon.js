const Node = require("../Node")
const notes = require("../../data/notes")

const polyphony = 15;

const initialGain = 0.7
const A = 0
const D = 0
const S = 1
const R = 0.1

modulatorPeak = 2000
carrierConstraints = { minValue: 0, maxValue: 1, value: 1 }
modulatorConstraints = { minValue: 0, maxValue: modulatorPeak, value: modulatorPeak }

class Surgeon extends Node {
  static SurgeonCount = 0

  constructor() {
    super(initialGain)

    this.name = "Surgeon " + ++Surgeon.SurgeonCount
    this.nodeType = "Surgeon"
    this.nodeRol = "Instrument"

    this.oscTypes = ["sine", "triangle", "sawtooth", "square"]

    //polyphony
    this.noteIndexInUse = Array(polyphony).fill(null) //noteIndex
    this.available = Array(polyphony).fill(true)
    this.inUse = Array(polyphony).fill(false)

    this.groupADSRGains = Array(polyphony)
    this.groupOscillators = Array(polyphony)
    this.gains = Array(polyphony)

    this.initOscillatorGroupProps()

    this.groupGains = Array(this.oscillatorsPerNote)

    for (let o = 0; o < this.oscillatorsPerNote; o++) {
      const gain = Node.context.createGain()
      gain.connect(this.outputNode)
      this.groupGains[o] = gain
    }

    this.inputNode.connect(this.outputNode)
    this.initSurgeonParams()
  }

  playNote(i) {
    //polyphony
    const index = this.getFirstAvailable()
    if (index === -1) return
    this.setInUse(index, i)

    const gains = Array(this.oscillatorsPerNote.length)
    const ADSRGains = Array(this.oscillatorsPerNote.length)
    const oscillators = Array(this.oscillatorsPerNote.length)

    for (let o = 0; o < this.oscillatorsPerNote; o++) {
      oscillators[o] = Node.context.createOscillator()
    }

    for (let o = 0; o < this.oscillatorsPerNote; o++) {
      const { A, D, S, detune, gain, octave, transpose, peak, type, destination } = this.oscillatorGroupProps[o]

      let noteIndex = i + 12 * octave + transpose
      if (noteIndex < 0) noteIndex = 0
      else if (noteIndex > notes.length - 1) noteIndex = notes.length - 1

      const freq = notes[noteIndex]

      const ADSRGain = Node.context.createGain()
      const oscillator = oscillators[o]

      const outputGain = Node.context.createGain()
      outputGain.gain.value = gain
      ADSRGain.connect(outputGain)

      oscillator.connect(ADSRGain)

      // destination
      if (destination === 'OUTPUT') {
        outputGain.connect(this.groupGains[o])
      } else {
        outputGain.connect(oscillators[destination].frequency)
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

      gains[o] = outputGain
      ADSRGains[o] = ADSRGain
    }

    //polyphony
    this.gains[index] = gains
    this.groupADSRGains[index] = ADSRGains
    this.groupOscillators[index] = oscillators
  }

  stopNote(i) {
    //polyphony
    const index = this.getInuseIndexByNote(i)
    if (index === -1) return
    const gains = this.gains[index]
    const ADSRGains = this.groupADSRGains[index]
    const oscillators = this.groupOscillators[index]

    const t = Node.context.currentTime

    for (let o = 0; o < this.oscillatorsPerNote; o++) {
      const { R } = this.oscillatorGroupProps[o]
      const ADSRGain = ADSRGains[o]

      ADSRGain.gain.cancelScheduledValues(t);
      ADSRGain.gain.setValueAtTime(ADSRGain.gain.value, t);
      ADSRGain.gain.linearRampToValueAtTime(0, t + R)

      oscillators[o].stop(t + R)

      setTimeout(() => {
        oscillators[o].disconnect()
        ADSRGain.disconnect()
        gains[o].disconnect()
      }, R * 1000);
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

  setMute(index, value) {
    //falta arreglar en caso de modulator
    this.oscillatorGroupProps[index].muted = value
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

  setOscillatorTarget(origin, destination) {
    const oscillatorGroup = this.oscillatorGroupProps[origin]
    const maxValues = this.maxValues[origin]

    oscillatorGroup.destination = destination

    if (destination === 'OUTPUT') {
      oscillatorGroup.peak = 1
      oscillatorGroup.S = 1
      maxValues[2] = 1
      return carrierConstraints
    } else {
      oscillatorGroup.peak = modulatorPeak
      oscillatorGroup.S = 100
      maxValues[2] = modulatorPeak
      return modulatorConstraints
    }
  }

  initOscillatorGroupProps() {
    //A D S R detune gain - tienen que estar en este orden
    this.oscillatorGroupProps = [
      {
        A: 2.6, D: 0.5, S: 1000, R: 0.3, detune: 0, gain: 0.5,
        type: 'sawtooth', octave: 0, transpose: 0,
        destinations: [['B', 1], ['C', 2], ['Out', 'OUTPUT']],
        destination: 2,
        peak: modulatorPeak, muted: false,
        name: 'A'
      },
      {
        A: 1.9, D: D, S: S, R, detune: 0, gain: 0.2,
        type: 'sawtooth', octave: 0, transpose: 0,
        destinations: [['A', 0], ['C', 2], ['Out', 'OUTPUT']],
        destination: 'OUTPUT',
        peak: 1, muted: false,
        name: 'B'
      },
      {
        A: A, D: 0.1, S: S, R: 0.1, detune: 0, gain: 0.8,
        type: 'sine', octave: 0, transpose: 0,
        destinations: [['A', 0], ['B', 1], ['Out', 'OUTPUT']],
        destination: 'OUTPUT',
        peak: 1, muted: false,
        name: 'C'
      },
    ]

    this.oscillatorsPerNote = this.oscillatorGroupProps.length
  }

  setSurgeonParam(oscIndex, paramIndex, value) {
    this.surgeonParams[paramIndex].set(oscIndex, parseFloat(value))
  }

  addToOctaveTranspose(index, param, value) {
    this.oscillatorGroupProps[index][param] += value
  }

  setOctaveTranspose(index, param, value) {
    this.oscillatorGroupProps[index][param] = value
  }

  initSurgeonParams() {
    //A D S R
    const setScaleNodeProperty = (o, prop, value) => {
      this.oscillatorGroupProps[o][prop] = value
    }

    const setDetune = (o, value) => {
      this.oscillatorGroupProps[o].detune = value
      this.groupOscillators.forEach(grpOsc => {
        grpOsc[o].detune.setValueAtTime(value, 0)
      })
    }

    const setGain = (o, value) => {
      this.oscillatorGroupProps[o].gain = value
      this.gains.forEach(g => {
        g[o].gain.value = value
      })
    }

    this.minValues = [0, 0, 0, 0, -100, 0]

    this.maxValues = [
      [5, 5, modulatorPeak, 5, 100, 1],
      [5, 5, 1, 5, 100, 1],
      [5, 5, 1, 5, 100, 1],
    ]

    this.surgeonParams = [
      {
        name: "A",
        displayName: "attack",
        unit: 's',
        set(i, v) { setScaleNodeProperty(i, "A", v) }
      },
      {
        name: "D",
        displayName: "decay",
        unit: 's',
        set(i, v) { setScaleNodeProperty(i, "D", v) }
      },
      {
        name: "S",
        displayName: "sustain",
        unit: '',
        set(i, v) { setScaleNodeProperty(i, "S", v) }
      },
      {
        name: "R",
        displayName: "release",
        unit: 's',
        set(i, v) { setScaleNodeProperty(i, "R", v) }
      },
      {
        name: "detune",
        displayName: "detune",
        unit: '',
        set(i, v) { setDetune(i, v) }
      },
      {
        name: "gain",
        displayName: "level",
        unit: '',
        set(i, v) { setGain(i, v) }
      },
    ]
  }

  saveString() {
    return JSON.stringify({ nodeType: 'Surgeon', gain: this.gain, state: this.oscillatorGroupProps })
  }

  destroy() {
    //chequear
    super.destroy()

    this.inUse = null
    this.available = null
    this.noteIndexInUse = null

    this.surgeonParams = null
    this.oscillatorGroupProps = null

    for (let o = 0; o < this.oscillatorsPerNote; o++) {
      this.groupGains[o].disconnect()
      this.groupGains[o] = null

      for (let i = 0; i < polyphony; i++) {
        if (this.gains[i]) {
          if (this.gains[i][o]) {
            this.gains[i][o].disconnect()
            this.gains[i][o] = null
            this.groupADSRGains[i][o].disconnect()
            this.groupADSRGains[i][o] = null
            this.groupOscillators[i][o].disconnect()
            this.groupOscillators[i][o] = null
          }
        }
      }
    }

    this.gains = null
    this.groupADSRGains = null
    this.groupOscillators = null
  }

  //Polyphony helper functions

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

module.exports = Surgeon