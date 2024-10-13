const hasDryWet = require("../../composition/hasDryWet");
const { runSaveFunctions } = require("../nodeUtils");
const Node = require("../Node");


const dirName = "/audio/impulse_responses/";
const initialGain = 1;

class Reverb extends Node {
  static reverbCount = 0;

  constructor(saveObject) {
    super(initialGain, "Effect", "Reverb");

    this.name = saveObject?.name || "Reverb " + ++Reverb.reverbCount;
    this.types = ['Five Columns', 'Bottle Hall', 'Deep Space', 'In The Silo', 'Chateau Outside', 'Damp Lg Room'];
    this.type = saveObject?.type || 'In The Silo';

    this.node = Node.context.createConvolver();

    this.inputNode.connect(this.node);

    this.setType(this.type);

    hasDryWet(this, saveObject?.dryWet);
  }

  //se podrían cachear los buffers, o no...
  setType(type) {
    this.type = type;
    fetch(dirName + type + '.wav').then(res => { return res.arrayBuffer(); })
      .then((arrayBuffer) => {
        Node.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
          this.node.buffer = audioBuffer;
        });
      });
  }

  saveString() {
    const effectData = {
      name: this.name,
      type: this.type,
    };
    this.saveParams.forEach(param => effectData[param.name] = param.value);
    runSaveFunctions(effectData, this.saveFunctions);
    return JSON.stringify(effectData);
  }

  destroy() {
    super.destroy();
  }
}

module.exports = Reverb;