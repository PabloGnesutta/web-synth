const Node = require("../Node")
const Oscillator = require("./Oscillator")

const initialGain = 1

class ADSROscillator extends Oscillator {
  static ADSRCount = 0

  constructor(type, frequency) {
    super(type, frequency)

    this.name = "ADSR " + ++ADSROscillator.ADSRCount
    this.nodeType = "ADSROscillator"

    this.peak = 1
    this.detuneValue = 0
    this.status = "STOPPED"

    // this.mods = [
    //   {
    //     modLevelValue: 1000,
    //     modType: "sine",
    //     modLevel: Node.context.createGain(),
    //     mod: Node.context.createOscillator()
    //   },
    // ]

    // FM
    this.modLevelValue = 1000
    this.modType = "triangle"
    this.modLevel = Node.context.createGain()
    this.mod = Node.context.createOscillator()

    this.initGain(initialGain)
  }

  startWithFrequency(frequency) {
    this.start(frequency)
  }

  start(frequency) {
    this.ADSRGain = Node.context.createGain()
    this.ADSRGain.connect(this.outputNode)

    this.node = Node.context.createOscillator()
    this.node.type = this.oscType
    this.node.connect(this.ADSRGain)

    //FM

    // this.mods.forEach(mod => {
    //   mod.modLevel.connect(this.node.frequency)
    //   mod.modLevel.gain.setValueAtTime(mod.modLevelValue, 0)

    //   mod.mod = Node.context.createOscillator()
    //   mod.mod.type = mod.modType
    //   mod.mod.frequency.value = frequency //sync with note freq
    //   mod.mod.detune.value = this.detuneValue

    //   mod.mod.connect(mod.modLevel)
    // })
    this.modLevel.connect(this.node.frequency)
    this.modLevel.gain.setValueAtTime(this.modLevelValue, 0)

    this.mod = Node.context.createOscillator()
    this.mod.type = this.modType
    this.mod.frequency.value = frequency //sync with note freq
    this.mod.detune.value = this.detuneValue

    this.mod.connect(this.modLevel)

    //---

    this.node.frequency.setValueAtTime(frequency, 0)
    this.node.detune.value = this.detuneValue

    this.playNote()
  }

  playNote() {
    const t0 = Node.context.currentTime
    const t1 = t0 + this.A

    this.node.start(t0)
    // this.mods.forEach(mod => {
    //   mod.mod.start(0)
    // })
    this.mod.start(t0)

    this.status = "STARTED"

    this.ADSRGain.gain.setValueAtTime(0, t0)
    this.ADSRGain.gain.linearRampToValueAtTime(this.peak, t1)
    this.ADSRGain.gain.linearRampToValueAtTime(this.S, t1 + this.D)
  }

  stop() {
    const t = Node.context.currentTime
    this.ADSRGain.gain.cancelScheduledValues(t);
    this.ADSRGain.gain.setValueAtTime(this.ADSRGain.gain.value, t);
    this.ADSRGain.gain.linearRampToValueAtTime(0, t + this.R)

    const stop = setInterval(() => {
      if (this.ADSRGain.gain.value < 0.001) {
        this.node.disconnect()
        this.node.stop(0)
        this.mod.stop(0)
        // this.mods.forEach(mod => {
        //   mod.mod.stop(0)
        // })
        this.status = "STOPPED"

        clearInterval(stop);
      }
    }, 10);
  }
}

module.exports = ADSROscillator