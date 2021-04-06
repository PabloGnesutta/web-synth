const Node = require("./Node")
const ADSROscillator = require("./Oscillator/ADSROscillator")
const scale = require("../data/scale")

const initialGain = 0.5

class Delay extends Node {
  static delayCount = 0

  constructor(name) {
    super(name)
    this.name = name || "Piano 1"
    this.nodeType = "Scale Interface"
    this.types = ["sine", "triangle", "sawtooth", "square"]
    this.oscType = "triangle"

    this.octave = 3
    this.transpose = 0

    this.scaleNodes = []

    this.A = 0
    this.D = 0
    this.S = 1
    this.R = 0.5

    this.initGain(initialGain)
    this.initCustomParams()
    this.initOscillators()
  }

  initGain(initialGain) {
    this.gain = initialGain

    this.level = Node.context.createGain()
    this.level.gain.setValueAtTime(this.gain, 0)
    this.outputNode = this.level
  }

  initOscillators() {
    scale.forEach((s) => {
      const osc = new ADSROscillator(this.oscType, s.freq);
      osc.connectNativeNode(this.outputNode);
      this.scaleNodes.push(osc);
    });
  }

  start(e) {
    const index = scale.findIndex((s) => e.key === s.key);
    if (index == -1) return
    //esto tendría que setearse en foreach al cambiar el valor, una vez por cada nodo, y no en cada start
    // this.scaleNodes[index].A = this.A
    // this.scaleNodes[index].D = this.D
    // this.scaleNodes[index].S = this.S
    // this.scaleNodes[index].R = this.R
    this.scaleNodes[index].start(this.octave, this.transpose);
    this.scaleNodes[index].node.detune.setValueAtTime(this.customParams[0].value, 0)
  }

  stop(e) { //keyup
    const index = scale.findIndex((s) => e.key === s.key);
    if (index != -1) this.scaleNodes[index].stop();

    if (e.key === "z" && this.octave > 1) this.octave--;
    if (e.key === "x") this.octave++;
  }

  setType(value) {
    this.oscType = value
    this.scaleNodes.forEach(sn => {
      sn.oscType = value
      sn.node.type = value
    })
  }

  initCustomParams() {
    const that = this;
    this.detune = {
      value: {
        setValueAtTime(value) {
          that.scaleNodes.forEach(sn => {
            sn.node.detune.setValueAtTime(value, 0)
          })
        },
      },
    }

    this.adsr = {
      attack: {
        setValueAtTime(value) {
          that.scaleNodes.forEach(sn => {
            sn.A = parseFloat(value)
          })
        },
      },
      decay: {
        setValueAtTime(value) {
          that.scaleNodes.forEach(sn => {
            sn.D = parseFloat(value)
          })
        },
      },
      sustain: {
        setValueAtTime(value) {
          that.scaleNodes.forEach(sn => {
            sn.S = parseFloat(value)
          })
        },
      },
      release: {
        setValueAtTime(value) {
          that.scaleNodes.forEach(sn => {
            sn.R = parseFloat(value)
          })
        },
      },
    }

    this.customParams = [
      {
        name: "detune",
        minValue: -100, //1 semitono
        maxValue: 100,
        value: 0,
        step: 0.1,
        node: this.detune,
        nodeAudioParam: "value",
      },
      {
        name: "attack",
        minValue: 0,
        maxValue: 1,
        value: 0,
        step: 0.01,
        node: this.adsr,
        nodeAudioParam: "attack",
      },
      {
        name: "decay",
        minValue: 0.01,
        maxValue: 1,
        value: 0.01,
        step: 0.01,
        node: this.adsr,
        nodeAudioParam: "decay",
      },
      {
        name: "sustain",
        minValue: 0,
        maxValue: 1,
        value: 1,
        step: 0.01,
        node: this.adsr,
        nodeAudioParam: "sustain",
      },
      {
        name: "release",
        minValue: 0,
        maxValue: 3,
        value: 0.01,
        step: 0.001,
        node: this.adsr,
        nodeAudioParam: "release",
      },
    ]

  }
}

module.exports = Delay