<template>
  <div class="FemodBody">
    <!-- Custom Params -->
    <div class="custom-params params-container">
      <div
        v-for="(customParam, cpIndex) in Node.customParams"
        :key="customParam.name"
        class="custom-param param"
      >
        <div class="param-name">
          {{ customParam.displayName }}
        </div>

        <div
          class="knob-wrapper"
          @click="knobClicked(Node.name + '-' + customParam.name)"
        >
          <Knob
            :ref="Node.name + '-' + customParam.name"
            :unit="customParam.unit"
            :minVal="customParam.minValue"
            :maxVal="customParam.maxValue"
            :initVal="customParam.value"
            @knobTurned="setCustomParam(cpIndex, $event)"
          />
        </div>
      </div>
    </div>

    <!-- Modulation Params -->
    <div
      class="modulation-params params-container"
      v-if="Node.modulationParams"
    >
      <div
        v-for="(motulationParam, mpIndex) in Node.modulationParams"
        :key="motulationParam.name"
        class="modulation-param param"
      >
        <div class="param-name"> {{ motulationParam.displayName }} </div>

        <div
          v-if="motulationParam.name !== 'type'"
          class="knob-wrapper"
          @click="knobClicked(Node.name + '-' + motulationParam.name)"
        >
          <Knob
            :ref="Node.name + '-' + motulationParam.name"
            :unit="motulationParam.unit"
            :minVal="motulationParam.minValue"
            :maxVal="motulationParam.maxValue"
            :initVal="motulationParam.value"
            @knobTurned="setModulationParam(mpIndex, $event)"
          />
        </div>
        <div v-else class="select-wrapper" >
          <select @input="setModType(mpIndex, $event)">
            <option
              :key="type"
              v-for="type in motulationParam.types"
              :selected="type === motulationParam.value"
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
import Knob from "../Knob";
export default {
  name: "FemodBody",
  components: { Knob },
  props: ["Node"],

  methods: {
    setCustomParam(cpIndex, value) {
      this.Node.setCustomParam(cpIndex, value);
    },

    setModulationParam(mpIndex, value) {
      this.Node.setModulationParam(mpIndex, value);
    },

    setModType(mpIndex, e) {
      e.target.blur();
      this.Node.setModulationParam(mpIndex, e.target.value);
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit("knobClicked", knobRef);
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