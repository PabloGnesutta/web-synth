<template>
  <div class="Header">
    <div class="header" :class="{ recording, playing }">
      <div
        v-if="menuInstrumentsVisible || menuEffectsVisible || menuConfigVisible"
        class="backdrop"
        @click.self="hideMenues"
      ></div>
      <div v-if="currentSave" class="current-save-name">
        {{ currentSave.name }}
      </div>
      <div class="buttons">
        <!-- Instruments -->
        <div v-if="!recording" class="menu instruments" >
          <div class="btn label" @click="toggleInstrumentsMenu">
            Instrumentos
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
              @click.self="createInstrument('Surgeon')"
              @mouseenter="showSurgeonPresets = true"
              @mouseleave="showSurgeonPresets = false"
            >
              Surgeon
              <div
                class="sub-dropdown"
                :class="{ hidden: !showSurgeonPresets }"
              >
                <div
                  v-for="(preset, p) in surgeonPresets"
                  :key="p"
                  class="sub-dropdown-item"
                  @click.prevent="selectPreset('Surgeon', p)"
                >
                  {{ preset }}
                </div>
              </div>
            </div>
            <div
              class="btn btn-instrument dropdown-item"
              @click.self="createInstrument('Femod')"
              @mouseenter="showFemodPresets = true"
              @mouseleave="showFemodPresets = false"
            >
              Femod
              <div class="sub-dropdown" :class="{ hidden: !showFemodPresets }">
                <div
                  v-for="(preset, p) in femodPresets"
                  :key="p"
                  class="sub-dropdown-item"
                  @click.prevent="selectPreset('Femod', p)"
                >
                  {{ preset }}
                </div>
              </div>
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
          <div class="btn label" @click="toggleEffectsMenu">Efectos</div>
          <div class="dropdown" :class="{ hidden: !menuEffectsVisible }">
            <div class="btn btn-effect" @click="createEffect('Compressor')">
              Compresor
            </div>
            <div class="btn btn-effect" @click="createEffect('Delay')">
              Delay
            </div>
            <div class="btn btn-effect" @click="createEffect('Distortion')">
              Distorción
            </div>
            <div
              class="btn btn-effect dropdown-item"
              @click="createEffect('EQ3')"
            >
              EQ3
            </div>
            <div
              class="btn btn-effect dropdown-item"
              @click.self="createEffect('BiquadFilter')"
              @mouseenter="showFilterPresets = true"
              @mouseleave="showFilterPresets = false"
            >
              Filtro
              <div class="sub-dropdown" :class="{ hidden: !showFilterPresets }">
                <div
                  v-for="(preset, p) in filterPresets"
                  :key="p"
                  class="sub-dropdown-item"
                  @click.prevent="selectPreset('BiquadFilter', p)"
                >
                  {{ preset }}
                </div>
              </div>
            </div>
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
          v-if="!recording && !playing"
          class="btn btn-2 rec"
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
            class="btn start-playing"
            @click="playExport"
          >
            Play
          </div>
          <div
            v-if="playing"
            class="btn stop-playing"
            @click="stopPlayingExport"
          >
            Stop
          </div>
        </div>
        <div
          v-if="recordingsAvailable && !recording"
          class="btn btn-export-download"
          @click="downloadExport"
        >
          Descargar
        </div>

        <!-- SAVES -->
        <div class="saves-buttons" v-if="!recording">
          <div v-if="currentSave" class="btn" @click="save">Guardar</div>
          <div class="btn" @click="saveAs">
            <span v-if="currentSave">Guardar como</span>
            <span v-else>Guardar</span>
          </div>
          <div
            v-if="this.saves && this.saves.length > 0"
            class="btn load-work"
            @click="showSavedWorks = !showSavedWorks"
          >
            <div>Cargar</div>
            <div class="saved-works" :class="{ hidden: !showSavedWorks }">
              <div
                v-for="(savedWork, s) in saveNames"
                :key="s"
                class="saved-work"
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
          <div class="btn label" @click="toggleInfoMenu">INFO</div>
          <div class="dropdown" :class="{ hidden: !menuConfigVisible }">
            <div class="dropdown-item">
              Para agregar un nuevo track, seleccioná un
              <span> instrumento</span>
            </div>
            <div class="dropdown-item">
              Al agregar seleccionar un <span> efecto</span>, éste se agregará
              al track seleccionado
            </div>
            <!-- <div class="dropdown-item">
              0 (zero): <span>Trigger all Loopers</span>
            </div> -->
            <div class="dropdown-item">
              Tocar notas con teclas <span> AWSEDFTGYHUJKOLP</span> o con un
              <span> dispositivo MIDI</span>
            </div>
            <div class="dropdown-item">
              Tocar Drumkit con: <span>teclas 1 a 9 del Numpad</span>
            </div>

            <div class="dropdown-item">z: <span>Subir octava</span></div>
            <div class="dropdown-item">x: <span>Bajar octava</span></div>
            <div class="dropdown-item">
              c: <span>Transponer 1 semitono arriba</span>
            </div>
            <div class="dropdown-item">
              v: <span>Transponer 1 semitono abajo</span>
            </div>

            <div class="dropdown-item">
              Ctrl + m: <span>Silenciar tracl actual</span>
            </div>
            <div class="dropdown-item">
              m + (1..9): <span>Silenciar track 1 a 9</span>
            </div>
            <div class="dropdown-item">
              ctrl + q: <span>Borrar track actual</span>
            </div>

            <div class="dropdown-item">
              Se pueden guardar las sesiones y reanudarlas. Por el momento esta
              funcionalidad es limitada, y sólo se guardan los instrumentos y
              los efectos y sus estados. No así los archivos de audio como loops
              o grabaciones.
            </div>
          </div>
        </div>
        <div class="map" @click="toggleMapping">Map MIDI</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";

export default {
  name: "Header",
  props: ["tracks", "recording", "playing", "recordingsAvailable"],
  data() {
    return {
      menuInstrumentsVisible: false,
      menuEffectsVisible: false,
      menuConfigVisible: false,
      showSavedWorks: false,
      saves: [],
      saveNames: [],
      currentSave: undefined,

      showSurgeonPresets: false,
      showFemodPresets: false,

      surgeonPresets: [],
      femodPresets: [],

      showFilterPresets: false,
      filterPresets: [],
    };
  },

  computed: {
    ...mapGetters(["tempo", "totalBeats"]),
  },

  mounted() {
    this.saves = JSON.parse(localStorage.getItem("websynth-saves"));
    this.saveNames = JSON.parse(localStorage.getItem("websynth-savenames"));

    this.femodPresets = JSON.parse(localStorage.getItem("Femod-presets-names"));
    this.surgeonPresets = JSON.parse(
      localStorage.getItem("Surgeon-presets-names")
    );

    this.filterPresets = JSON.parse(
      localStorage.getItem("BiquadFilter-presets-names")
    );
  },

  methods: {
    ...mapMutations(["setTempo", "setTotalBeats"]),

    toggleMapping() {
      this.$emit("toggleMapping");
    },

    toggleInstrumentsMenu() {
      this.menuConfigVisible = false;
      this.menuEffectsVisible = false;
      this.menuInstrumentsVisible = !this.menuInstrumentsVisible;
    },

    toggleEffectsMenu() {
      this.menuConfigVisible = false;
      this.menuInstrumentsVisible = false;
      this.menuEffectsVisible = !this.menuEffectsVisible;
    },

    toggleInfoMenu() {
      this.menuEffectsVisible = false;
      this.menuInstrumentsVisible = false;
      this.menuConfigVisible = !this.menuConfigVisible;
    },

    hideMenues() {
      this.menuInstrumentsVisible = false;
      this.menuEffectsVisible = false;
      this.menuConfigVisible = false;
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

    //presets

    selectPreset(nodeName, p) {
      const store = localStorage.getItem(nodeName + "-presets");
      const preset = JSON.parse(store)[p];
      const saveString = JSON.parse(preset.saveString);
      this.$emit("loadPreset", saveString);
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
      //qué pasa en caso de primera interacción? count anda?
      let count = localStorage.getItem("websynth-count");

      if (!count) localStorage.setItem("websynth-count", 0);
      localStorage.setItem("websynth-count", ++count);

      const name = prompt("Nombre del trabajo", "Sin título " + count);
      if (!name) return;

      //ver, saves no tiene que estar en memoria, sólo names
      if (!this.saves) {
        this.saves = [];
        this.saveNames = [];

        localStorage.setItem("websynth-saves", "[]");
        localStorage.setItem("websynth-savenames", "[]");
      }

      const existingSaveIndex = this.nameExists(name);
      if (existingSaveIndex !== -1) {
        if (confirm("Ese nombre ya existe, querés sobreescribir?"))
          this.overWrite(existingSaveIndex);
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

      this.tracks.forEach((track) => {
        console.log("track", track.instrument.saveString());
        track.effects.forEach((effect) => {
          console.log("effect", effect);
        });
      });

      // return;

      //la papota
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
      //la papota
      saves[existingSaveIndex].tempo = this.tempo;
      saves[existingSaveIndex].totalBeats = this.totalBeats;
      saves[existingSaveIndex].tracks = JSON.stringify(this.tracks);

      this.updateSaves(saves);

      alert("Trabajo guardado");
      // if (this.currentSaveIndex === existingSaveIndex) alert("Trabajo guardado");
      // else alert("Trabajo sobreescrito");

      this.currentSaveIndex = existingSaveIndex;
      this.currentSave = saves[existingSaveIndex];
    },

    getSaves() {
      return JSON.parse(localStorage.getItem("websynth-saves"));
    },

    updateSaves(saves) {
      this.saves = saves;
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
      if (!confirm("Segur@ que querés borrar " + this.saves[s].name + "?"))
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
}

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

.btn-effect {
  background: green;
}
.btn.rec {
  background: red;
}
.btn.stop-rec {
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
  position: relative;
  padding: 0.5em;
}

.sub-dropdown.hidden {
  display: none;
}

.sub-dropdown {
  position: absolute;
  right: 0;
  top: 0;
  transform: translateX(100%);

  .sub-dropdown-item {
    padding: 0.5em;
    background: rgb(1, 71, 71);
  }

  .sub-dropdown-item:hover {
    background: rgb(2, 51, 51);
  }
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
//MIDI Map
.map {
  cursor: pointer;
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
</style>