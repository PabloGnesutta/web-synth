<template>
  <div class="Header">
    <div class="header" :class="{ recording, playing }">
      <div
        class="backdrop"
        @click.self="hideMenues"
        v-if="menuInstrumentsVisible || menuEffectsVisible"
      ></div>
      <div v-if="currentSave" class="current-save-name">
        {{ currentSave.name }}
      </div>
      <div class="buttons">
        <!-- Instruments -->
        <div class="menu instruments" v-if="!recording">
          <div class="btn label" @click="toggleInstrumentsMenu">
            Instruments
          </div>
          <div class="dropdown" :class="{ hidden: !menuInstrumentsVisible }">
            <div
              class="btn btn-instrument dropdown-item"
              @click="createInstrument('Drumkit')"
            >
              Drumkit
            </div>
            <div
              class="btn btn-instrument dropdown-item"
              @click="createInstrument('Surgeon')"
            >
              Surgeon
            </div>
            <div
              class="btn btn-instrument dropdown-item"
              @click="createInstrument('Femod')"
            >
              Femod
            </div>
            <div class="btn btn-instrument dropdown-item" @click="createMic()">
              Mic
            </div>
            <div
              class="btn btn-instrument dropdown-item"
              @click="createInstrument('WhiteNoise')"
            >
              Noise
            </div>
            <div
              class="btn btn-instrument dropdown-item"
              @click="createInstrument('Carrier')"
            >
              Oscil
            </div>
            <div
              class="btn btn-instrument dropdown-item"
              @click="createInstrument('Sampler')"
            >
              Sampler
            </div>
          </div>
        </div>

        <!-- Effects -->
        <div class="menu effects">
          <div class="btn label" @click="toggleEffectsMenu">Effects</div>
          <div class="dropdown" :class="{ hidden: !menuEffectsVisible }">
            <div class="btn btn-effect" @click="createEffect('BiquadFilter')">
              Filter
            </div>
            <div class="btn btn-effect" @click="createEffect('Compressor')">
              Comp
            </div>
            <div class="btn btn-effect" @click="createEffect('Delay')">
              Delay
            </div>
            <div class="btn btn-effect" @click="createEffect('EQ3')">EQ3</div>
            <div class="btn btn-effect" @click="createEffect('Looper')">
              Looper
            </div>
            <div class="btn btn-effect" @click="createEffect('Reverb')">
              Reverb
            </div>
            <!-- <div class="btn btn-effect" @click="createEffect('Gain')">Gain</div> -->
            <!-- Modulator -->
            <!-- <div class="btn btn-modulator" @click="createModulator">Mod</div> -->
          </div>
        </div>

        <!-- REC -->
        <div
          class="btn btn-2 rec"
          v-if="!recording && !playing"
          @click="startRec"
        >
          REC
        </div>
        <div class="btn btn-2 stop-rec" v-if="recording" @click="stopRec">
          STOP REC
        </div>

        <!-- PLAY/STOP -->
        <div class="play-stop" v-if="recordingsAvailable">
          <div
            v-if="!playing && !recording"
            @click="playExport"
            class="btn start-playing"
          >
            Play
          </div>
          <div
            v-if="playing"
            @click="stopPlayingExport"
            class="btn stop-playing"
          >
            Stop
          </div>
        </div>
        <div
          class="btn btn-export-download"
          v-if="recordingsAvailable && !recording"
          @click="downloadExport"
        >
          DOWNLOAD
        </div>

        <!-- SAVES -->
        <div class="saves-buttons" v-if="!recording">
          <div class="btn" v-if="currentSave" @click="save">Save</div>
          <div class="btn" @click="saveAs">
            <span v-if="currentSave">Save as</span>
            <span v-else>Save</span>
          </div>
          <div
            v-if="this.saves && this.saves.length > 0"
            class="btn load-work"
            @click="showSavedWorks = !showSavedWorks"
          >
            <div>Load</div>
            <div class="saved-works" :class="{ hidden: !showSavedWorks }">
              <div
                :key="s"
                class="saved-work"
                v-for="(savedWork, s) in saveNames"
              >
                <div class="saved-work-name" @click="loadSave(s)">
                  {{ savedWork.name }}
                </div>
                <div class="saved-work-delete" @click="deleteSave(s)">X</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Config -->
        <div class="menu config">
          <div class="btn label" @click="showConfigMenu = !showConfigMenu">
            INFO
          </div>
          <div class="dropdown" :class="{ hidden: !showConfigMenu }">
            <div class="keystrokes-label">Keystrokes:</div>
            <div class="dropdown-item">
              Ctrl + m: <span>Mute current track</span>
            </div>
            <div class="dropdown-item">
              m + (1..9): <span>Mute track 1 to 9</span>
            </div>
            <div class="dropdown-item">
              ctrl + q: <span>Delete current track</span>
            </div>
            <div class="dropdown-item">z: <span>Octave down</span></div>
            <div class="dropdown-item">x: <span>Octave up</span></div>
            <div class="dropdown-item">c: <span>Transpose down</span></div>
            <div class="dropdown-item">v: <span>Transpose up</span></div>
            <div class="dropdown-item">
              0 (zero): <span>Trigger all Loopers</span>
            </div>
            <div class="dropdown-item">
              Play notes with: <span> AWSEDFTGYHUJKOLP</span>
            </div>
            <div class="dropdown-item">
              Play Drumkit with: <span>numpad keys</span>
            </div>
          </div>
        </div>
        <div class="map" @click="toggleMapping">MAP</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
export default {
  data() {
    return {
      menuInstrumentsVisible: false,
      menuEffectsVisible: false,
      showConfigMenu: false,
      showSavedWorks: false,
      saves: [],
      saveNames: [],
      currentSave: undefined,
    };
  },

  props: ["tracks", "recording", "playing", "recordingsAvailable"],

  computed: {
    ...mapGetters(["tempo", "totalBeats"]),
  },

  mounted() {
    this.saves = JSON.parse(localStorage.getItem("websynth-saves"));
    this.saveNames = JSON.parse(localStorage.getItem("websynth-savenames"));
  },

  methods: {
    ...mapMutations(["setTempo", "setTotalBeats"]),

    toggleMapping() {
      this.$emit("toggleMapping");
    },

    toggleInstrumentsMenu() {
      this.menuInstrumentsVisible = !this.menuInstrumentsVisible;
      this.menuEffectsVisible = false;
    },

    toggleEffectsMenu() {
      this.menuInstrumentsVisible = false;
      this.menuEffectsVisible = !this.menuEffectsVisible;
    },

    hideMenues() {
      this.menuInstrumentsVisible = false;
      this.menuEffectsVisible = false;
    },

    createInstrument(className) {
      this.$emit("createInstrument", className);
      this.menuInstrumentsVisible = false;
    },
    createMic() {
      this.$emit("createMic");
      this.menuInstrumentsVisible = false;
    },
    createEffect(className) {
      this.$emit("createEffect", className);
      this.menuEffectsVisible = false;
    },
    createModulator() {
      this.$emit("createModulator");
      this.menuEffectsVisible = false;
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
      this.overWrite(this.currentSaveIndex);
    },

    saveAs() {
      let count = localStorage.getItem("websynth-count");
      if (!count) localStorage.setItem("websynth-count", 0);
      localStorage.setItem("websynth-count", ++count);

      const name = prompt("Save Name", "Untitled " + count);
      if (!name) return;

      if (!this.saves) {
        this.saves = [];
        this.saveNames = [];

        localStorage.setItem("websynth-saves", "[]");
        localStorage.setItem("websynth-savenames", "[]");
      }

      const existingSaveIndex = this.nameExists(name);
      if (existingSaveIndex !== -1) {
        if (!confirm("That name already exists, wanna overwrite?")) return;
        else this.overWrite(existingSaveIndex);
      } else {
        this.saveNew(count, name);
      }
    },

    saveNew(count, name) {
      this.saveNames.push({
        id: count,
        name,
      });

      const saves = this.getSaves();

      saves.push({
        id: count,
        name,
        tempo: this.tempo,
        totalBeats: this.totalBeats,
        tracks: JSON.stringify(this.tracks),
      });

      this.updateSaves(saves);

      localStorage.setItem(
        "websynth-savenames",
        JSON.stringify(this.saveNames)
      );

      this.currentSaveIndex = this.saveNames.length - 1;
      this.currentSave = this.saveNames[this.currentSaveIndex];
      alert("New work saved");
    },

    overWrite(existingSaveIndex) {
      const saves = this.getSaves();
      saves[existingSaveIndex].tempo = this.tempo;
      saves[existingSaveIndex].totalBeats = this.totalBeats;
      saves[existingSaveIndex].tracks = JSON.stringify(this.tracks);
      this.updateSaves(saves);

      if (this.currentSaveIndex === existingSaveIndex) alert("Work saved");
      else alert("Work overwritten");

      this.currentSaveIndex = existingSaveIndex;
      this.currentSave = saves[existingSaveIndex];
    },

    getSaves() {
      return JSON.parse(localStorage.getItem("websynth-saves"));
    },
    
    updateSaves(saves) {
      localStorage.setItem("websynth-saves", JSON.stringify(saves));
    },

    loadSave(s) {
      // if (!confirm('Load ' + this.saveNames[s].name + '? Unsaved changes will be lost.')) return
      const tracks = JSON.parse(this.saves[s].tracks);
      this.$emit("loadSave", tracks);
      this.setTempo(this.saves[s].tempo);
      this.setTotalBeats(this.saves[s].totalBeats);
      this.currentSaveIndex = s;
      this.currentSave = this.saveNames[s];
    },

    deleteSave(s) {
      if (!confirm("Sure you want to delete " + this.saves[s].name + "?"))
        return;
      this.saves.splice(s, 1);
      this.saveNames.splice(s, 1);
      localStorage.setItem("websynth-saves", JSON.stringify(this.saves));
      localStorage.setItem(
        "websynth-savenames",
        JSON.stringify(this.saveNames)
      );
    },

    nameExists(name) {
      return this.saveNames.findIndex((sv) => sv.name === name);
    },
  },
};
</script>

<style lang="scss" scoped>
.backdrop {
  position: absolute;
  top: var(--header-height);
  left: 0;
  width: 100%;
  height: calc(100vh - var(--header-height));
  background: transparent;
}
.header.recording {
  border-color: crimson;
}
.header.playing {
  border-color: green;
}

.header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: black;
  padding: 0.4em;
  width: 100%;
  gap: 0.5em;
  border: 3px solid transparent;

  .buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1em;
  }

  .btn {
    padding: 0.4em 1em;
    background: gray;
    cursor: pointer;
  }

  .btn-modulator {
    background: cyan;
  }
  .btn-effect {
    background: green;
  }
  .btn.rec {
    background: red;
  }
  .btn.stop-rec {
    // background: cyan;
    background: red;
    color: black;
  }

  .menu {
    position: relative;
  }

  .dropdown {
    position: absolute;
    z-index: 10;
    min-width: 150px;
  }

  .dropdown.hidden {
    display: none;
  }

  .dropdown-item {
    padding: 0.5em;
  }

  .instruments {
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
  }

  .effects {
    .label {
      background: green;
    }
  }

  .btn-effect:hover,
  .btn-instrument:hover,
  .btn-modulator:hover {
    background: var(--color-2);
  }

  .menu.config {
    .dropdown {
      right: 0;
      bottom: 0;
      transform: translateY(calc(100% + 5px));
      min-width: 250px;
      background: rgb(255, 83, 83);
      .keystrokes-label {
        padding: 0.5em;
        font-weight: bold;
      }
      span {
        color: #333;
      }
    }
  }

  //Play/Stop recording

  .play-stop {
    .btn {
      background: #004b80;
    }
  }

  //saves

  .saves-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1em;
  }

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