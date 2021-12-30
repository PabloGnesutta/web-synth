
<template>
  <div class="node-wrapper">
    <div
      :ref="Node.name"
      class="node"
      :class="[Node.nodeType, getCssNodeName(Node.name), { folded: folded }]"
    >
      <!-- Node Header -->
      <div class="node-header">
        <div class="top-left">
          <div
            v-if="Node.nodeRol === 'Instrument'"
            class="instrument-enabler"
            @click="toggleInstrumentEnabled"
          >
            <div class="instrument-enabler-inner" :class="{ enabled: instrumentEnabled }"></div>
          </div>
          <div v-if="Node.saveString" class="save-preset" @click="savePreset()">[G]</div>
        </div>
        <div class="node-name-container">
          <div class="node-name" @click.stop="toggleFolded">{{ Node.name }}</div>
        </div>
        <div class="top-right" v-if="Node.name !== 'Track Gain'">
          <div class="delete" @click="deleteNode()">X</div>
        </div>
      </div>

      <div v-if="folded" class="backdrop" @click.stop="toggleFolded">
        <div class="name-folded">{{ Node.name }}</div>
      </div>

      <!-- Node Body -->
      <div class="node-body">
        <div class="types" v-if="Node.types">
          <select @input="setType($event)">
            <option v-for="type in Node.types" :key="type" :selected="type === Node.type">
              {{ type }}
            </option>
          </select>
        </div>

        <div class="body-wrapper">
          <component :is="`${Node.nodeType}Body`" :Node="Node" @knobClicked="knobClickedWithRef" />
        </div>
      </div>

      <div class="start-stop" v-if="Node.nodeType === 'Carrier'">
        <div class="start" @click="startOsc()" v-if="Node.status === 'STOPPED'">START</div>
        <div class="stop" v-else @click="stopOsc()">STOP</div>
      </div>

      <!-- Node Footer -->
      <div class="node-footer">
        <!-- Dry/Wet -->
        <div v-if="Node.dryWet" class="dry-wet">
          <div class="param-name">dry/wet</div>
          <div class="knob-wrapper" @click="knobClicked(Node.name + '-dry-wet')">
            <Knob
              :ref="Node.name + '-dry-wet'"
              :initVal="Node.dryWet.value"
              :minVal="Node.dryWet.minValue"
              :maxVal="Node.dryWet.maxValue"
              @knobTurned="setDryWet($event)"
            />
          </div>
        </div>

        <!-- Level -->
        <div class="level">
          <div class="param-name">Level</div>
          <div class="knob-wrapper" @click="knobClicked(Node.name + '-level')">
            <Knob
              :ref="Node.name + '-level'"
              :initVal="Node.gain"
              :minVal="Node.minGain"
              :maxVal="Node.maxGain"
              @knobTurned="setNodeGain($event)"
            />
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
// import BaseNodeBody from './specific-nodes/BaseNodeBody.vue';

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
    // BaseNodeBody,
  },

  props: ['Node', 'instrumentEnabled'],

  data() {
    return {
      folded: false,
      loopStatus: 'CLEARED',
      presetCandidates: ['Surgeon', 'Femod'],
    };
  },

  computed: {
    ...mapGetters(['context', 'appConnecting', 'originNode']),
  },

  methods: {
    ...mapMutations(['setAppConnecting', 'setOriginNode']),

    setNodeGain(value) {
      this.Node.setGain(value);
    },

    toggleFolded() {
      this.folded = !this.folded;
    },

    setType(e) {
      // if (this.Node.nodeType === 'Carrier') return;

      this.Node.setType(e.target.value);
      e.target.blur();

      if (this.Node.audioParams) this.setParamsConstraints(this.Node.audioParams);
    },

    setParamsConstraints(params) {
      params.forEach(p => {
        const refName = this.Node.name + '-' + p.name;
        const ref = this.$refs[refName];
        if (ref) if (ref[0]) ref[0].setParamContraints(p.minValue, p.maxValue, p.defaultValue);
      });
    },

    deleteNode() {
      this.$emit('deleteNode');
    },

    savePreset() {
      const presetsKey = this.Node.nodeType + '-presets';
      const namesKey = presetsKey + '-names';

      let names = localStorage.getItem(namesKey);

      if (!names) {
        localStorage.setItem(presetsKey, '[]');
        localStorage.setItem(namesKey, '[]');
        names = '[]';
      }

      const newPresetName = prompt('Nombre del preset a guardar');
      names = JSON.parse(names);
      //ver si existe

      let presets = localStorage.getItem(presetsKey);
      presets = JSON.parse(presets);

      const saveString = this.Node.saveString();

      names.push(newPresetName);
      presets.push({ name: newPresetName, saveString });

      localStorage.setItem(namesKey, JSON.stringify(names));
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

    startOsc() {
      this.Node.start(0);
    },

    stopOsc() {
      this.Node.stop(0);
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
  border: 2px solid transparent;
  padding-bottom: 0.5rem;
  background: #333;
  color: #f3f3f3;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.2s ease-out;
  gap: 0em;

  max-height: 365px;
}

.node.folded {
  width: 34px;
  overflow: hidden;
  .backdrop {
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
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
    gap: 0.2em;
    .save-preset {
      cursor: pointer;
    }
  }
  .node-name-container {
    text-align: center;
    flex: 1;
    user-select: none;
    white-space: nowrap;
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
  z-index: 1;
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
    transition: background-color 0.2s ease-out;
  }
  .instrument-enabler-inner.enabled {
    background: green;
  }
}

// Specific Node Styles:

.Femod {
  width: 205px;
}

.Duette {
  width: 350px;
}
.Surgeon {
  width: 350px;
}

.Carrier,
.WhiteNoise,
.Drumkit {
  width: 160px;
}

.BufferSource {
  width: 100px;
}

.EQ3 {
  width: 210px;
}

.Delay {
  width: 160px;
  .param {
    min-width: 78px;
  }
}

.Looper {
  width: 140px;
}

.Compressor {
  width: 200px;
}

.BiquadFilter {
  width: 200px;
}

.Gain {
  width: 80px;
}

.node-footer {
  display: flex;
  justify-content: space-around;
}

.octave-transpose {
  user-select: none;
  text-align: right;
  font-size: 0.9rem;
  margin-right: 0.5em;
  .value {
    color: var(--color-2);
  }
}

.start,
.stop {
  cursor: pointer;
  border: 1px solid var(--color-1);
  padding: 0.2em 0 0.1em;
  font-weight: bold;
}

.stop {
  border: 1px solid red;
}
</style>