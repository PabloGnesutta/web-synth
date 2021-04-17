const Node = require("../Node");

const initialGain = 1;

class Looper extends Node {
  static looperCount = 0

  constructor(name) {
    super()

    this.name = name || "Looper " + ++Looper.looperCount
    this.nodeType = "Looper"
    this.nodeRol = "Effect"

    this.status = "CLEARED"

    this.loopAvailable = false
    this.looperBuffer = null
    this.looperBlob = null
    this.loopDuration = 0;
    this.nextBeatTime = 0;

    this.node = Node.context.createGain()
    this.initGain(initialGain)
  }

  playLoop(nextBeatTime) {
    this.status = "PLAYING"
    this.source = Node.context.createBufferSource();
    this.loopDuration = this.looperBuffer.duration
    this.source.buffer = this.looperBuffer;

    this.source.connect(this.outputNode);
    this.source.start(nextBeatTime || 0);
    this.playing = true;

    this.source.onended = () => {
      if (this.status !== 'STOPPED' && this.status !== 'CLEARED')
        this.playLoop(Node.nextBeatTime)
    };
  }

  stopLoop() {
    if (this.source) {
      this.source.disconnect()
      this.source.stop();
    }
    this.status = "STOPPED"
  }

  clearLoop() {
    this.stopLoop()
    this.loopAvailable = false;
    this.looperBuffer = null;
    this.status = "CLEARED"
  }

  startRecording() {
    this.stopLoop()
    this.status = "STARTING"

    this.chunks = [];

    this.mediaDestination = Node.context.createMediaStreamDestination();
    this.node.connect(this.mediaDestination);

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
          this.node.disconnect(this.mediaDestination)
          this.playLoop(Node.nextBeatTime)
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
      this.status = "RECORDING"
      console.log('startRecording')
      this.nextBeatTime = 0
    }
  }

  setAudioBuffer(audioBuffer) {
    this.looperBuffer = audioBuffer
    this.loopAvailable = true
    this.status = "STOPPED"
  }

  stopRecording() {
    // const req = window.requestAnimationFrame(this.stopRecording.bind(this));
    // if (Node.context.currentTime >= this.nextBeatTime) {
    // window.cancelAnimationFrame(req)
    this.mediaRecorder.stop();
    this.status = "STOPPED"
    console.log('stopREcording')
    // this.nextBeatTime = 0
    // }
  }
}
module.exports = Looper