<template>
  <div class="Header" @click="$emit('onFocus', 'header')">
    <div class="header" :class="{ recording: appState.recording, playing: appState.playing }">
      <div class="main-container">
        <!-- SAVES -->
        <div class="left">
          <div class="file-menu" :class="{ active: fileMenuOpen }" @mouseleave="onFileMenuLeave">
            <div class="menu-btn" @click="fileMenuOpen = true" @mouseenter="fileMenuOpen = true">File</div>
            <div v-if="fileMenuOpen" class="menu">
              <div class="menu-item" @click="onNew">New</div>
              <div class="menu-item" @click="onSave">Save</div>
              <div v-if="projectId" class="menu-item" @click="onSaveAs">Save as</div>
              <div class="has-submenu" @mouseenter="loadMenuOpen = true" @mouseleave="loadMenuOpen = false">
                <div class="menu-item" :class="{ active: loadMenuOpen }">Open</div>
                <div v-if="loadMenuOpen" class="sub-menu">
                  <div v-for="(project, key) in projects" :key="key" class="menu-item"
                    @click="onLoad(key, project.name)">
                    {{ project.name }}
                  </div>
                </div>
              </div>
              <div v-if="lastSample" class="menu-item" @click="onExport">Export</div>
            </div>
          </div>
          <div v-if="projectName" class="current-save-name">
            [{{ projectId }}] {{ projectName }}
            <span v-if="appState.unsaved">[*]</span>
          </div>
          <div v-if="fileMenuOpen" class="backdrop" @click="fileMenuOpen = false"></div>
        </div>

        <div class="mid">
          <!-- PLAY -->
          <div class="playback-btn play" :class="{ active: appState.playing }" @click="onPlay">
            <PlayIcon />
          </div>
          <!-- REC -->
          <div class="playback-btn rec" :class="{ active: appState.recording }" @click="onRec">
            <RecIcon :active="appState.recording" />
          </div>
          <!-- STOP -->
          <div class="playback-btn stop" @click="onStop">
            <StopIcon />
          </div>
          <!-- Follow -->
        </div>

        <div class="right">
          <div class="btn follow" :class="{ active: appState.followCursor }" @click="onFollow">Follow</div>
          <div class="btn midi" :class="{ active: midiState.mapping }" @click="onMidiMap">Map MIDI</div>
          <div class="select-none">octave: {{ appState.octave }} | transpose: {{ appState.transpose }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

import PlayIcon from '@/components/icons/PlayIcon';
import StopIcon from '@/components/icons/StopIcon';
import RecIcon from '@/components/icons/RecIcon';

import { appState, midiState } from '../state/vueInstance.js';
import { onMidiMap } from '../functions/midi.js';
import { triggerExport } from '../functions/exports.js';
import { loadProject, saveProject } from '../functions/load-save.js';
import { onStopBtnClick, togglePlay, toggleRecord } from '../functions/playback.js';

export default {
  name: 'Header',
  components: { PlayIcon, RecIcon, StopIcon },
  props: [
    'lastSample',
    'projects',
    'projectName',
    'projectId',
  ],
  data() {
    return {
      appState,
      midiState,

      saves: [],
      saveNames: [],
      showSavedWorks: false,
      currentSave: undefined,
      fileMenuOpen: false,
      loadMenuOpen: false,
    };
  },

  mounted() {
    this.saves = JSON.parse(localStorage.getItem('websynth-saves'));
    this.saveNames = JSON.parse(localStorage.getItem('websynth-savenames'));
  },

  methods: {
    ...mapMutations(['setTempo', 'setTotalBeats']),

    onFileMenuLeave() {
      this.fileMenuOpen = false;
    },

    onPlay: togglePlay,
    onRec: toggleRecord,
    onStop: onStopBtnClick,

    onMidiMap: onMidiMap,
    onLoad: loadProject,

    onNew() {
      this.$emit('onNew');
    },
    onSave() {
      let newProjectName = undefined;
      if (appState.isNew) {
        newProjectName = prompt('Project name', 'WebDaw Project');
        if (!newProjectName) {
          return;
        }
        if (this.nameExists(newProjectName)) {
          return alert('Name already exists');
        }
      }

      saveProject(newProjectName);
    },

    onSaveAs() {
      const newProjectName = prompt('Project name', this.projectName);
      if (newProjectName === this.projectName) {
        this.onSave();
      } else {
        if (this.nameExists(newProjectName)) {
          return alert('exists');
        }

        saveProject(newProjectName);
      }
    },

    onExport() {
      if (appState.exporting || appState.recording || !this.lastSample) {
        return;
      }
      triggerExport();
    },

    deleteSave() {
      console.log('Delete save not implemented');
    },

    onFollow() {
      appState.followCursor = !appState.followCursor;
    },

    nameExists(projectName) {
      for (const id in this.projects) {
        if (this.projects[id].name.toLowerCase() === projectName.toLowerCase()) {
          return true;
        }
      }
      return false;
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
  border-top: 3px solid #111;
  border-bottom: 3px solid #111;
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

.btn {
  padding: 0.4em 1em;
  cursor: pointer;
  user-select: none;
}

// Left Section
.left {
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 1rem;
}

// File Menu
.file-menu {
  position: relative;
  z-index: 1;
}

.file-menu.active {
  color: teal;
}

.menu {
  position: fixed;
  top: 42px;
  min-width: 40px;
  background: white;
}

.menu-btn {
  padding: 0.5rem 4rem 0.5rem 1rem;
  user-select: none;
}

.menu-item {
  padding: 0.5rem 2rem 0.5rem 1rem;
  color: #222;
  user-select: none;
}

.menu-item:hover {
  position: relative;
  background: #333;
  color: white;
}

// Submenu
.has-submenu {
  position: relative;

  .menu-item.active {
    background: #333;
    color: white;
  }
}

.sub-menu {
  background: #ddd;
  position: absolute;
  top: 0;
  right: 0;
  transform: translateX(100%);
  white-space: nowrap;
}

// Mid section
.mid {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.playback-btn {
  cursor: pointer;
}

.play.active {
  color: rgb(13, 247, 13);
}

.rec.active {
  color: red;
}

// Right
.right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.follow {
  background: #111;
}

.follow.active {
  background: rgb(92, 92, 255);
}

.midi.active {
  background: var(--color-1);
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 0;
  background: rgba(0, 0, 0, 0);
}
</style>
