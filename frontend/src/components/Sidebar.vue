<template>
  <div class="sidebar-wrapper">
    <div v-if="presetNamesLoaded" class="sidebar custom-scrollbar">
      <!-- Instruments -->
      <div class="menu instruments">
        <div class="label">Instruments</div>
        <div v-for="instrument in instruments" :key="instrument.className" class="nodes-container">
          <div class="node-item">
            <span
              @click="togglePresetsDropdown(instrument)"
              class="arrow"
              :class="{ rotate: instrument.showPresets }"
              >></span
            >
            <span @dblclick="createInstrument(instrument.className)" class="node-item-name">
              {{ instrument.displayName }}
            </span>
          </div>
          <div v-if="instrument.showPresets" class="presets-container">
            <div
              v-for="(presetName, presetIndex) in instrument.presetNames"
              :key="presetName"
              class="preset-item"
              @dblclick="loadPreset(instrument.className, presetIndex, 'instrument')"
            >
              {{ presetName }}
            </div>
          </div>
        </div>
      </div>

      <!-- Effects -->
      <div class="menu effects">
        <div class="label">Effects</div>
        <div v-for="effect in effects" :key="effect.className" class="nodes-container">
          <div class="node-item">
            <span @click="togglePresetsDropdown(effect)" class="arrow" :class="{ rotate: effect.showPresets }"
              >></span
            >
            <span @dblclick="createEffect(effect.className)" class="node-item-name">
              {{ effect.displayName }}
            </span>
          </div>
          <div v-if="effect.showPresets" class="presets-container">
            <div
              v-for="(presetName, presetIndex) in effect.presetNames"
              :key="presetName"
              class="preset-item"
              @dblclick="loadPreset(effect.className, presetIndex, 'effect')"
            >
              {{ presetName }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
    };
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
    createInstrument(className) {
      this.$emit('createInstrument', className);
    },
    createEffect(className) {
      if (this.instrumentIsLoaded) this.$emit('createEffect', className);
    },

    // Presets

    togglePresetsDropdown(instrumentOrEffect) {
      instrumentOrEffect.showPresets = !instrumentOrEffect.showPresets;
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
.sidebar {
  padding: 0.25rem;
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
  .node-item-name:hover {
    background: #333;
  }
}

.preset-item {
  padding: 0.25rem 0.5rem 0.25rem 1.75rem;
  margin-bottom: 0.25rem;
  user-select: none;
  cursor: default;
  &:hover {
    background: #333;
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