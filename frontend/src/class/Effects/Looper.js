const Node = require("../Node");

const initialGain = 1;

class Looper extends Node {
  static looperCount = 0

  constructor(name) {
    super(initialGain)

    this.name = name || "Looper " + ++Looper.looperCount
    this.nodeType = "Looper"
    this.nodeRol = "Effect"

    this.status = "CLEARED"
    this.recording = false
    this.playing = false

    this.loopAvailable = false
    this.looperBuffer = null
    this.looperBlob = null
    this.loopDuration = 0;

    this.nextBeatTime = 0;
    this.source = Node.context.createBufferSource();

    this.inputNode.connect(this.outputNode)

    this.initInnerNodeAudioParams()
  }

  playLoop(startAt) {
    this.status = "PLAYING"
    this.source = Node.context.createBufferSource();
    // this.initInnerNodeAudioParams()
    this.source.buffer = this.looperBuffer;
    this.source.playbackRate.value = this.innerNodeAudioParams[0].value

    //sobregraba
    this.source.connect(this.inputNode);
    this.source.start(startAt || 0);
    this.playing = true;

    this.source.onended = () => {
      if (this.status !== 'STOPPED' && this.status !== 'CLEARED')
        this.playLoop(Node.nextBeatTime)
    };
  }

  stopLoop() {
    if (this.source) {
      this.source.disconnect()
      this.source.stop()
      this.source.onended = null
    }
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

  startRecording(nextBeatTime) {
    // this.stopLoop()
    this.status = "STARTING"
    this.nextBeatTime = nextBeatTime
    this.chunks = [];

    this.mediaDestination = Node.context.createMediaStreamDestination();
    this.inputNode.connect(this.mediaDestination);

    this.mediaRecorder = new MediaRecorder(
      this.mediaDestination.stream
    );

    this.mediaRecorder.ondataavailable = (evt) => {
      this.chunks.push(evt.data);
    };

    this.mediaRecorder.onstop = () => {
      this.looperBlob = new Blob(this.chunks, {
        type: "audio/ogg; codecs=opus",
      });
      const fileReader = new FileReader();

      fileReader.onloadend = () => {
        const arrayBuffer = fileReader.result;

        Node.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
          this.setAudioBuffer(audioBuffer)
          this.inputNode.disconnect(this.mediaDestination)
          if (this.playing) this.stopLoop()
          this.playLoop(this.nextBeatTime)
          // this.playLoop(0)
        });
      };

      fileReader.readAsArrayBuffer(this.looperBlob);
    };

    this.startMediaRecorder()

  }

  startMediaRecorder() {
    const req = window.requestAnimationFrame(this.startMediaRecorder.bind(this));
    if (Node.context.currentTime >= this.nextBeatTime) {
      this.mediaRecorder.start();
      window.cancelAnimationFrame(req)
      this.recording = true
      this.status = "RECORDING"
      console.log('startRecording')
      this.nextBeatTime = 0
    }
  }

  setAudioBuffer(audioBuffer) {
    this.looperBuffer = audioBuffer
    this.loopDuration = audioBuffer.duration
    this.loopAvailable = true
    this.status = "STOPPED"
  }

  stopRecording(nextBeatTime) {
    this.nextBeatTime = nextBeatTime;
    // const req = window.requestAnimationFrame(this.stopRecording.bind(this));
    // if (Node.context.currentTime >= this.nextBeatTime) {
    // window.cancelAnimationFrame(req)
    this.mediaRecorder.stop();
    this.recording = false
    this.status = "STOPPED"
    console.log('stopREcording')
    // this.nextBeatTime = 0
    // }
  }

  initInnerNodeAudioParams() {
    this.innerNodeAudioParams = [
      {
        name: 'playbackRate', displayName: 'speed', unit: '', //%
        minValue: 0, maxValue: 4, value: 1, defaultValue: 1, step: 0.01,
        node: this.source, nodeAudioParam: 'playbackRate'
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