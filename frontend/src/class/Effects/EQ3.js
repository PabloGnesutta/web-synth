const Node = require("../Node")

const initialGain = 1

class EQ3 extends Node {
  static EQ3Count = 0

  constructor() {
    super(initialGain)

    this.name = name || "EQ3 " + ++EQ3.EQ3Count
    this.nodeType = "EQ3"

    this.high = Node.context.createBiquadFilter();
    this.mid = Node.context.createBiquadFilter();
    this.low = Node.context.createBiquadFilter();

    this.dryGain = Node.context.createGain()
    this.wetGain = Node.context.createGain()

    //high
    this.high.type = "highshelf";
    this.high.frequency.value = 3200.0;
    this.high.gain.value = 0.0;
    this.high.connect(this.mid);
    //mid
    this.mid.type = "peaking";
    this.mid.frequency.value = 1000.0;
    this.mid.Q.value = 0.5;
    this.mid.gain.value = 0.0;
    this.mid.connect(this.low);
    //low (chain end)
    this.low.type = "lowshelf";
    this.low.frequency.value = 320.0;
    this.low.gain.value = 0.0;

    this.low.connect(this.wetGain);
    this.inputNode.connect(this.high);
    this.inputNode.connect(this.dryGain)

    this.dryGain.connect(this.outputNode)
    this.wetGain.connect(this.outputNode)
    this.low.connect(this.wetGain)

    this.dryGain.connect(this.outputNode)
    this.wetGain.connect(this.outputNode)

    this.initInnerNodeAudioParams()
    this.initDryWet()
  }

  initInnerNodeAudioParams() {
    this.innerNodeAudioParams = [
      //low
      {
        name: 'lowFreq', displayName: '', unit: 'hz',
        minValue: 0, maxValue: 500, value: 320, defaultValue: 320, step: 1,
        node: this.low, nodeAudioParam: 'frequency'
      },
      {
        name: 'lowGain', displayName: 'gain', unit: '',
        minValue: -30, maxValue: 30, value: 0, defaultValue: 0, step: 0.01,
        node: this.low, nodeAudioParam: 'gain'
      },
      //mid
      {
        name: 'midFreq', displayName: '', unit: 'hz',
        minValue: 800, maxValue: 1200, value: 1000, defaultValue: 1000, step: 1,
        node: this.mid, nodeAudioParam: 'frequency'
      },
      {
        name: 'midGain', displayName: 'gain', unit: '',
        minValue: -30, maxValue: 30, value: -12, defaultValue: -12, step: 0.01,
        node: this.mid, nodeAudioParam: 'gain'
      },
      {
        name: 'midQ', displayName: 'res', unit: '',
        minValue: -10, maxValue: 10, value: 0.5, defaultValue: 0.5, step: 0.01,
        node: this.mid, nodeAudioParam: 'Q'
      },
      //high
      {
        name: 'highFreq', displayName: '', unit: 'hz',
        minValue: 2000, maxValue: 4000, value: 3200, defaultValue: 3200, step: 1,
        node: this.high, nodeAudioParam: 'frequency'
      },
      {
        name: 'highGain', displayName: 'gain', unit: '',
        minValue: -30, maxValue: 30, value: -12, defaultValue: -12, step: 0.01,
        node: this.high, nodeAudioParam: 'gain'
      },
    ]
  }

  setInnerNodeAudioParam(indexOrName, value) {
    let index = indexOrName
    if (typeof (indexOrName) !== 'number') index = this.innerNodeAudioParams.findIndex(inap => inap.name === indexOrName)

    const innerNodeAudioParam = this.innerNodeAudioParams[index];
    innerNodeAudioParam.node[innerNodeAudioParam.nodeAudioParam].setValueAtTime(value, 0);
    this.innerNodeAudioParams[index].value = parseFloat(value);
  }

  initDryWet() {
    this.dryWet = {
      name: "dry/wet",
      displayName: "dry/wet",
      unit: '', //%
      minValue: 0,
      maxValue: 1,
      defaultValue: 1,
      value: 1,
      step: 0.01
    }
  }

  setDryWet(value) {
    this.wetGain.gain.value = value
    this.dryGain.gain.value = value - 1
  }
}

module.exports = EQ3