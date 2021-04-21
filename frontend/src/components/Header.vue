<template>
  <div class="header">
    <div class="buttons">
      <!-- Instruments -->
      <!-- <div class="btn btn-instrument" @click="createInstrument('Justinton')">
        Justinton
      </div> -->
      <div class="menu instruments">
        <div
          class="btn label"
          @click="showInstrumentsMenu = !showInstrumentsMenu"
        >
          Instruments
        </div>
        <div class="dropdown" :class="{ hidden: !showInstrumentsMenu }">
          <div
            class="btn btn-instrument dropdown-item"
            @click="createInstrument('Femod')"
          >
            Femod
          </div>
          <div
            class="btn btn-instrument dropdown-item"
            @click="createInstrument('Carrier')"
          >
            Oscil
          </div>
          <div
            class="btn btn-instrument dropdown-item"
            @click="createInstrument('Drumkit')"
          >
            Drumkit
          </div>
          <div
            class="btn btn-instrument dropdown-item"
            @click="createInstrument('WhiteNoise')"
          >
            Noise
          </div>
          <div class="btn btn-instrument dropdown-item" @click="createMic()">
            Mic
          </div>
        </div>
      </div>

      <!-- Effects -->
      <div class="btn btn-effect" @click="createEffect('BiquadFilter')">
        Filter
      </div>
      <div class="btn btn-effect" @click="createEffect('EQ3')">EQ3</div>
      <div class="btn btn-effect" @click="createEffect('Reverb')">Reverb</div>
      <div class="btn btn-effect" @click="createEffect('Delay')">Delay</div>
      <div class="btn btn-effect" @click="createEffect('Looper')">Looper</div>
      <div class="btn btn-effect" @click="createEffect('Compressor')">Comp</div>
      <div class="btn btn-effect" @click="createEffect('Gain')">Gain</div>

      <!-- Modulator -->
      <div class="btn btn-modulator" @click="createModulator">Mod</div>

      <!-- REC -->
      <div class="btn btn-2 rec" v-if="!recording" @click="startRec">REC</div>
      <div class="btn btn-2 stop-rec" v-if="recording" @click="stopRec">
        STOP
      </div>

      <!-- PLAY/STOP -->
      <div class="play-stop" v-if="recordingsAvailable">
        <div v-if="!playing" @click="playExport" class="btn play-recs">
          Play REC
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

      <!-- SAVES -->
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

      <!-- Config -->
      <div class="menu config">
        <div class="btn label" @click="showConfigMenu = !showConfigMenu">
          Config
        </div>
        <div class="dropdown" :class="{ hidden: !showConfigMenu }">
          <div class="keystrokes-label">Keystrokes:</div>
          <div class="dropdown-item">Ctrl + m: <span>Mute current</span></div>
          <div class="dropdown-item">
            m + (1..9): <span>Mute track 1-9</span>
          </div>
          <div class="dropdown-item">0 (zero): <span>Trigger Looper</span></div>
          <div class="dropdown-item">ctrl + q: <span>Delete current</span></div>
          <div class="dropdown-item">z: <span>Octave down</span></div>
          <div class="dropdown-item">x: <span>Octave up</span></div>
          <div class="dropdown-item">c: <span>Transpose down</span></div>
          <div class="dropdown-item">v: <span>Transpose up</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
export default {
  data() {
    return {
      showInstrumentsMenu: false,
      showConfigMenu: false,
      showSavedWorks: false,
      saves: [],
    };
  },

  props: ["tracks", "recording", "playing", "recordingsAvailable"],

  computed: {
    ...mapGetters(["tempo", "totalBeats"]),
  },

  mounted() {
    //tener un array aparte en localstorage con sólo los nombres para no cargar en memoria al pedo
    this.saves = JSON.parse(localStorage.getItem("websynth-saves"));
  },

  methods: {
    ...mapMutations(["setTempo", "setTotalBeats"]),

    createInstrument(className) {
      this.$emit("createInstrument", className);
      this.showInstrumentsMenu = false;
    },
    createMic() {
      this.$emit("createMic");
      this.showInstrumentsMenu = false;
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
        this.saves.push({
          name,
          tempo: this.tempo,
          totalBeats: this.totalBeats,
          tracks: JSON.stringify(this.tracks),
        });
        localStorage.setItem("websynth-saves", JSON.stringify(this.saves));
      }
    },

    loadSave(s) {
      const tracks = JSON.parse(this.saves[s].tracks);
      this.$emit("loadSave", tracks);
      this.setTempo(this.saves[s].tempo);
      this.setTotalBeats(this.saves[s].totalBeats);
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

  .menu {
    position: relative;
  }

  .dropdown {
    position: absolute;
    min-width: 150px;
  }

  .dropdown.hidden {
    display: none;
  }

  .dropdown-item {
    padding: 0.5em;
  }

  .menu.instruments {
    .label {
      background: teal;
    }
    .dropdown {
      background: teal;
    }
    .dropdown-item {
      background: var(--color-1);
      margin-bottom: 0.5em;
    }
    .dropdown-item:hover {
      background: var(--color-2);
    }
  }

  .menu.config {
    .label {
    }
    .dropdown {
      right: 0;
      bottom: 0;
      transform: translateY(calc(100% + 5px));
      min-width: 200px;
      background: rgb(255, 83, 83);
      .keystrokes-label {
        padding: 0.5em;
        font-weight: bold;
      }
      span {
        color: black;
      }
    }
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