<template>
  <div class="sidebar-wrapper" :class="{ focused }" @click="focusSidebar">
    <div v-if="presetNamesLoaded" class="sidebar custom-scrollbar">
      <!-- Instruments -->
      <div class="menu instruments">
        <div class="label">Instruments</div>
        <div v-for="(instrument, i) in instruments" :key="instrument.className" class="nodes-container">
          <div class="node-item" :class="{ selected: selectedType === 'instruments' && selectedParentIndex === i }">
            <span @click="togglePresetsDropdown(instrument)" class="arrow"
              :class="{ rotate: instrument.showPresets }">></span>
            <span class="node-item-name" @click="selectParent('instruments', i)"
              @dblclick="createInstrument(instrument.className)">
              {{ instrument.displayName }}
            </span>
          </div>
          <div v-if="instrument.showPresets" class="presets-container">
            <div v-for="(presetName, presetIndex) in instrument.presetNames" :key="presetName" class="preset-item"
              :class="{
                selected:
                  selectedType === 'instruments' &&
                  selectedParentIndex === i &&
                  selectedChildIndex === presetIndex,
              }" @dblclick="loadPreset(instrument.className, presetIndex, 'instrument')">
              {{ presetName }}
            </div>
          </div>
        </div>
      </div>

      <!-- Effects -->
      <div class="menu effects">
        <div class="label">Effects</div>
        <div v-for="(effect, e) in effects" :key="effect.className" class="nodes-container">
          <div class="node-item" :class="{ selected: selectedType === 'effects' && selectedParentIndex === e }">
            <span @click="togglePresetsDropdown(effect)" class="arrow" :class="{ rotate: effect.showPresets }">></span>
            <span @click="selectParent('effects', e)" @dblclick="createEffect(effect.className)" class="node-item-name">
              {{ effect.displayName }}
            </span>
          </div>
          <div v-if="effect.showPresets" class="presets-container">
            <div v-for="(presetName, presetIndex) in effect.presetNames" :key="presetName" class="preset-item"
              @dblclick="loadPreset(effect.className, presetIndex, 'effect')">
              {{ presetName }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { appState } from '../state/vueInstance';

export default {
  name: 'Sidebar',
  props: ['instrumentIsLoaded'],
  data() {
    return {
      instruments: [
        { displayName: 'Surgeon', className: 'Surgeon', showPresets: false },
        { displayName: 'Femod', className: 'Femod', showPresets: false },
        { displayName: 'Drumkit', className: 'Drumkit', showPresets: false },
        { displayName: 'Noise', className: 'WhiteNoise', showPresets: false },
        { displayName: 'Sampler', className: 'Sampler', showPresets: false },
      ],
      effects: [
        { displayName: 'Filter', className: 'BiquadFilter', showPresets: false },
        { displayName: 'Delay', className: 'Delay', showPresets: false },
        { displayName: 'Reverb', className: 'Reverb', showPresets: false },
        { displayName: 'EQ3', className: 'EQ3', showPresets: false },
        { displayName: 'Looper', className: 'Looper', showPresets: false },
        { displayName: 'Compressor', className: 'Compressor', showPresets: false },
        { displayName: 'Distortion', className: 'Distortion', showPresets: false },
      ],
      presetNamesLoaded: false,
      selectedParentIndex: null,
      selectedChildIndex: -1,
      selectedType: null,
    };
  },
  computed: {
    focused() {
      return appState.focusing === 'sidebar';
    }
  },
  watch: {
    focused() {
      if (this.focused) this.addKeyListeners();
      else this.removeKeyListeners();
    },
  },
  beforeDestroy() {
    this.removeKeyListeners();
  },
  created() {
    this.instruments.forEach(instrument => {
      const presetNamesKey = instrument.className + '-preset-names';
      let presetNames = JSON.parse(localStorage.getItem(presetNamesKey));
      if (presetNames) {
        instrument.presetNames = presetNames;
      }
    });

    this.effects.forEach(effect => {
      const presetNamesKey = effect.className + '-preset-names';
      let presetNames = JSON.parse(localStorage.getItem(presetNamesKey));
      if (presetNames) {
        effect.presetNames = presetNames;
      }
    });

    this.presetNamesLoaded = true;
  },

  methods: {
    focusSidebar() {
      appState.focusing = 'sidebar';
    },
    selectParent(nodeType, index) {
      this.selectedType = nodeType;
      this.selectedParentIndex = index;
    },
    addKeyListeners() {
      window.addEventListener('keydown', this.onKeyDown);
    },
    removeKeyListeners() {
      window.removeEventListener('keydown', this.onKeyDown);
    },
    onKeyDown(e) {
      switch (e.keyCode) {
        case 13: //enter
          if (this.selectedType === 'instruments')
            this.createInstrument(this.instruments[this.selectedParentIndex].className);
          else this.createEffect(this.effects[this.selectedParentIndex].className);
          break;
        case 37: //arrow left
          if (!this.selectedParentIndex) return;
          this.closePresetsDropdown(this[this.selectedType][this.selectedParentIndex]);
          break;
        case 38: //arrow up
          if (this[this.selectedType][this.selectedParentIndex].showPresets) {
            //presets menu  open
            if (this.selectedChildIndex - 1 >= 0) {
              this.selectedChildIndex--;
            } else {
              this.selectedChildIndex =
                this[this.selectedType][this.selectedParentIndex].presetNames.length - 1;
            }
          } else if (this.selectedParentIndex - 1 >= 0) {
            this.selectedParentIndex--;
          } else {
            this.selectedType = this.selectedType === 'instruments' ? 'effects' : 'instruments';
            this.selectedParentIndex = this[this.selectedType].length - 1;
          }
          break;
        case 39: //arrow right
          if (!this.selectedParentIndex) return;
          if (this[this.selectedType][this.selectedParentIndex].presetNames)
            // hast presets
            this.openPresetsDropdown(this[this.selectedType][this.selectedParentIndex]);
          break;
        case 40: //arrow down
          if (this[this.selectedType][this.selectedParentIndex].showPresets) {
            // presets menu open
            if (
              this.selectedChildIndex + 1 <
              this[this.selectedType][this.selectedParentIndex].presetNames.length
            ) {
              this.selectedChildIndex++;
            } else {
              this.selectedChildIndex = 0;
            }
          } else if (this.selectedParentIndex + 1 < this[this.selectedType].length) {
            this.selectedParentIndex++;
          } else {
            this.selectedType = this.selectedType === 'instruments' ? 'effects' : 'instruments';
            this.selectedParentIndex = 0;
          }
          break;
      }
    },
    createInstrument(className) {
      this.$emit('createInstrument', className);
    },
    createEffect(className) {
      if (this.instrumentIsLoaded) {
        this.$emit('createEffect', className);
      }
    },
    // Presets
    togglePresetsDropdown(instrumentOrEffect) {
      instrumentOrEffect.showPresets = !instrumentOrEffect.showPresets;
    },
    openPresetsDropdown(instrumentOrEffect) {
      instrumentOrEffect.showPresets = true;
    },
    closePresetsDropdown(instrumentOrEffect) {
      instrumentOrEffect.showPresets = false;
    },
    loadPreset(className, presetIndex, instrumentOrEffect) {
      if (instrumentOrEffect === 'effect' && !this.instrumentIsLoaded) return;
      const store = localStorage.getItem(className + '-presets');
      const preset = JSON.parse(store)[presetIndex];
      const saveString = JSON.parse(preset.saveString);
      this.$emit('loadPreset', saveString);
    },
  },
};
</script>

<style lang="scss" scoped>
.sidebar-wrapper {
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  border-top: 1px solid transparent;
}

.sidebar-wrapper.focused {
  border-color: rgb(156, 156, 0);
}

.sidebar {
  padding: 0 0.25rem;
  height: var(--mid-section-height);
  overflow-y: auto;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  background: #111;
}

.label {
  padding: 0.5rem 0.5rem;
  background: #555;
  text-align: left;
  user-select: none;
  cursor: default;
}

.menu {
  width: 100%;
}

.nodes-container {
  text-align: left;

  .node-item {
    display: flex;
    align-items: center;
    margin-bottom: 0.25rem;
    user-select: none;
    cursor: default;
  }

  .node-item-name {
    flex: 1;
    padding: 0.25rem;
  }

  .node-item:hover {
    background: #333;
  }

  .node-item.selected {
    background: #444;
  }
}

.preset-item {
  padding: 0.25rem 0.5rem 0.25rem 1em;
  margin-left: 0.75rem;
  margin-bottom: 0.25rem;
  user-select: none;
  cursor: default;

  &:hover {
    background: #333;
  }

  &.selected {
    background: #444;
  }
}

.arrow {
  display: inline-block;
  padding: 0 0.25rem;
  cursor: pointer;
}

.rotate {
  transform: rotate(90deg);
}
</style>