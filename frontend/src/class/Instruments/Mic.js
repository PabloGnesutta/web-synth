const hasAudioParams = require("../../composition/hasAudioParams");
const Node = require("../Node");

const initialGain = 0.5;

class Mic extends Node {
  static micCount = 0;

  constructor(stream) {
    super(initialGain, "Instrument", "Mic");

    this.name = "Mic " + ++Mic.micCount;

    this.node = Node.context.createDynamicsCompressor();
    this.mic = Node.context.createMediaStreamSource(stream);
    this.mic.connect(this.node);
    this.node.connect(this.outputNode);

    this.initAudioParams();
  }

  initAudioParams() {
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
  }

  playNote(i) { }

  stopNote(i) { }

  destroy() {
    super.destroy();
    this.mic.disconnect();
    this.mic = null;
  }

}

module.exports = Mic;