const Node = require("../Node");
const Oscillator = require("../Oscillator/Oscillator");
const noteFrequencies = require("../../data/noteFrequencies");
const hasAudioParams = require("../../composition/hasAudioParams");

const initialGain = 0.5;
const detuneMax = 100;
const initFreq = 220;

class Carrier extends Oscillator {
  static carrierCount = 0;

  constructor() {
    super(initialGain);

    this.name = "Osc " + ++Carrier.carrierCount;
    this.nodeType = "Carrier";
    this.nodeRol = "Instrument";
    this.status = "STOPPED";

    this.frequency = initFreq;

    this.initAudioParams();
    hasAudioParams(this);
  }

  initAudioParams() {
    this.audioParams = [
      { name: 'detune', displayName: 'fine', unit: 'hz', minValue: -detuneMax, maxValue: detuneMax, value: 0, },
      { name: 'frequency', displayName: 'freq', unit: 'hz', minValue: 20, maxValue: 7000, value: 220 },
    ];
  }

  playNote(i) {
    this.frequency = noteFrequencies[i];
    this.node.frequency.setValueAtTime(this.frequency, 0);
  }

  stopNote(i) { }

  start() {
    this.node = Node.context.createOscillator();
    this.node.type = this.type;
    this.node.connect(this.outputNode);

    this.node.frequency.setValueAtTime(this.frequency, 0);
    this.node.start(0);
    this.status = "STARTED";
  }

  stop() {
    this.node.stop(0);
    this.node.disconnect();
    this.status = "STOPPED";
  }

  destroy() {
    super.destroy();
  }

}

module.exports = Carrier;