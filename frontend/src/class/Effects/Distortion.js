const Node = require("../Node");
const hasDryWet = require("../../composition/hasDryWet");

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

  initCustomParams(saveObjctCustomParams) {
    this.customParams = [
      {
        name: 'curveAmount', displayName: 'boost', unit: '', //%
        minValue: 20, maxValue: 100,
        value: saveObjctCustomParams ? saveObjctCustomParams[0].value : 30,
      },
      {
        name: 'harshAmount', displayName: 'harsh', unit: '', //%
        minValue: 0, maxValue: 3,
        value: saveObjctCustomParams ? saveObjctCustomParams[1].value : 1.2,
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
    const jsonString = {
      oversample: this.oversample,
      customParams: this.customParams.map(param => {
        return { name: param.name, value: param.value };
      }),
    };

    this.saveParams.forEach(param => {
      jsonString[param.name] = param.value;
    });

    this.saveFunctions.forEach(saveFunction => {
      const { name, value } = saveFunction();
      jsonString[name] = value;
    });

    return JSON.stringify(jsonString);
  }

  destroy() {
    super.destroy();
  }
}

module.exports = Distortion;