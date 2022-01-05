<template>
  <div class="FemodBody">
    <!-- Types -->
    <div class="types" v-if="Node.types">
      <select @input="setType($event)">
        <option v-for="type in Node.types" :key="type" :selected="type === Node.type">
          {{ type }}
        </option>
      </select>
    </div>

    <!-- Custom Params -->
    <div class="params-container">
      <div v-for="(customParam, paramIndex) in Node.customParams" :key="customParam.name" class="param">
        <div class="param-name">{{ customParam.displayName }}</div>

        <div @click="knobClicked(Node.name + '-' + customParam.name)">
          <Knob
            :ref="Node.name + '-' + customParam.name"
            :unit="customParam.unit"
            :minVal="customParam.minValue"
            :maxVal="customParam.maxValue"
            :initVal="customParam.value"
            @knobTurned="setCustomParam(paramIndex, $event)"
          />
        </div>
      </div>
    </div>

    <!-- Modulation Params -->
    <div class="params-container">
      <div
        v-for="(modulationParam, paramIndex) in Node.modulationParams"
        :key="modulationParam.name"
        class="param"
      >
        <div class="param-name">{{ modulationParam.displayName }}</div>

        <div
          v-if="modulationParam.name !== 'modType'"
          @click="knobClicked(Node.name + '-' + modulationParam.name)"
        >
          <Knob
            :ref="Node.name + '-' + modulationParam.name"
            :unit="modulationParam.unit"
            :minVal="modulationParam.minValue"
            :maxVal="modulationParam.maxValue"
            :initVal="modulationParam.value"
            @knobTurned="setModulationParam(paramIndex, $event)"
          />
        </div>
        <!-- Mod Waveshape - todo: should not be a modulation param but a individual thing -->
        <div v-else>
          <select @input="setModType(paramIndex, $event)">
            <option
              v-for="type in modulationParam.types"
              :key="type"
              :selected="type === modulationParam.value"
            >
              {{ type }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Knob from '../Knob';
export default {
  name: 'FemodBody',
  components: { Knob },
  props: ['Node'],

  methods: {
    setType({ target }) {
      this.Node.setType(target.value);
      target.blur();
    },

    setCustomParam(paramIndex, value) {
      this.Node.setCustomParam(paramIndex, value);
    },

    setModulationParam(paramIndex, value) {
      this.Node.setModulationParam(paramIndex, value);
    },

    setModType(paramIndex, e) {
      this.Node.setModulationParam(paramIndex, e.target.value);
      e.target.blur();
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit('knobClicked', knobRef);
    },
  },
};
</script>

<style lang="scss" scoped>
.params-container {
  .param {
    min-width: 50px;
  }
  .param-name {
    padding: 0 0 0.3em 0;
    font-size: 0.8rem;
  }
}
</style>