<template>
  <div class="distortion-body">
    <!-- Custom Params -->
    <!-- Boost, Harsh -->
    <div class="params-container">
      <div v-for="(customParam, cpIndex) in Node.customParams" :key="customParam.name" class="param">
        <div class="param-name">{{ customParam.displayName }}</div>

        <div @click="knobClicked(Node.name + '-' + customParam.name)">
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
  </div>
</template>

<script>
import Knob from '../Knob';
export default {
  name: 'DistortionBody',
  components: { Knob },
  props: ['Node'],

  methods: {
    setCustomParam(index, value) {
      this.Node.setCustomParam(index, value);
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit('knobClicked', knobRef);
    },
  },
};
</script>
