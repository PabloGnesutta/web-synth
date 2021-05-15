const Oscillator = require("./Oscillator")

const initialGain = 1000
const maxGain = 3000
const gainStep = 0.01

const detuneMax = 100
const initialFrequency = 3

class Modulator extends Oscillator {
  static modCount = 0

  constructor() {
    super(initialGain)

    this.name = "Mod " + ++Modulator.modCount
    this.nodeType = "Modulator"
    this.type = "triangle"
    this.frequency = initialFrequency

    this.maxGain = maxGain
    this.gainStep = gainStep

    this.status = "STARTED"

    this.initAudioParams()
    this.node.start()
  }

  initAudioParams() {
    this.audioParams = [
      {
        name: 'frequency', displayName: 'freq', unit: 'hz',
        minValue: 0, maxValue: 120, value: initialFrequency,
      },
      {
        name: 'detune', displayName: 'fine', unit: 'hz',
        minValue: -detuneMax, maxValue: detuneMax, value: 0,
      },
    ]
  }

  setAudioParam(index, value) {
    let curvedValue = parseFloat(value)

    const param = this.audioParams[index];
    this.node[param.name].setValueAtTime(curvedValue, 0);
    this.audioParams[index].value = parseFloat(value);
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

  disconnectOutput(output) {
    if (output.node.gain) this.outputNode.disconnect(output.node.gain)
    else this.outputNode.disconnect(output.node)
    const index = this.outputs.findIndex(o => o.name === output.name)
    this.outputs.splice(index, 1)
  }

}

module.exports = Modulator