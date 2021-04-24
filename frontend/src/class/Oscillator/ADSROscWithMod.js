const Node = require("../Node")
const Oscillator = require("./Oscillator")

const initialGain = 1

class ADSROscWithMod extends Oscillator {
  static ADSRWithModCount = 0

  constructor(type) {
    super(initialGain)

    this.name = "ADSROscWithMod " + ++ADSROscWithMod.ADSRWithModCount
    this.nodeType = "ADSROscWithMod"
    this.type = type
    this.peak = 1
    this.detuneValue = 0
    this.status = "STOPPED"

    this.ADSRGain = Node.context.createGain()
    this.modLevel = Node.context.createGain()
    this.mod = Node.context.createOscillator()

    // this.mods = [
    //   {
    //     modLevelValue: 1000,
    //     modType: "sine",
    //     modLevel: Node.context.createGain(),
    //     mod: Node.context.createOscillator()
    //   },
    // ]

    this.modLevelValue = 1000
    this.modType = "triangle"
    // this.inputNode.connect(this.outputNode)
  }

  startWithFrequency(frequency) {
    this.start(frequency)
  }

  //need to start ADSRGain each time to prevent conflict with release times
  start(frequency) {
    const t = Node.context.currentTime
    this.ADSRGain = Node.context.createGain()
    this.ADSRGain.connect(this.outputNode)

    this.node = Node.context.createOscillator()
    this.node.type = this.type
    this.node.connect(this.ADSRGain)

    //FM
    this.modLevel.connect(this.node.frequency)
    this.modLevel.gain.setValueAtTime(this.modLevelValue, t)

    this.mod = Node.context.createOscillator()
    this.mod.type = this.modType

    this.mod.frequency.setValueAtTime(frequency, t) //sync with note freq
    this.mod.detune.value = this.detuneValue
    this.mod.connect(this.modLevel)
    //---

    this.node.frequency.setValueAtTime(frequency, t)
    this.node.detune.value = this.detuneValue

    this.playNote()
  }

  playNote() {
    const t0 = Node.context.currentTime
    const t1 = t0 + this.A

    this.mod.start(t0)
    this.node.start(t0)
    // this.mods.forEach(mod => {
    //   mod.mod.start(0)
    // })

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

    this.node.stop(t + this.R)
    this.mod.stop(t + this.R)
    this.status = "STOPPED"

  }
}

module.exports = ADSROscWithMod