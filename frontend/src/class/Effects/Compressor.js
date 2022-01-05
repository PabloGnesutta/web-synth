const Node = require("../Node");
const hasDryWet = require("../../composition/hasDryWet");
const hasAudioParams = require("../../composition/hasAudioParams");

const initialGain = 1;

class Compressor extends Node {
  static compressorCount = 0;
  constructor(saveObject) {
    super(initialGain, "Effect", "Compressor");

    this.name = saveObject?.name || "Compressor " + ++Compressor.compressorCount;

    this.node = Node.context.createDynamicsCompressor();

    this.inputNode.connect(this.node);

    this.initAudioParams(saveObject?.audioParams);

    hasDryWet(this, saveObject?.dryWet);
  }

  initAudioParams(saveObjectAudioParams) {
    this.audioParams = [
      {
        name: 'threshold', displayName: 'treshold', unit: '',
        minValue: -100, maxValue: 0, value: -24,
      },
      {
        name: 'knee', displayName: 'knee', unit: '',
        minValue: 0, maxValue: 40, value: 30,
      },
      {
        name: 'ratio', displayName: 'ratio', unit: '',
        minValue: 1, maxValue: 20, value: 12,
      },
      {
        name: 'attack', displayName: 'attack', unit: 's',
        minValue: 0, maxValue: 1, value: 0,
      },
      {
        name: 'release', displayName: 'release', unit: 's',
        minValue: 0, maxValue: 1, value: 0.3,
      },
    ];

    hasAudioParams(this);
    const valuesToLoad = saveObjectAudioParams || this.audioParams;

    for (let i = 0; i < this.audioParams.length; i++) {
      this.setAudioParam(i, valuesToLoad[i].value);
    }
  }

  saveString() {
    const jsonString = {
      name: this.name
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

module.exports = Compressor;