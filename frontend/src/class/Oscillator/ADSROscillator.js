const Node = require("../Node")
const Oscillator = require("./Oscillator")

const initialGain = 0.5

class ADSROscillator extends Oscillator {
  static ADSRCount = 0

  constructor(type, frequency) {
    super(type, frequency)

    this.name = "ADSR " + ++ADSROscillator.ADSRCount
    this.nodeType = "ADSROscillator"

    this.ADSRGain = Node.context.createGain()

    this.peak = 1
    this.A = 0.9
    this.D = 0
    this.S = 1
    this.R = 0.01

    this.status = "STOPPED"
    this.initGain(initialGain)
  }

  start(octave, transpose) {
    const t0 = Node.context.currentTime
    const t1 = t0 + this.A

    this.ADSRGain = Node.context.createGain()
    this.ADSRGain.connect(this.outputNode)

    this.node = Node.context.createOscillator()
    this.node.type = this.oscType

    let transposeValue;
    if (!transpose) transposeValue = 0
    else {
      transposeValue = this.frequency * transpose
    }

    let octaveValue = 1;
    if (octave) octaveValue = Math.pow(2, octave)

    const freqValue = this.frequency * octaveValue + transposeValue

    this.node.frequency.setValueAtTime(freqValue + transposeValue, 0)
    this.node.connect(this.ADSRGain)

    this.node.start(t0)
    this.status = "STARTED"

    this.ADSRGain.gain.setValueAtTime(0, t0)
    this.ADSRGain.gain.linearRampToValueAtTime(this.peak, t1)
    this.ADSRGain.gain.setTargetAtTime(this.S, t1, this.D)
  }

  stop() {
    const t = Node.context.currentTime

    this.ADSRGain.gain.cancelScheduledValues(t);
    this.ADSRGain.gain.setValueAtTime(this.ADSRGain.gain.value, t);
    this.ADSRGain.gain.setTargetAtTime(0, t, this.R);

    const stop = setInterval(() => {
      if (this.ADSRGain.gain.value < 0.01) {
        this.ADSRGain.disconnect()
        this.node.disconnect()
        this.node.stop(0)
        this.status = "STOPPED"
        clearInterval(stop);
      }
    }, 10);
  }
}

module.exports = ADSROscillator