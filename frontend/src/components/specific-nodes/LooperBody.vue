<template>
  <div class="LooperBody">
    <div class="loop-controls">
      <div class="status">
        {{ Node.status }}
      </div>
      <div class="control-btns params-container">
        <div
          v-if="!Node.recording && Node.playing"
          class="control-btn rec-btn"
          @click="scheduleLoopStartRecording"
        >
          OVERDUB
        </div>
        <div
          v-if="!Node.recording && !Node.playing && !Node.loopAvailable"
          class="control-btn rec-btn"
          @click="scheduleLoopStartRecording"
        >
          REC
        </div>
        <div
          v-if="Node.recording"
          class="control-btn stop-rec"
          @click="scheduleLoopStopRecording"
        >
          PLAY
        </div>
        <div
          v-if="Node.status === 'PLAYING' && !Node.recording"
          class="control-btn pause-loop"
          @click="stopLoop"
        >
          PAUSE
        </div>
        <div
          v-if="Node.loopAvailable && !Node.playing && !Node.recording"
          class="control-btn play-loop"
          @click="startLoop"
        >
          PLAY
        </div>
        <div
          v-if="Node.loopAvailable && Node.status === 'STOPPED'"
          class="control-btn clear-btn"
          @click="clearLoop"
        >
          CLEAR
        </div>
      </div>
      <!-- Upload -->

      <div class="upload-loop">
        <div class="label">{{ loopFileName || "Load Loop" }}</div>
        <input type="file" @change="loadLoopBuffer" />
      </div>
      <div class="download-loop">
        <span v-if="Node.loopAvailable" class="label" @click="downloadLoop">
          Download
        </span>
        <span v-else class="invisible">.</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import Knob from "../Knob";
export default {
  name: "LooperBody",
  components: { Knob },
  props: ["Node"],

  data() {
    return {
      loopFileName: "",
    };
  },

  computed: {
    ...mapGetters([
      "context",
      "tempo",
      "totalBeats",
      "currentBeat",
      "nextBeatTime",
      "secondsPerBeat",
    ]),
  },

  mounted() {
    window.addEventListener("keyup", this.processLoopKeyup);
  },

  methods: {
    scheduleLoopStartRecording() {
      const beatsRemainingTo1 = this.totalBeats - this.currentBeat;
      const nextBeatTime =
        this.nextBeatTime + beatsRemainingTo1 * this.secondsPerBeat;

      this.Node.startRecording(nextBeatTime);
    },

    scheduleLoopStopRecording() {
      const beatsRemainingTo1 = this.totalBeats - this.currentBeat;
      const nextBeatTime =
        this.nextBeatTime + beatsRemainingTo1 * this.secondsPerBeat;

      // this.Node.nextBeatTime = nextBeatTime;
      this.Node.stopRecording(nextBeatTime);
    },

    startLoop() {
      this.Node.startLoop(this.nextBeatTime);
    },
    stopLoop() {
      this.Node.stopLoop();
    },
    clearLoop() {
      this.Node.clearLoop();
    },

    downloadLoop() {
      const a = document.createElement("a");
      let fileName = "New Loop - " + this.tempo + "bpm";
      fileName = prompt("File name: ", fileName);
      if (!fileName) return;
      a.setAttribute("href", URL.createObjectURL(this.Node.looperBlob));
      a.setAttribute("download", fileName);
      a.click();
    },

    loadLoopBuffer(e) {
      const file = e.target.files[0];
      this.loopFileName = file.name;

      const fileReader = new FileReader();

      fileReader.onloadend = () => {
        const arrayBuffer = fileReader.result;
        this.Node.setAudioBuffer(arrayBuffer);
        // this.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
        //   this.Node.setAudioBuffer(audioBuffer);
        // });
      };

      fileReader.readAsArrayBuffer(file);
    },

    processLoopKeyup(e) {
      if (e.keyCode != 48) return; //0 key
      switch (this.Node.status) {
        case "CLEARED":
          this.scheduleLoopStartRecording();
          break;
        case "RECORDING":
          this.scheduleLoopStopRecording();
          break;
        case "PLAYING":
          this.stopLoop();
          break;
        case "STOPPED":
          this.startLoop();
          break;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.status {
  margin-bottom: 0.4em;
  color: lightgreen;
}

.control-btns {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.5em;
  min-height: 70px;
}
.control-btn {
  padding: 0.4em;
  min-width: 60px;
  cursor: pointer;
  background: var(--color-1);
  &.rec-btn {
    background: crimson;
  }
  &.clear-btn {
    background: black;
  }
}
.upload-loop {
  margin-top: 0.5em;
  width: 100%;
  background: #222;
  position: relative;
  .label {
    padding: 0.3em;
    // width: 200px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  input {
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

.upload-loop:hover {
  background: var(--color-1);
}

.download-loop {
  margin-top: 0.2em;
  .label {
    cursor: default;
    user-select: none;
    color: #bbb;
    padding: 0.2em;
  }
  .label:hover {
    color: var(--color-2);
  }
}
</style>