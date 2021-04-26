<template>
  <div class="LooperBody">
    <div class="loop-controls">
      <div class="status">
        {{ Node.status }}
      </div>
      <div class="control-btns params-container">
        <div
          class="control-btn rec-btn"
          @click="scheduleLoopStartRecording"
          v-if="!Node.recording && Node.playing"
        >
          OVERDUB
        </div>
        <div
          class="control-btn rec-btn"
          @click="scheduleLoopStartRecording"
          v-if="!Node.recording && !Node.playing && !Node.loopAvailable"
        >
          REC
        </div>
        <div
          class="control-btn stop-rec"
          @click="scheduleLoopStopRecording"
          v-if="Node.recording"
        >
          PLAY
        </div>
        <div
          class="control-btn pause-loop"
          @click="stopLoop"
          v-if="Node.status === 'PLAYING' && !Node.recording"
        >
          PAUSE
        </div>
        <div
          class="control-btn play-loop"
          @click="startLoop"
          v-if="Node.loopAvailable && !Node.playing && !Node.recording"
        >
          PLAY
        </div>
        <div
          class="control-btn clear-btn"
          @click="clearLoop"
          v-if="Node.loopAvailable && Node.status === 'STOPPED'"
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
        <span class="label" v-if="Node.loopAvailable" @click="downloadLoop">
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
  data() {
    return {
      loopFileName: "",
    };
  },

  props: ["Node"],

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

        this.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
          this.Node.setAudioBuffer(audioBuffer);
        });
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

  components: {
    Knob,
  },
};
</script>

<style lang="scss" scoped>
.status {
  // background: #777;
  // padding: .2em 0;
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