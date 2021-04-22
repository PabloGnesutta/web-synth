<template>
  <div class="LooperBody">
    <div class="loop-controls">
      <div class="control-btns params-container">
        <div
          class="control-btn start-rec"
          @click="scheduleLoopStartRecording"
          v-if="!Node.recording"
        >
          REC
        </div>
        <div
          class="control-btn stop-rec"
          @click="scheduleLoopStopRecording"
          v-if="Node.recording"
        >
          LOOP
        </div>
        <div
          class="control-btn pause-loop"
          @click="stopLoop"
          v-if="Node.status === 'PLAYING'"
        >
          STOP
        </div>
        <div
          class="control-btn play-loop"
          @click="playLoop"
          v-if="Node.loopAvailable && Node.status === 'STOPPED'"
        >
          PLAY
        </div>
        <div class="control-btn" v-if="Node.status === 'STARTING'">
          STARTING
        </div>
        <div
          class="control-btn clear-loop"
          @click="clearLoop"
          v-if="Node.loopAvailable"
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
        <span class="label" v-if="Node.looperBlob" @click="downloadLoop">
          Download
        </span>
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

    playLoop() {
      this.Node.playLoop(this.nextBeatTime);
    },
    stopLoop() {
      this.Node.stopLoop();
    },
    clearLoop() {
      this.Node.clearLoop();
    },

    downloadLoop() {
      const a = document.createElement("a");
      let fileName = "websynth-loop-" + new Date().toLocaleString("es-AR");
      fileName = prompt("Loop name: ", fileName);
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
          this.clearLoop();
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
.control-btns {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  min-height: 73px;
}
.control-btn {
  padding: 0.4em;
  min-width: 60px;
  cursor: pointer;
  background: var(--color-1);
}
.upload-loop {
  margin-top: 0.5em;
  width: 100%;
  background: #111;
  position: relative;
  .label {
    padding: 0.6em;
    width: 200px;
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

    // z-index: 10;
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