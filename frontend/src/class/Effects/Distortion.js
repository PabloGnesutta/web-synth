const hasDryWet = require("../../composition/hasDryWet");
const { runSaveFunctions } = require("../nodeUtils");
const Node = require("../Node");


const initialGain = 1;

class Distortion extends Node {
  static distortionCount = 0;

  constructor(saveObject) {
    super(initialGain, "Effect", "Distortion");

    this.name = saveObject?.name || "Distortion " + ++Distortion.distortionCount;

    this.node = Node.context.createWaveShaper();
    // currently oversample can't be changed by the user, eventualy it will?
    this.oversample = saveObject?.oversample || 'none'; //2x 4x
    this.node.oversample = this.oversample;

    this.inputNode.connect(this.node);

    this.initCustomParams(saveObject?.customParams);

    hasDryWet(this, saveObject?.dryWet);
  }

  initCustomParams(saveObjectCustomParams) {
    this.customParams = [
      {
        name: 'curveAmount', displayName: 'boost', unit: '', //%
        minValue: 20, maxValue: 100,
        value: saveObjectCustomParams ? saveObjectCustomParams[0].value : 30,
      },
      {
        name: 'harshAmount', displayName: 'harsh', unit: '', //%
        minValue: 0, maxValue: 3,
        value: saveObjectCustomParams ? saveObjectCustomParams[1].value : 1.2,
      },
    ];

    this.node.curve = this.makeDistortionCurve(this.customParams[0].value, this.customParams[1].value);
  }

  setCustomParam(index, value) {
    this.customParams[index].value = value;
    this.node.curve = this.makeDistortionCurve(this.customParams[0].value, this.customParams[1].value);
  }

  makeDistortionCurve(incomingAmount, incomingHarsh) {
    let
      amount = incomingAmount * 2,
      harsh = Math.pow(10, incomingHarsh),
      n_samples = 44100,
      curve = new Float32Array(n_samples),
      // deg = Math.PI / 180,
      x;

    for (let i = 0; i < n_samples; ++i) {
      x = i * 2 / n_samples - 1;
      curve[i] = (3 + harsh) * x * amount * (Math.PI / 180) / (Math.PI + harsh * Math.abs(x));
      // curve[i] = (3 + amount) * x * harsh * deg / (Math.PI + amount * Math.abs(x)); //esta va mas
      // curve[i] = (3 + amount) * Math.atan(Math.sinh(x * 0.25) * 5) / (Math.PI + amount * Math.abs(x));

    }
    return curve;
  };

  saveString() {
    const effectData = {
      oversample: this.oversample,
      customParams: this.customParams.map(param => ({ name: param.name, value: param.value })),
    };
    this.saveParams.forEach(param => effectData[param.name] = param.value);
    runSaveFunctions(effectData, this.saveFunctions);
    return JSON.stringify(effectData);
  }

  destroy() {
    super.destroy();
    this.customParams = null;
  }
}

module.exports = Distortion;