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

    this.comp = Node.context.createDynamicsCompressor()
    this.node = this.comp
    this.initGain(initialGain)
  }

  playLoop() {
    this.status = "PLAYING"
    this.source = Node.context.createBufferSource();
    this.source.buffer = this.looperBuffer;
    this.source.loop = true;

    this.source.connect(this.outputNode);
    this.source.start();
    this.playing = true;

    this.source.onended = () => {
      this.playing = false;
    };
    console.log('playLoop')
    console.log(this.name + " download url:", URL.createObjectURL(this.looperBlob));
  }

  stopLoop() {
    if (this.source) {
      this.source.disconnect()
      this.source.stop();
    }
    this.status = "STOPPED"
    console.log('stopLoop')
  }

  clearLoop() {
    this.stopLoop()
    this.loopAvailable = false;
    this.looperBuffer = null;
    this.status = "CLEARED"
  }

  startRecording() {
    console.log('startRecording')
    this.stopLoop()
    this.status = "RECORDING"
    this.chunks = [];

    this.mediaDestination = Node.context.createMediaStreamDestination();
    this.node.connect(this.mediaDestination);

    this.mediaRecorder = new MediaRecorder(
      this.mediaDestination.stream
    );

    this.mediaRecorder.ondataavailable = (evt) => {
      console.log('ondataav')
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
          this.looperBuffer = audioBuffer
          this.loopAvailable = true
          this.node.disconnect(this.mediaDestination)
          this.playLoop()
        });
      };

      fileReader.readAsArrayBuffer(this.looperBlob);
    };

    this.mediaRecorder.start();
  }

  stopRecording() {
    this.mediaRecorder.stop();
    this.status = "STOPPED"
    console.log('stopRecording')
  }
}
module.exports = Looper