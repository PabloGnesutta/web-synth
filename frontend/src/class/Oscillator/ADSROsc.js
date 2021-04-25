const Node = require("../Node")
const Oscillator = require("./Oscillator")

const initialGain = 1
const peak = 1

class ADSROsc extends Oscillator {
  constructor(type) {
    super(initialGain)
    this.type = type
    this.detuneValue = 0;
    this.ADSRGain = Node.context.createGain()
  }

  startWithFrequency(frequency) {
    this.start(frequency)
  }

  start(frequency) {
    this.ADSRGain = Node.context.createGain()
    this.ADSRGain.connect(this.outputNode)

    this.node = Node.context.createOscillator()
    this.node.type = this.type
    this.node.connect(this.ADSRGain)

    this.node.frequency.setValueAtTime(frequency, 0)
    this.node.detune.value = this.detuneValue

    this.playNote()
  }

  playNote() {
    const t0 = Node.context.currentTime
    const t1 = t0 + this.A

    this.node.start(t0)

    this.ADSRGain.gain.setValueAtTime(0, t0)
    this.ADSRGain.gain.linearRampToValueAtTime(peak, t1)
    this.ADSRGain.gain.linearRampToValueAtTime(this.S, t1 + this.D)
  }

  stop() {
    const t = Node.context.currentTime
    this.ADSRGain.gain.cancelScheduledValues(t);
    this.ADSRGain.gain.setValueAtTime(this.ADSRGain.gain.value, t);
    this.ADSRGain.gain.linearRampToValueAtTime(0, t + this.R)

    this.node.stop(t + this.R)
  }
}

module.exports = ADSROsc