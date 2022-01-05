const Node = require("../Node");
const dirName = "/audio/samples/";

const initialGain = 1.2;

class Sampler extends Node {
  static samplerCount = 0;

  constructor() {
    super(initialGain, "Instrument", "Sampler");

    this.name = "Sampler " + ++Sampler.samplerCount;
    this.buffer = null;
    this.playing = false;

    this.offset = 0;
    this.duration = 0;
    this.computedDuration = 0;

    this.inputNode.connect(this.outputNode);

    this.initSampler();
    this.initCustomParams();
  }

  async initSampler() {
    let response = await fetch(dirName + "snaredrum3.wav");
    let arrayBuffer = await response.arrayBuffer();
    this.buffer = await Node.context.decodeAudioData(arrayBuffer);
    this.duration = this.buffer.duration;
    this.computedDuration = this.buffer.duration;
  }

  loadBuffer(audioBuffer) {
    if (this.playing) this.buffer.stop(0);
    this.buffer = audioBuffer;
    this.duration = this.buffer.duration;
    this.computedDuration = this.buffer.duration;
  }

  playNote(i) {
    this.source = Node.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.detune.value = 100 * i;

    this.source.start(0, this.offset, this.computedDuration);
    this.source.connect(this.outputNode);
    this.playing = true;
    this.source.onended = () => {
      this.playing = false;
      this.source.disconnect();
    };
  }

  stopSample() {
    this.source.stop(0);
    this.source.disconnect();
  }

  stopNote(i) { }

  initCustomParams() {
    const setOffset = (value) => {
      this.offset = value;
    };
    const setDuration = (value) => {
      this.computedDuration = this.duration - this.offset - value;
    };

    this.customParams = [
      {
        name: "offset",
        displayName: "start at",
        unit: 's',
        minValue: 0,
        maxValue: 5,
        value: 0,
        set(v) { setOffset(v); }
      },
      {
        name: "duration",
        displayName: "cut from end",
        unit: 's',
        minValue: 0,
        maxValue: 5,
        value: 0,
        set(v) { setDuration(v); }
      }
    ];
  }

  setCustomParam(index, value) {
    const customParam = this.customParams[index];
    customParam.value = value;
    customParam.set(parseFloat(value));
  }

  destroy() {
    super.destroy();
    this.buffer = null;
  }
}

module.exports = Sampler;