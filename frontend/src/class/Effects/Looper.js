const Node = require("../Node");

const initialGain = 1;

class Looper extends Node {
  static looperCount = 0

  constructor(name) {
    super(initialGain)

    this.name = name || "Looper " + ++Looper.looperCount
    this.nodeType = "Looper"
    this.nodeRol = "Effect"

    this.playing = false
    this.recording = false
    this.status = "CLEARED"

    this.loopAvailable = false
    this.looperBuffer = null
    this.looperBlob = null
    this.loopDuration = 0;

    this.nextBeatTime = 0;
    this.feedback = Node.context.createGain()
    this.source = Node.context.createBufferSource();

    this.feedback.connect(this.inputNode)
    this.inputNode.connect(this.outputNode)

    this.initInnerNodeAudioParams()
  }

  startLoop(startAt) {
    this.status = "PLAYING"
    this.playing = true;
    this.continueLoop(startAt)
  }

  // this.source.start(when, offset, duration)
  continueLoop(nextBeatTime) {
    this.source = Node.context.createBufferSource();
    this.source.buffer = this.looperBuffer;

    this.source.connect(this.inputNode);
    this.source.start(nextBeatTime);

    this.source.onended = () => {
      this.continueLoop(Node.nextBeatTime)
    };
  }

  startMediaRecorder() {
    this.inputNode.connect(this.mediaDestination);
    this.mediaRecorder.start();
  }

  async finishRecordingAndPlay(arrayBuffer) {
    await this.setAudioBuffer(arrayBuffer)

    this.inputNode.disconnect(this.mediaDestination)

    if (this.playing) this.stopLoop()

    this.startLoop(this.nextBeatTime)
  }

  startRecording(nextBeatTime) {
    this.mediaDestination = Node.context.createMediaStreamDestination();
    this.nextBeatTime = nextBeatTime
    this.chunks = [];

    this.mediaRecorder = new MediaRecorder(
      this.mediaDestination.stream
    );

    this.mediaRecorder.ondataavailable = (evt) => {
      this.chunks.push(evt.data);
    };

    this.mediaRecorder.onstop = () => {
      this.processBlob()
    };

    this.scheduleMediaRecorderStart()
    this.status = "STARTING"
  }

  scheduleMediaRecorderStart() {
    const req = window.requestAnimationFrame(this.scheduleMediaRecorderStart.bind(this));
    if (Node.context.currentTime < this.nextBeatTime) return
    this.startMediaRecorder()

    window.cancelAnimationFrame(req)
    this.recording = true
    this.status = "RECORDING"
    this.nextBeatTime = 0
  }

  stopRecording(nextBeatTime) {
    this.nextBeatTime = nextBeatTime;
    this.mediaRecorder.stop();
    this.recording = false
    this.status = "STOPPED"
  }

  stopLoop() {
    this.source.disconnect()
    this.source.stop()
    this.source.onended = null
    this.status = "STOPPED"
    this.playing = false
  }

  clearLoop() {
    this.stopLoop()
    this.loopAvailable = false;
    this.looperBuffer = null;
    this.loopDuration = 0
    this.status = "CLEARED"
  }

  processBlob() {
    this.looperBlob = new Blob(this.chunks, {
      type: "audio/ogg; codecs=opus",
    });

    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      this.finishRecordingAndPlay(fileReader.result)
    };
    fileReader.readAsArrayBuffer(this.looperBlob);
  }

  async setAudioBuffer(arrayBuffer) {
    let audioBuffer = await Node.context.decodeAudioData(arrayBuffer)
    this.looperBuffer = audioBuffer
    this.loopDuration = audioBuffer.duration
    this.loopAvailable = true
    this.status = "STOPPED"
  }

  initInnerNodeAudioParams() {
    this.innerNodeAudioParams = [
      // {
      //   name: 'playbackRate', displayName: 'speed', unit: 'x', //%
      //   minValue: 0, maxValue: 4, value: 1, defaultValue: 1, step: 0.01,
      //   node: this.source, nodeAudioParam: 'playbackRate'
      // },
      // {
      //   name: 'detune', displayName: 'detune', unit: '', //%
      //   minValue: -500, maxValue: 500, value: 0, defaultValue: 0, step: 0.01,
      //   node: this.source, nodeAudioParam: 'detune'
      // },
      {
        name: 'feedback', displayName: 'feedback', unit: '', //%
        minValue: 0, maxValue: 1, value: 1, defaultValue: 1, step: 0.01,
        node: this.feedback, nodeAudioParam: 'gain'
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
}
module.exports = Looper