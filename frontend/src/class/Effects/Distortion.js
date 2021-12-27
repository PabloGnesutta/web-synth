const Node = require("../Node");
const hasDryWet = require("../../composition/hasDryWet");

const initialGain = 1;

class Distortion extends Node {
  static distortionCount = 0;

  constructor(name) {
    super(initialGain, "Effect", "Distortion");

    this.name = name || "Distortion " + ++Distortion.distortionCount;

    this.curveAmount = 30;
    this.harshAmount = 1.2;

    this.node = Node.context.createWaveShaper();

    this.node.curve = this.makeDistortionCurve(this.curveAmount, this.harshAmount);
    this.node.oversample = 'none'; //2x 4x

    this.inputNode.connect(this.node);

    this.initCustomParams();

    hasDryWet(this);
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
    ];
  }

  setCustomParam(index, value) {
    if (index === 0) this.setAmount(value);
    else if (index === 1) this.setHarsh(value);
    this.customParams[index].value = value;
  }

  setAmount(value) {
    let val = value * 2;
    this.curveAmount = val;
    this.node.curve = this.makeDistortionCurve(val, this.harshAmount);
  }

  setHarsh(value) {
    let val = Math.pow(10, value);
    this.harshAmount = val;
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

      curve[i] = (3 + harsh) * x * k * (Math.PI / 180) / (Math.PI + harsh * Math.abs(x));

      // curve[i] = (3 + k) * x * harsh * deg / (Math.PI + k * Math.abs(x)); //esta va mas

      // curve[i] = (3 + k) * Math.atan(Math.sinh(x * 0.25) * 5) / (Math.PI + k * Math.abs(x));

    }
    return curve;
  };

  saveString() {
    const jsonString = {
      customParams: this.customParams,
    };

    this.saveParams.forEach(param => {
      jsonString[param.name] = param.value;
    });

    return JSON.stringify(jsonString);
  }

  destroy() {
    super.destroy();
  }
}
module.exports = Distortion;