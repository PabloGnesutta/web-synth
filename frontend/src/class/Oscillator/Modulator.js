const Oscillator = require("./Oscillator")

const initialGain = 1000
const maxGain = 3000
const gainStep = 0.01

const detuneMax = 100
const initialFrequency = 5

const minMaxStep = [
  { name: 'frequency', minValue: 0, maxValue: 60, value: initialFrequency, step: 0.1 },
  { name: 'detune', minValue: -detuneMax, maxValue: detuneMax, value: 0, step: 0.1 },
]

class Modulator extends Oscillator {
  static modCount = 0

  constructor(type) {
    super(type, initialFrequency)

    this.name = "Mod " + ++Modulator.modCount
    this.nodeType = "Modulator"

    this.maxGain = maxGain
    this.gainStep = gainStep

    this.status = "STARTED"

    this.initGain(initialGain)
    this.setMinMaxStep()
    this.start()
  }

  setMinMaxStep() {
    this.audioParams.forEach(ap => {
      const index = minMaxStep.findIndex(mms => mms.name === ap.name)
      for (let key in ap) {
        ap[key] = minMaxStep[index][key]
      }
    })
  }
}

module.exports = Modulator