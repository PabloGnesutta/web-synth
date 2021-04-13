const Oscillator = require("./Oscillator")

const initialGain = 1000
const maxGain = 3000
const gainStep = 0.01

const detuneMax = 100
const initialFrequency = 5

const audioParamsConfig = [
  { name: 'frequency', displayName: 'freq', unit: 'hz', minValue: 0, maxValue: 120, value: initialFrequency, defaultValue: initialFrequency, step: 0.1 },
  { name: 'detune', displayName: 'fine', unit: 'hz', minValue: -detuneMax, maxValue: detuneMax, value: 0, defaultValue: initialFrequency, step: 0.1 },
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
    this.initParams()
    this.start()
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

  connectAudioParam(Node, audioParam) {
    this.outputNode.connect(Node.node[audioParam.name])
    this.outputs.push({ name: Node.name + ' ' + audioParam.name, node: Node.node[audioParam.name] })
  }

  connectInnerNodeAudioParam(Node, INAudioParam, INAPIndex) {
    const param = Node.innerNodeAudioParams[INAPIndex]
    const destination = param.node[param.nodeAudioParam]
    this.outputNode.connect(destination)
    this.outputs.push({ name: Node.name + ' ' + param.name, node: destination })
  }

  connectLevel(Node) {
    this.outputNode.connect(Node.outputNode.gain)
    this.outputs.push({ name: Node.name + ' Level', node: Node.outputNode })
  }

  //puede ser un nodo o un parámetro de un nodo
  disconnectOutput(output) {
    console.log('output', output)
    if (output.node.gain) this.outputNode.disconnect(output.node.gain)
    else this.outputNode.disconnect(output.node)
    const index = this.outputs.findIndex(o => o.name === output.name)
    this.outputs.splice(index, 1)
  }

}

module.exports = Modulator