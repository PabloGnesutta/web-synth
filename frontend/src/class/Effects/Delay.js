const Node = require("../Node")

const initialGain = 1

const minDelayTime = 0.01
const maxDelayTime = 3
const initialDelayTime = 0.3
const initialFeddback = 0.5

const minMaxStep = [
  { name: 'gain', minValue: 0, maxValue: 1, value: 1, defaultValue: 1, step: 0.01 },
]

class Delay extends Node {
  static delayCount = 0

  constructor(name) {
    super(name)

    this.customParams = []

    this.name = name || "Delay " + ++Delay.delayCount
    this.nodeType = "Delay"

    this.delay = Node.context.createDelay(maxDelayTime);
    this.delay.delayTime.value = initialDelayTime;

    this.feedbackGain = Node.context.createGain();
    this.feedbackGain.gain.value = initialFeddback;

    this.bypass = Node.context.createGain();
    this.wetGain = Node.context.createGain();
    this.dryGain = Node.context.createGain();

    this.delay.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delay);

    this.delay.connect(this.wetGain);
    this.wetGain.connect(this.bypass);

    this.node = Node.context.createGain();
    this.node.connect(this.feedbackGain)

    this.dryGain.connect(this.bypass)

    this.node.connect(this.dryGain)

    this.initGain(initialGain)
    this.initInnerNodeAudioParams()
    this.initCustomParams()

    super.setMinMaxStep(minMaxStep)

    //audio source must connect to node and bypass
  }

  initGain(initialGain) {
    this.gain = initialGain

    this.level = Node.context.createGain()
    this.level.gain.setValueAtTime(this.gain, 0)
    this.outputNode = this.level

    this.bypass.connect(this.outputNode);
  }

  initInnerNodeAudioParams() {
    this.innerNodeAudioParams = [
      {
        name: 'delay time', displayName: 'time', unit: 's',
        minValue: minDelayTime, maxValue: maxDelayTime, value: initialDelayTime, defaultValue: initialDelayTime, step: 0.01,
        node: this.delay, nodeAudioParam: 'delayTime'
      },
      {
        name: 'feedback', displayName: 'feedback', unit: '', //%
        minValue: 0, maxValue: 0.99, value: initialFeddback, defaultValue: initialFeddback, step: 0.01,
        node: this.feedbackGain, nodeAudioParam: 'gain'
      },
    ]
  }

  initCustomParams() {
    const setDryWet = (value) => {
      this.wetGain.gain.value = value
      this.dryGain.gain.value = value.map(0, 1, 1, 0)
    }

    this.customParams = [
      {
        name: "dry/wet",
        displayName: "dry/wet",
        unit: '', //%
        minValue: 0,
        maxValue: 1,
        defaultValue: 0.3,
        value: 0,
        step: 0.01,
        set(v) { setDryWet(v) }
      },
    ]
  }
}

module.exports = Delay