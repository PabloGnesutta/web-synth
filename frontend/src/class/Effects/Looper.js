const Node = require("../Node");
const hasInnerNodeAudioParams = require("../../composition/hasInnerNodeAudioParams");

const initialGain = 1;

class Looper extends Node {
  static looperCount = 0;

  constructor(name) {
    super(initialGain, 'Effect', "Looper");

    this.name = name || "Looper " + ++Looper.looperCount;

    this.playing = false;
    this.recording = false;
    this.status = "CLEARED";

    this.loopAvailable = false;
    this.looperBuffer = null;
    this.looperBlob = null;
    this.loopDuration = 0;

    this.nextBeatTime = 0;
    this.feedback = Node.context.createGain();
    this.source = Node.context.createBufferSource();

    this.inputNode.connect(this.feedback);
    this.feedback.connect(this.outputNode);

    this.initInnerNodeAudioParams();
  }

  startLoop(startAt) {
    this.status = "PLAYING";
    this.playing = true;
    this.continueLoop(startAt);
  }

  // this.source.start(when, offset, duration)
  continueLoop(nextBeatTime) {
    this.source = Node.context.createBufferSource();
    this.source.buffer = this.looperBuffer;

    this.source.connect(this.feedback);
    this.source.start(nextBeatTime);

    this.source.onended = () => {
      this.continueLoop(Node.nextBeatTime);
    };
  }

  startMediaRecorder() {
    // this.inputNode.connect(this.mediaDestination);
    this.inputNode.connect(this.feedback);
    this.feedback.connect(this.mediaDestination);
    this.mediaRecorder.start();
  }

  async finishRecordingAndPlay(arrayBuffer) {
    await this.setAudioBuffer(arrayBuffer);

    // this.inputNode.disconnect(this.mediaDestination)
    // this.inputNode.disconnect(this.feedback)

    if (this.playing) this.stopLoop();

    this.startLoop(this.nextBeatTime);
  }

  startRecording(nextBeatTime) {
    this.mediaDestination = Node.context.createMediaStreamDestination();
    this.nextBeatTime = nextBeatTime;
    this.chunks = [];

    this.mediaRecorder = new MediaRecorder(
      this.mediaDestination.stream
    );

    this.mediaRecorder.ondataavailable = (evt) => {
      this.chunks.push(evt.data);
    };

    this.mediaRecorder.onstop = () => {
      this.processBlob();
    };

    this.scheduleMediaRecorderStart();
    this.status = "STARTING";
  }

  scheduleMediaRecorderStart() {
    const req = window.requestAnimationFrame(this.scheduleMediaRecorderStart.bind(this));
    if (Node.context.currentTime < this.nextBeatTime) return;
    this.startMediaRecorder();

    window.cancelAnimationFrame(req);
    this.recording = true;
    this.status = "RECORDING";
    this.nextBeatTime = 0;
  }

  stopRecording(nextBeatTime) {
    this.nextBeatTime = nextBeatTime;
    this.mediaRecorder.stop();
    this.recording = false;
    this.status = "STOPPED";
  }

  stopLoop() {
    this.source.disconnect();
    this.source.stop();
    this.source.onended = null;
    this.status = "STOPPED";
    this.playing = false;
  }

  clearLoop() {
    this.stopLoop();
    this.loopAvailable = false;
    this.looperBuffer = null;
    this.loopDuration = 0;
    this.status = "CLEARED";
  }

  processBlob() {
    this.looperBlob = new Blob(this.chunks, {
      type: "audio/ogg; codecs=opus",
    });

    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      this.finishRecordingAndPlay(fileReader.result);
    };
    fileReader.readAsArrayBuffer(this.looperBlob);
  }

  async setAudioBuffer(arrayBuffer) {
    let audioBuffer = await Node.context.decodeAudioData(arrayBuffer);
    this.looperBuffer = audioBuffer;
    this.loopDuration = audioBuffer.duration;
    this.loopAvailable = true;
    this.status = "STOPPED";
  }

  initInnerNodeAudioParams() {
    this.innerNodeAudioParams = [
      {
        name: 'feedback', displayName: 'feedback', unit: '', //%
        minValue: 0, maxValue: 1, value: 1,
        node: this.feedback, nodeAudioParam: 'gain'
      },
    ];
    hasInnerNodeAudioParams(this);
  }

  destroy() {
    //chequear
    super.destroy();
    this.feedback.disconnect();
    this.feedback = null;

    this.source.disconnect();
    this.source = null;
  }
}
module.exports = Looper;