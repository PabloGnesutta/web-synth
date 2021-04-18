<template>
  <div class="header">
    <div class="buttons">
      <!-- Instruments -->
      <!-- <div class="btn btn-instrument" @click="createInstrument('Justinton')">
        Justinton
      </div> -->
      <div class="btn btn-instrument" @click="createInstrument('Femod')">
        Femod
      </div>
      <div class="btn btn-instrument" @click="createInstrument('Carrier')">
        Oscillator
      </div>
      <div class="btn btn-instrument" @click="createInstrument('WhiteNoise')">
        Noise
      </div>
      <!-- Modulator -->
      <br />
      <div class="btn btn-modulator" @click="createModulator">Modulator</div>
      <!-- Effects -->
      <br />
      <div class="btn btn-effect" @click="createEffect('BiquadFilter')">
        Filter
      </div>
      <div class="btn btn-effect" @click="createEffect('Compressor')">
        Compressor
      </div>
      <div class="btn btn-effect" @click="createEffect('Delay')">Delay</div>
      <div class="btn btn-effect" @click="createEffect('Gain')">Gain</div>
      <div class="btn btn-effect" @click="createEffect('Looper')">Looper</div>
      <!-- REC -->
      <br />
      <div class="btn btn-2 rec" v-if="!recording" @click="startRec">REC</div>
      <div class="btn btn-2 stop-rec" v-if="recording" @click="stopRec">
        STOP
      </div>
      <div class="play-stop" v-if="recordingsAvailable">
        <div v-if="!playing" @click="playExport" class="btn play-recs">
          Play Recording
        </div>
        <div v-if="playing" @click="stopPlayingExport" class="btn stop-playing">
          STOP
        </div>
      </div>
      <div
        class="btn btn-export-download"
        v-if="recordingsAvailable"
        @click="downloadExport"
      >
        Download
      </div>
      <!-- Saved Works -->
      <div class="btn" @click="save">SAVE</div>
      <div
        v-if="this.saves && this.saves.length > 0"
        class="btn load-work"
        @click="showSavedWorks = !showSavedWorks"
      >
        <div>LOAD</div>
        <div class="saved-works" :class="{ hidden: !showSavedWorks }">
          <div :key="s" class="saved-work" v-for="(savedWork, s) in saves">
            <div class="saved-work-name" @click="loadSave(s)">
              {{ savedWork.name }}
            </div>
            <div class="saved-work-delete" @click="deleteSave(s)">X</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showSavedWorks: false,
      saves: [],
    };
  },

  props: ["tracks", "recording", "playing", "recordingsAvailable"],

  mounted() {
    this.saves = JSON.parse(localStorage.getItem("websynth-saves"));
  },

  methods: {
    createInstrument(className) {
      this.$emit("createInstrument", className);
    },
    createEffect(className) {
      this.$emit("createEffect", className);
    },
    createModulator() {
      this.$emit("createModulator");
    },

    startRec() {
      if (this.recording) return;
      this.$emit("startRec");
    },
    stopRec() {
      this.$emit("stopRec");
    },
    playExport() {
      this.$emit("playExport");
    },
    stopPlayingExport() {
      this.$emit("stopPlayingExport");
    },
    downloadExport() {
      this.$emit("downloadExport");
    },

    save() {
      let count = localStorage.getItem("websynth-count");
      if (!count) localStorage.setItem("websynth-count", 0);
      localStorage.setItem("websynth-count", ++count);

      const name = prompt("Saved work name", "My awesome work Nº" + count);
      if (name) {
        if (!this.saves) {
          this.saves = [];
          localStorage.setItem("websynth-saves", JSON.stringify([]));
        }
        this.saves.push({ name, tracks: JSON.stringify(this.tracks) });
        localStorage.setItem("websynth-saves", JSON.stringify(this.saves));
      }
    },

    loadSave(s) {
      const tracks = JSON.parse(this.saves[s].tracks);
      this.$emit("loadSave", tracks);
    },

    deleteSave(s) {
      if (!confirm("Sure you want to delete " + this.saves[s].name + "?"))
        return;
      this.saves.splice(s, 1);
      localStorage.setItem("websynth-saves", JSON.stringify(this.saves));
    },
  },
};
</script>

<style lang="scss" scoped>
.header {
  position: fixed;
  top: 0;
  z-index: 1;
  background: black;
  padding: 0.2em;
  width: 100%;

  .buttons {
    display: flex;
    justify-content: center;
    gap: 1em;
  }

  .btn {
    padding: 0.5em 1em;
    background: gray;
    cursor: pointer;
  }
  .btn-instrument {
    background: var(--color-1);
  }
  .btn-modulator {
    background: var(--color-2);
  }
  .btn-effect {
    background: green;
  }
  .btn.rec {
    background: red;
  }
  .btn.stop-rec {
    background: cyan;
    color: black;
  }

  //saves

  .btn.load-work {
    position: relative;
    cursor: default;
  }

  .saved-works {
    position: absolute;
    bottom: 0;
    right: 0;
    min-width: 170px;
    background: #555;
    transform: translateY(calc(100% + 5px));
  }

  .saved-works.hidden {
    display: none;
  }

  .saved-work {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5em;
    padding: 0 0.4em;

    margin-bottom: 0.5em;
  }
  .saved-work:last-child {
    margin-bottom: 0;
  }
  .saved-work:hover {
    background: #222;
  }

  .saved-work-name {
    cursor: pointer;
    padding: 0.5em;
    flex: 1;
  }

  .saved-work-name:hover {
    background: var(--color-2);
  }

  .saved-work-delete {
    padding: 0.5em;
    cursor: pointer;
  }
  .saved-work-delete:hover {
    background: var(--color-1);
  }
}
</style>