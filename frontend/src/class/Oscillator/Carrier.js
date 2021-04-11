const Oscillator = require("./Oscillator")

const initialGain = 0.5
const detuneMax = 100
const initFreq = 220


const minMaxStep = [
  { name: 'frequency', minValue: 20, maxValue: 7000, value: initFreq, defaultValue: initFreq, step: 1 },
  { name: 'detune', minValue: -detuneMax, maxValue: detuneMax, value: 0, defaultValue: 0, step: 0.1 },
]

class Carrier extends Oscillator {
  static carrierCount = 0

  constructor(type, frequency) {
    super(type, frequency || initFreq)

    this.name = "Carr " + ++Carrier.carrierCount
    this.nodeType = "Carrier"

    this.status = "STOPPED"

    this.setMinMaxStep()
    this.initGain(initialGain)
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

module.exports = Carrier