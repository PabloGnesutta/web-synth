const Node = require("../Node")
const Oscillator = require("./Oscillator")

const initialGain = 1

class ADSROsc extends Oscillator {
  static ADSRCount = 0

  constructor(type, frequency) {
    super(type, frequency)

    this.name = "ADSR " + ++ADSROsc.ADSRCount
    this.nodeType = "ADSROsc"

    this.detuneValue = 0;

    this.ADSRGain = Node.context.createGain()

    this.peak = 1

    this.status = "STOPPED"
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

    this.node.frequency.setValueAtTime(frequency, 0)
    this.node.detune.value = this.detuneValue

    this.playNote()
  }

  playNote() {
    const t0 = Node.context.currentTime
    const t1 = t0 + this.A

    this.node.start(t0)
    this.status = "STARTED"

    this.ADSRGain.gain.setValueAtTime(0, t0)
    this.ADSRGain.gain.linearRampToValueAtTime(this.peak, t1)
    this.ADSRGain.gain.linearRampToValueAtTime(this.S, t1 + this.D)
    // this.ADSRGain.gain.setTargetAtTime(this.S, t1, this.D)
  }

  stop() {
    const t = Node.context.currentTime
    this.ADSRGain.gain.cancelScheduledValues(t);
    this.ADSRGain.gain.setValueAtTime(this.ADSRGain.gain.value, t);
    this.ADSRGain.gain.linearRampToValueAtTime(0, t + this.R)
    // this.ADSRGain.gain.setTargetAtTime(0, t, this.R);

    this.node.stop(t + this.R)
    this.mod.stop(t + this.R)
    this.status = "STOPPED"

    // const stop = setInterval(() => {
    //   if (this.ADSRGain.gain.value < 0.001) {
    //     this.ADSRGain.disconnect()
    //     this.node.disconnect()
    //     this.node.stop(0)
    //     this.status = "STOPPED"
    //     clearInterval(stop);
    //   }
    // }, 10);
  }

  // startWithOctaveTranspose(octave, transpose) {
  //   let transposeValue;
  //   if (!transpose) transposeValue = 0
  //   else {
  //     transposeValue = this.frequency * transpose
  //   }

  //   let octaveValue = 1;
  //   if (octave) octaveValue = Math.pow(2, octave)

  //   const frequency = this.frequency * octaveValue + transposeValue
  //   this.start(frequency)
  // }
}

module.exports = ADSROsc