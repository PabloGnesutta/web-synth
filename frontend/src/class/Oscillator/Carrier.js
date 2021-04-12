const Oscillator = require("./Oscillator")

const initialGain = 0.5
const detuneMax = 100
const initFreq = 220

const audioParamsConfig = [
  { name: 'frequency', displayName: 'freq', unit: 'hz', minValue: 20, maxValue: 8000, value: initFreq, defaultValue: initFreq, step: 1 },
  { name: 'detune', displayName: 'fine', unit: 'hz', minValue: -detuneMax, maxValue: detuneMax, value: 0, defaultValue: 0, step: 0.1 },
]

class Carrier extends Oscillator {
  static carrierCount = 0

  constructor(type, frequency) {
    super(type, frequency || initFreq)

    this.name = "Carr " + ++Carrier.carrierCount
    this.nodeType = "Carrier"

    this.status = "STOPPED"

    this.initParams()
    this.initGain(initialGain)
  }

  initParams() {
    this.audioParams.forEach(ap => {
      const index = audioParamsConfig.findIndex(mms => mms.name === ap.name)
      for (let key in ap) {
        ap[key] = audioParamsConfig[index][key]
      }
      ap.unit = audioParamsConfig[index].unit
      ap.displayName = audioParamsConfig[index].displayName
    })
  }
}

module.exports = Carrier