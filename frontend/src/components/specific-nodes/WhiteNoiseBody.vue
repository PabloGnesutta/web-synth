<template>
  <div class="white-noise-body">
    <!-- Audio Params -->
    <div class="params-container">
      <div v-for="(audioParam, apIndex) in Node.audioParams" :key="audioParam.name" class="param">
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

    <!-- Inner Node Audio Params -->
    <div class="params-container">
      <div
        v-for="(innerNodeAudioParam, inapIndex) in Node.innerNodeAudioParams"
        :key="innerNodeAudioParam.name"
        class="param"
      >
        <div class="param-name">{{ innerNodeAudioParam.displayName }}</div>

        <div class="knob-wrapper" @click="knobClicked(Node.name + '-' + innerNodeAudioParam.name)">
          <Knob
            :ref="Node.name + '-' + innerNodeAudioParam.name"
            :unit="innerNodeAudioParam.unit"
            :minVal="innerNodeAudioParam.minValue"
            :maxVal="innerNodeAudioParam.maxValue"
            :initVal="innerNodeAudioParam.value"
            @knobTurned="setInnerNodeAudioParam(inapIndex, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Knob from '../Knob';
export default {
  name: 'WhiteNoiseBody',
  components: { Knob },
  props: ['Node'],

  methods: {
    setAudioParam(apIndex, value) {
      this.Node.setAudioParam(apIndex, value);
    },

    setInnerNodeAudioParam(inapIndex, value) {
      this.Node.setInnerNodeAudioParam(inapIndex, value);
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit('knobClicked', knobRef);
    },
  },
};
</script>
