const Node = require("../Node")

const maxDelayTime = 3
const initialDelayTime = 0.3
const initialFeddback = 0.6

const minMaxStep = [
  { name: 'gain', minValue: 0, maxValue: 1, value: 1, step: 0.01 },
]

class Delay extends Node {
  static delayCount = 0

  constructor(name) {
    super(name)

    this.name = name || "Delay " + ++Delay.delayCount
    this.nodeType = "Delay"

    this.delay = Node.context.createDelay(maxDelayTime);
    this.delay.delayTime.value = initialDelayTime;

    this.feedback = Node.context.createGain();
    this.feedback.gain.value = initialFeddback;

    this.bypass = Node.context.createGain();
    this.bypass.gain.value = 1;

    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);

    this.delayGain = Node.context.createGain();
    this.delayGain.gain.value = 1;

    this.delay.connect(this.delayGain);
    this.delayGain.connect(this.bypass);

    this.node = Node.context.createGain();
    this.node.connect(this.feedback)

    this.bypassGain = Node.context.createGain();
    this.bypassGain.gain.value = 1;
    this.bypassGain.connect(this.bypass)

    this.node.connect(this.bypassGain)

    this.initGain()

    super.getAudioParams()
    this.initCustomParams()

    super.setMinMaxStep(minMaxStep)

    //audio source must connect to node and bypass
  }

  initGain() {
    this.outputNode = Node.context.createGain()
    this.outputNode.gain.value = 1
    this.bypass.connect(this.outputNode);
  }

  initCustomParams() {
    const bypassGain = this.bypassGain.gain
    const delayGain = this.delayGain.gain

    this.drywet = {
      drywetValue: {
        setValueAtTime(value) {
          delayGain.value = value
          bypassGain.value = this.mapRange(value, 0, 1, 1, 0)
        },
        mapRange(value, in_min, in_max, out_min, out_max) {
          return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
        }
      }
    }

    this.customParams = [
      {
        name: 'delay time',
        minValue: 0, maxValue: maxDelayTime, value: initialDelayTime, step: 0.01,
        node: this.delay, nodeAudioParam: 'delayTime'
      },
      { name: 'feedback', minValue: 0, maxValue: 0.99, value: initialFeddback, step: 0.01, node: this.feedback, nodeAudioParam: 'gain' },
      { name: 'dry/wet', minValue: 0, maxValue: 1, value: 0.5, step: 0.01, node: this.drywet, nodeAudioParam: 'drywetValue' },
    ]
  }


}

module.exports = Delay