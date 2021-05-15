const Node = require("../Node")

const initialGain = 1

const minDelayTime = 0.01
const maxDelayTime = 3
const initialDelayTime = 0.3
const initialFeddback = 0.5

class Delay extends Node {
  static delayCount = 0

  constructor() {
    super(initialGain)

    this.name = "Delay " + ++Delay.delayCount
    this.nodeType = "Delay"

    this.delay = Node.context.createDelay(maxDelayTime);
    this.delay.delayTime.value = initialDelayTime;

    this.feedbackGain = Node.context.createGain();
    this.feedbackGain.gain.value = initialFeddback;

    this.wetGain = Node.context.createGain();
    this.dryGain = Node.context.createGain();

    this.delay.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delay);

    this.delay.connect(this.wetGain);

    this.inputNode.connect(this.feedbackGain)
    this.inputNode.connect(this.dryGain)

    this.dryGain.connect(this.outputNode)
    this.wetGain.connect(this.outputNode);

    this.initInnerNodeAudioParams()
    this.initDryWet()
  }

  saveString() {
    return JSON.stringify({
      nodeType: this.nodeType,
      gain: this.gain,
      innerNodeAudioParams: this.this.innerNodeAudioParams,
      dryWet: this.dryWet
    })
  }

  initInnerNodeAudioParams() {
    this.innerNodeAudioParams = [
      {
        name: 'delayTime', displayName: 'time', unit: 's',
        minValue: minDelayTime, maxValue: maxDelayTime, value: initialDelayTime,
        node: this.delay, nodeAudioParam: 'delayTime'
      },
      {
        name: 'feedback', displayName: 'feedback', unit: '', //%
        minValue: 0, maxValue: 1, value: initialFeddback,
        node: this.feedbackGain, nodeAudioParam: 'gain'
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
      value: 0,
    }
  }

  setDryWet(value) {
    this.wetGain.gain.value = value
    this.dryGain.gain.value = value - 1
    this.dryWet.value = value
  }

  destroy() {
    super.destroy()
    this.delay.disconnect()
    this.dryGain.disconnect()
    this.wetGain.disconnect()
    this.feedbackGain.disconnect()

    this.delay = null
    this.dryGain = null
    this.wetGain = null
    this.feedbackGain = null
  }
}

module.exports = Delay