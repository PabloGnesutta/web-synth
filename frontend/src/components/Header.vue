<template>
  <div class="Header">
    <div class="header" :class="{ recording, playing }">
      <!-- <div v-if="false" class="backdrop" @click.self="hideMenues"></div> -->

      <div v-if="currentSave" class="current-save-name">{{ currentSave.name }}</div>

      <div class="main-container">
        <!-- SAVES -->
        <div class="left">
          <div v-if="currentSave" class="btn" @click="save">Save</div>
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
              <div v-for="(savedWork, s) in saveNames" :key="s" class="saved-work">
                <div class="saved-work-name" @click="loadSave(s)">
                  {{ savedWork.name }}
                </div>
                <div class="saved-work-delete" @click="deleteSave(s)">X</div>
              </div>
            </div>
          </div>
          <div class="btn btn-export-download" @click="downloadExport">Export</div>
          <div class="btn follow" @click="onFollow" :class="{ active: following }">Follow</div>
        </div>

        <div class="mid">
          <!-- PLAY -->
          <div class="btn play" :class="{ active: playing }" @click="onPlay">Play</div>
          <!-- REC -->
          <div class="btn rec" :class="{ active: recording }" @click="onRec">REC</div>
          <!-- STOP -->
          <div class="btn stop" @click="onStop">Stop</div>
        </div>

        <div class="right">
          <div class="map" @click="toggleMapping">Map MIDI</div>
          <div>octave: {{ octave }} | transpose: {{ transpose }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'Header',
  props: ['tracks', 'recording', 'playing', 'following', 'recordingsAvailable', 'octave', 'transpose'],
  data() {
    return {
      saves: [],
      saveNames: [],
      showSavedWorks: false,
      currentSave: undefined,
    };
  },

  computed: {
    // for saving purposes
    ...mapGetters(['tempo', 'totalBeats']),
  },

  mounted() {
    this.saves = JSON.parse(localStorage.getItem('websynth-saves'));
    this.saveNames = JSON.parse(localStorage.getItem('websynth-savenames'));
  },

  methods: {
    ...mapMutations(['setTempo', 'setTotalBeats']),

    toggleMapping() {
      this.$emit('toggleMapping');
    },

    onPlay() {
      this.$emit('onPlay');
    },
    onRec() {
      this.$emit('onRec');
    },
    onStop() {
      this.$emit('onStop');
    },
    onFollow() {
      console.log('on folow');
      this.$emit('onFollow');
    },
    downloadExport() {
      this.$emit('downloadExport');
    },

    save() {
      this.overWrite(this.currentSaveIndex);
    },

    saveAs() {
      //qué pasa en caso de primera interacción? count anda?
      let count = localStorage.getItem('websynth-count');

      if (!count) localStorage.setItem('websynth-count', 0);
      localStorage.setItem('websynth-count', ++count);

      const name = prompt('Nombre del trabajo', 'Sin título ' + count);
      if (!name) return;

      //ver, saves no tiene que estar en memoria, sólo names
      if (!this.saves) {
        this.saves = [];
        this.saveNames = [];

        localStorage.setItem('websynth-saves', '[]');
        localStorage.setItem('websynth-savenames', '[]');
      }

      const existingSaveIndex = this.nameExists(name);
      if (existingSaveIndex !== -1) {
        if (confirm('Ese nombre ya existe, querés sobreescribir?')) this.overWrite(existingSaveIndex);
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

      this.tracks.forEach(track => {
        console.log('track', track.instrument.saveString());
        track.effects.forEach(effect => {
          console.log('effect', effect);
        });
      });

      //la papota
      saves.push({
        id: count,
        name,
        tempo: this.tempo,
        totalBeats: this.totalBeats,
        tracks: JSON.stringify(this.tracks),
      });

      this.updateSaves(saves);

      localStorage.setItem('websynth-savenames', JSON.stringify(this.saveNames));

      this.currentSaveIndex = this.saveNames.length - 1;
      this.currentSave = this.saveNames[this.currentSaveIndex];
      alert('New work saved');
    },

    overWrite(existingSaveIndex) {
      const saves = this.getSaves();
      //la papota
      saves[existingSaveIndex].tempo = this.tempo;
      saves[existingSaveIndex].totalBeats = this.totalBeats;
      saves[existingSaveIndex].tracks = JSON.stringify(this.tracks);

      this.updateSaves(saves);

      alert('Trabajo guardado');
      // if (this.currentSaveIndex === existingSaveIndex) alert("Trabajo guardado");
      // else alert("Trabajo sobreescrito");

      this.currentSaveIndex = existingSaveIndex;
      this.currentSave = saves[existingSaveIndex];
    },

    getSaves() {
      return JSON.parse(localStorage.getItem('websynth-saves'));
    },

    updateSaves(saves) {
      this.saves = saves;
      localStorage.setItem('websynth-saves', JSON.stringify(saves));
    },

    loadSave(s) {
      // if (!confirm('Load ' + this.saveNames[s].name + '? Unsaved changes will be lost.')) return

      const tracks = JSON.parse(this.saves[s].tracks);
      this.$emit('loadSave', tracks);
      this.setTempo(this.saves[s].tempo);
      this.setTotalBeats(this.saves[s].totalBeats);
      this.currentSaveIndex = s;
      this.currentSave = this.saveNames[s];
    },

    deleteSave(s) {
      if (!confirm('Segur@ que querés borrar ' + this.saves[s].name + '?')) return;
      this.saves.splice(s, 1);
      this.saveNames.splice(s, 1);
      localStorage.setItem('websynth-saves', JSON.stringify(this.saves));
      localStorage.setItem('websynth-savenames', JSON.stringify(this.saveNames));
    },

    nameExists(name) {
      return this.saveNames.findIndex(sv => sv.name === name);
    },
  },
};
</script>

<style lang="scss" scoped>
.header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #222;
  padding: 0.4em;
  width: 100%;
  gap: 0.5em;
  border: 3px solid transparent;
}
.header.playing {
  border-color: green;
}
.header.recording {
  border-color: crimson;
}
.main-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1em;
}
.left {
  width: 340px;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.mid {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 1rem;
}
.right {
  display: flex;
  width: 240px;
}

.btn {
  padding: 0.4em 1em;
  background: gray;
  cursor: pointer;
}

.btn.play {
  background: #004b80;
}
.btn.play.active {
  background: rgb(13, 247, 13);
}

.btn.follow {
  background: rgb(92, 92, 255);
}
.btn.follow.active {
  background: rgb(22, 22, 199);
}

.btn.rec.active {
  background: red;
}

.btn.stop {
  background: #004b80;
}

//MIDI Map
.map {
  cursor: pointer;
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

// .backdrop {
//   position: fixed;
//   top: var(--top-section-height);
//   left: 0;
//   width: 100%;
//   height: calc(100vh - var(--top-section-height));
//   background: transparent;
// }
</style>