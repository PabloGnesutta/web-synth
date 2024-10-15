<template>
  <div class="node-wrapper">
    <div :ref="Node.name" class="node" :class="[Node.nodeType, getCssNodeName(Node.name), { folded: folded }]">
      <!-- Node Header -->
      <div class="node-header">
        <div class="top-left">
          <div v-if="Node.nodeRol === 'Instrument'" class="instrument-enabler" @click="toggleInstrumentEnabled">
            <div class="instrument-enabler-inner" :class="{ enabled: instrumentEnabled }"></div>
          </div>

          <div v-if="Node.saveString" class="preset-icon select-none" @click="savePreset()">[S]</div>
          <div v-if="showPresetNames" class="preset-names">
            <div v-for="(presetName, presetIndex) in presetNames" :key="presetName" class="preset-name"
              @click="loadPreset(presetIndex)">
              {{ presetName }}
            </div>
          </div>
        </div>

        <div class="node-name" @click.stop="toggleFolded">{{ Node.name }}</div>

        <div class="top-right">
          <div class="delete" @click="deleteNode()">X</div>
        </div>
      </div>

      <div v-if="folded" class="backdrop" @click.stop="toggleFolded">
        <div class="name-folded">{{ Node.name }}</div>
      </div>

      <!-- Node Body -->
      <component :is="`${Node.nodeType}Body`" :Node="Node" @knobClicked="knobClickedWithRef" />

      <!-- Node Footer -->
      <div class="node-footer">
        <!-- Dry/Wet -->
        <div v-if="Node.dryWet" class="dry-wet">
          <div class="param-name">dry/wet</div>
          <div @click="knobClicked(Node.name + '-dry-wet')">
            <Knob :ref="Node.name + '-dry-wet'" :initVal="Node.dryWet.value" :minVal="Node.dryWet.minValue"
              :maxVal="Node.dryWet.maxValue" @knobTurned="setDryWet($event)" />
          </div>
        </div>

        <!-- Level -->
        <div class="level">
          <div class="param-name">Level</div>
          <div @click="knobClicked(Node.name + '-level')">
            <Knob :ref="Node.name + '-level'" :initVal="Node.gain" :minVal="Node.minGain" :maxVal="Node.maxGain"
              @knobTurned="setNodeGain($event)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

import Knob from './Knob';
import DelayBody from './specific-nodes/DelayBody';
import EQ3Body from './specific-nodes/EQ3Body.vue';
import LooperBody from './specific-nodes/LooperBody.vue';
import DrumkitBody from './specific-nodes/DrumkitBody.vue';
import SurgeonBody from './specific-nodes/SurgeonBody.vue';
import WhiteNoiseBody from './specific-nodes/WhiteNoiseBody.vue';
import FemodBody from './specific-nodes/FemodBody.vue';
import SamplerBody from './specific-nodes/SamplerBody.vue';
import BiquadFilterBody from './specific-nodes/BiquadFilterBody.vue';
import ReverbBody from './specific-nodes/ReverbBody.vue';
import CompressorBody from './specific-nodes/CompressorBody.vue';
import DistortionBody from './specific-nodes/DistortionBody.vue';

export default {
  name: 'NodeRender',
  components: {
    Knob,
    EQ3Body,
    DelayBody,
    LooperBody,
    DrumkitBody,
    SurgeonBody,
    WhiteNoiseBody,
    FemodBody,
    CompressorBody,
    BiquadFilterBody,
    DistortionBody,
    SamplerBody,
    ReverbBody,
  },

  props: ['Node', 'instrumentEnabled'],

  data() {
    return {
      folded: false,
      loopStatus: 'CLEARED',
      presetCandidates: ['Surgeon', 'Femod'],
      presetNames: [],
      presets: [],
      showPresetNames: false,
    };
  },

  computed: {
    ...mapGetters(['appConnecting', 'originNode']),
  },

  methods: {
    ...mapMutations(['setAppConnecting', 'setOriginNode']),

    setNodeGain(value) {
      this.Node.setGain(value);
    },

    toggleFolded() {
      this.folded = !this.folded;
    },

    deleteNode() {
      this.$emit('deleteNode');
    },

    savePreset() {
      const newPresetName = prompt('Nombre del preset a guardar');
      if (!newPresetName) return;

      const presetsKey = this.Node.nodeType + '-presets';
      const presetNamesKey = this.Node.nodeType + '-preset-names';

      let presetNames = localStorage.getItem(presetNamesKey);
      presetNames = JSON.parse(presetNames);

      if (!presetNames) {
        localStorage.setItem(presetsKey, '[]');
        localStorage.setItem(presetNamesKey, '[]');
        presetNames = [];
      }

      //ver si existe

      let presets = localStorage.getItem(presetsKey);
      presets = JSON.parse(presets);

      this.Node.name = newPresetName;
      const saveString = this.Node.saveString();

      presetNames.push(newPresetName);
      presets.push({ name: newPresetName, saveString });

      localStorage.setItem(presetNamesKey, JSON.stringify(presetNames));
      localStorage.setItem(presetsKey, JSON.stringify(presets));
    },

    toggleInstrumentEnabled() {
      this.$emit('toggleInstrumentEnabled');
    },

    setDryWet(value) {
      this.Node.setDryWet(parseFloat(value));
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit('knobClicked', knobRef);
    },

    knobClickedWithRef(knobRef) {
      this.$emit('knobClicked', knobRef);
    },

    getCssNodeName(name) {
      return name.replace(new RegExp(' ', 'g'), '-');
    },
  },
};
</script>

<style lang="scss">
.node-wrapper {
  height: 100%;
}

.node {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0em;
  background: #333;
  color: #f3f3f3;
  border: 2px solid transparent;
  padding-bottom: 0.5rem;
  transition: all 0.2s ease-out;
  text-align: center;
}

.node.folded {
  width: 34px;
  overflow: hidden;

  .backdrop {
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.82);
    z-index: 1;
    cursor: pointer;

    .name-folded {
      transform: rotate(-90deg) translateX(-100%);
      position: inherit;
      bottom: 50%;
      width: 100%;
      white-space: nowrap;
      user-select: none;
      letter-spacing: 1px;
    }
  }
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;

  .top-left {
    display: flex;
    gap: 0.5rem;

    .preset-icon {
      cursor: pointer;

      &:hover {
        color: coral;
      }
    }

    .preset-names {
      position: absolute;
      top: 1.5rem;
      background: #111;
      width: 100%;
      text-align: left;
      padding: 0.5rem;
    }
  }

  .node-name {
    flex: 1;
    text-align: center;
    user-select: none;
    white-space: nowrap;
    color: var(--color-1);
    font-size: 1.1rem;
    cursor: pointer;
  }

  .top-right {
    display: flex;
    justify-content: flex-end;
  }
}

.delete {
  user-select: none;
  cursor: pointer;
  background: #444;
  padding: 0 0.2em;
  // z-index: 1;
}

// PARAMS

.params-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  background: #272727;
}

.param {
  min-width: 65px;
  padding: 0.2em;
  cursor: default;
  border: 2px solid transparent;
  transition: border-color 0.2s ease-out, background-color 0.2s ease-out;
  font-size: 0.95rem;
}

.param-name {
  padding: 0.3em 0.2em 0.5em;
  user-select: none;
  font-size: 0.9rem;
  text-align: center;
}

.types {
  padding: 0.2em 0;
  background: #272727;
}

.instrument-enabler {
  cursor: pointer;

  .instrument-enabler-inner {
    width: 15px;
    height: 15px;
    background: red;
    // transition: background-color 0.2s ease-out;
  }

  .instrument-enabler-inner.enabled {
    background: green;
  }
}

// Specific Node Styles:
.Surgeon {
  width: 310px;
}

.BiquadFilter {
  width: 154px;
}

.Compressor {
  width: 200px;
}

.Delay {
  width: 154px;
}

.node-footer {
  display: flex;
  justify-content: space-around;
}
</style>