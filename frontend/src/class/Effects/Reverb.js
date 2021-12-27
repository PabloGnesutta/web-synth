const Node = require("../Node");
const hasDryWet = require("../../composition/hasDryWet");

const dirName = "/audio/impulse_responses/";

const initialGain = 1;

class Reverb extends Node {
  static reverbCount = 0;

  constructor(name) {
    super(initialGain, "Effect", "Reverb");

    this.name = name || "Reverb " + ++Reverb.reverbCount;
    this.types = ['Five Columns', 'Bottle Hall', 'Deep Space', 'In The Silo', 'Chateau Outside', 'Damp Lg Room'];
    this.type = 'In The Silo';

    this.node = Node.context.createConvolver();

    this.inputNode.connect(this.node);

    this.setType(this.type);

    hasDryWet(this);
  }

  //se podrían cachear los buffers, o no...
  setType(type) {
    fetch(dirName + type + '.wav').then(res => { return res.arrayBuffer(); })
      .then((arrayBuffer) => {
        Node.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
          this.node.buffer = audioBuffer;
        });
      });
  }

  saveString() {
    const jsonString = {
      type: this.type,
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

module.exports = Reverb;