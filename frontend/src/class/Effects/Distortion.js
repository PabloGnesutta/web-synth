const Node = require("../Node");

const initialGain = 1;

class Distortion extends Node {
  static distortionCount = 0

  constructor(name) {
    super(initialGain)

    this.name = name || "Distortion " + ++Distortion.distortionCount
    this.nodeType = "Distortion"

    this.curveAmount = 30
    this.harshAmount = 1.2

    this.dryGain = Node.context.createGain()
    this.wetGain = Node.context.createGain()

    this.node = Node.context.createWaveShaper()

    this.node.curve = this.makeDistortionCurve(this.curveAmount, this.harshAmount);
    this.node.oversample = 'none'; //2x 4x

    this.inputNode.connect(this.node)
    this.inputNode.connect(this.dryGain)
    this.node.connect(this.wetGain)

    this.dryGain.connect(this.outputNode)
    this.wetGain.connect(this.outputNode)

    this.initDryWet()
    this.initCustomParams()
  }

  saveString() {
    return JSON.stringify({
      nodeType: this.nodeType,
      gain: this.gain,
      customParams: this.this.customParams,
      dryWet: this.dryWet
    })
  }

  destroy() {
    super.destroy()
    this.dryGain.disconnect()
    this.wetGain.disconnect()
    this.dryGain = null
    this.wetGain = null
  }

  initCustomParams() {
    this.customParams = [
      {
        name: 'amount', displayName: 'boost', unit: '', //%
        minValue: 20, maxValue: 100, value: this.curveAmount,
      },
      {
        name: 'harsh', displayName: 'harsh', unit: '', //%
        minValue: 0, maxValue: 3, value: this.harshAmount,
      },
    ]
  }

  setCustomParam(index, value) {
    if (index === 0) this.setAmount(value)
    else if (index === 1) this.setHarsh(value)
    this.customParams[index].value = value
  }

  setAmount(value) {
    let val = value * 2
    this.curveAmount = val;
    this.node.curve = this.makeDistortionCurve(val, this.harshAmount);
  }

  setHarsh(value) {
    let val = Math.pow(10, value)
    this.harshAmount = val
    this.node.curve = this.makeDistortionCurve(this.curveAmount, val);
  }

  makeDistortionCurve(amount, harsh) {
    let
      k = amount,
      n_samples = 44100,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      x;

    for (let i = 0; i < n_samples; ++i) {
      x = i * 2 / n_samples - 1;

      curve[i] = (3 + harsh) * x * k * (Math.PI / 180) / (Math.PI + harsh * Math.abs(x))

      // curve[i] = (3 + k) * x * harsh * deg / (Math.PI + k * Math.abs(x)); //esta va mas

      // curve[i] = (3 + k) * Math.atan(Math.sinh(x * 0.25) * 5) / (Math.PI + k * Math.abs(x));

    }
    return curve;
  };

  initDryWet() {
    this.dryWet = {
      displayName: "dry/wet",
      unit: '', //%
      minValue: 0,
      maxValue: 1,
      value: 1,
    }
  }

  setDryWet(value) {
    this.wetGain.gain.value = value
    this.dryGain.gain.value = value - 1
    this.dryWet.value = value
  }

}
module.exports = Distortion