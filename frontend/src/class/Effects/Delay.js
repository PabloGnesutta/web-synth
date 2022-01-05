const Node = require("../Node");
const hasDryWet = require("../../composition/hasDryWet");
const hasInnerNodeAudioParams = require("../../composition/hasInnerNodeAudioParams");

const minDelayTime = 0.01;
const maxDelayTime = 3;
const initialDelayTime = 0.3;
const initialFeddback = 0.5;

const initialGain = 1;

class Delay extends Node {
  static delayCount = 0;

  constructor(saveObject) {
    super(initialGain, "Effect", "Delay");

    this.name = saveObject?.name || "Delay " + ++Delay.delayCount;

    this.node = Node.context.createDelay(maxDelayTime);
    this.feedbackGain = Node.context.createGain();

    this.node.connect(this.feedbackGain);
    this.feedbackGain.connect(this.node);

    this.inputNode.connect(this.feedbackGain);

    this.initInnerNodeAudioParams(saveObject?.innerNodeAudioParams);

    hasDryWet(this, saveObject?.dryWet);
  }

  initInnerNodeAudioParams(saveObjectInnerNodeAudioParams) {
    this.innerNodeAudioParams = [
      {
        name: 'delayTime', displayName: 'time', unit: 's',
        minValue: minDelayTime, maxValue: maxDelayTime, value: initialDelayTime,
        node: this.node, nodeAudioParam: 'delayTime'
      },
      {
        name: 'feedback', displayName: 'feedback', unit: '', //%
        minValue: 0, maxValue: 1, value: initialFeddback,
        node: this.feedbackGain, nodeAudioParam: 'gain'
      },
    ];

    hasInnerNodeAudioParams(this);
    const valuesToLoad = saveObjectInnerNodeAudioParams || this.innerNodeAudioParams;

    for (let i = 0; i < this.innerNodeAudioParams.length; i++) {
      this.setInnerNodeAudioParam(i, valuesToLoad[i].value);
    }
  }

  saveString() {
    const jsonString = {
      name: this.name,
      type: this.type,
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
    this.feedbackGain.disconnect();
    this.feedbackGain = null;
  }
}

module.exports = Delay;