<template>
  <div class="BaseNodeBody">
    <div class="node-body-inner">
      <!-- Audio Params -->
      <div v-if="Node.audioParams" class="audio-params params-container">
        <div
          v-for="(audioParam, apIndex) in Node.audioParams"
          :key="audioParam.name"
          class="audio-param param"
        >
          <div class="param-name">
            {{ audioParam.displayName }}
          </div>

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
      <div v-if="Node.innerNodeAudioParams" class="inner-node-audio-params params-container">
        <div
          v-for="(innerNodeAudioParam, inapIndex) in Node.innerNodeAudioParams"
          :key="innerNodeAudioParam.name"
          class="inner-node-audio-param param"
        >
          <div class="param-name">
            {{ innerNodeAudioParam.displayName }}
          </div>

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

      <!-- Custom Params -->
      <div class="custom-params params-container" v-if="Node.customParams">
        <div
          v-for="(customParam, cpIndex) in Node.customParams"
          :key="customParam.name"
          class="custom-param param"
        >
          <div class="param-name">
            {{ customParam.displayName }}
          </div>

          <div class="knob-wrapper" @click="knobClicked(Node.name + '-' + customParam.name)">
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
  </div>
</template>

<script>
import Knob from '../Knob';
export default {
  components: { Knob },
  props: ['Node'],

  methods: {
    setAudioParam(apIndex, value) {
      this.Node.setAudioParam(apIndex, value);
    },

    setInnerNodeAudioParam(inapIndex, value) {
      this.Node.setInnerNodeAudioParam(inapIndex, value);
    },

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

<style lang="scss" scoped>
</style>