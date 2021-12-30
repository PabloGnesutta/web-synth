<template>
  <div class="node-body">
    <!-- Audio Params -->
    <div class="params-container">
      <div v-for="(audioParam, apIndex) in Node.audioParams" :key="audioParam.name" class="audio-param param">
        <div class="param-name">{{ audioParam.displayName }}</div>

        <div class="knob-wrapper" @click="knobClicked(Node.name + '-' + audioParam.name)">
          <Knob
            :ref="Node.name + '-' + audioParam.name"
            :minVal="audioParam.minValue"
            :maxVal="audioParam.maxValue"
            :initVal="audioParam.value"
            :unit="audioParam.unit"
            @knobTurned="setAudioParam(apIndex, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Knob from '../Knob';
export default {
  name: 'CompressorBody',
  components: { Knob },
  props: ['Node'],

  methods: {
    setAudioParam(apIndex, value) {
      this.Node.setAudioParam(apIndex, value);
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit('knobClicked', knobRef);
    },
  },
};
</script>
