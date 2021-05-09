const Node = require("../Node")
const Oscillator = require("./Oscillator")

const initialGain = 1

class ADSROsc extends Oscillator {
  constructor(type) {
    super(initialGain)

    this.type = type
    this.detuneValue = 0;
    this.peak = initialGain

    this.ADSRGain = Node.context.createGain()
    this.inputNode.connect(this.outputNode)

    //no necesita toggle mute ni set mute de Node
  }

  startWithFrequency(frequency, o) {
    this.start(frequency, o)
  }

  start(frequency, o) {

    this.ADSRGain = Node.context.createGain()
    this.node = Node.context.createOscillator()
    this.node.type = this.type

    this.node.connect(this.ADSRGain)
    this.ADSRGain.connect(this.outputNode)

    this.node.frequency.setValueAtTime(frequency, 0)
    this.node.detune.value = this.detuneValue

    this.playNote()
  }

  playNote() {
    const t0 = Node.context.currentTime
    const t1 = t0 + this.A

    this.node.start(t0)

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
  }
}

module.exports = ADSROsc