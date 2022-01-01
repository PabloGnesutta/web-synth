const Node = require("../Node");
const hasDryWet = require("../../composition/hasDryWet");
const hasInnerNodeAudioParams = require("../../composition/hasInnerNodeAudioParams");

const initialGain = 1;

class EQ3 extends Node {
  static EQ3Count = 0;

  constructor(name) {
    super(initialGain, 'Effect', 'EQ3');

    this.name = name || "EQ3 " + ++EQ3.EQ3Count;

    this.high = Node.context.createBiquadFilter();
    this.mid = Node.context.createBiquadFilter();
    this.node = Node.context.createBiquadFilter();

    //high
    this.high.type = "highshelf";
    this.high.connect(this.mid);
    //mid
    this.mid.type = "peaking";
    this.mid.connect(this.node);
    //low (chain end)
    this.node.type = "lowshelf";

    this.inputNode.connect(this.high);

    this.initInnerNodeAudioParams();

    hasDryWet(this);
  }

  initInnerNodeAudioParams() {
    hasInnerNodeAudioParams(this);
    this.innerNodeAudioParams = [
      //low
      {
        name: 'lowFreq', displayName: '', unit: 'hz',
        minValue: 0, maxValue: 500, value: 320,
        node: this.node, nodeAudioParam: 'frequency'
      },
      {
        name: 'lowGain', displayName: 'gain', unit: '',
        minValue: -30, maxValue: 30, value: 0,
        node: this.node, nodeAudioParam: 'gain'
      },
      //mid
      {
        name: 'midFreq', displayName: '', unit: 'hz',
        minValue: 800, maxValue: 1200, value: 1000,
        node: this.mid, nodeAudioParam: 'frequency'
      },
      {
        name: 'midGain', displayName: 'gain', unit: '',
        minValue: -30, maxValue: 30, value: -12,
        node: this.mid, nodeAudioParam: 'gain'
      },
      {
        name: 'midQ', displayName: 'res', unit: '',
        minValue: -10, maxValue: 10, value: 0.5,
        node: this.mid, nodeAudioParam: 'Q'
      },
      //high
      {
        name: 'highFreq', displayName: '', unit: 'hz',
        minValue: 2000, maxValue: 4000, value: 3200,
        node: this.high, nodeAudioParam: 'frequency'
      },
      {
        name: 'highGain', displayName: 'gain', unit: '',
        minValue: -30, maxValue: 30, value: -12,
        node: this.high, nodeAudioParam: 'gain'
      },
    ];

    for (let i = 0; i < this.innerNodeAudioParams.length; i++) {
      this.setInnerNodeAudioParam(i, this.innerNodeAudioParams[i].value);
    }
  }

  saveString() {
    const jsonString = {};
    this.saveParams.forEach(param => {
      jsonString[param.name] = param.value;
    });

    return JSON.stringify(jsonString);
  }

  destroy() {
    super.destroy();

    this.mid.disconnect();
    this.mid = null;
    this.high.disconnect();
    this.high = null;
  }
}

module.exports = EQ3;