<template>
  <div class="EQ3Body">
    <div
      v-if="Node.innerNodeAudioParams"
      class="inner-node-audio-params params-container"
    >
      <div class="heading low">Low</div>
      <div class="heading mid">Mid</div>
      <div class="heading high">High</div>
      
      <div
        v-for="(innerNodeAudioParam, inapIndex) in Node.innerNodeAudioParams"
        :key="innerNodeAudioParam.name"
        class="inner-node-audio-param param"
        :class="[ getCssNodeName(innerNodeAudioParam.name) ]"
      >
        <div class="param-container">
          <div class="param-name">
            {{ innerNodeAudioParam.displayName }}
          </div>

          <div
            class="knob-wrapper"
            @click="knobClicked(Node.name + '-' + innerNodeAudioParam.name)"
          >
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
  </div>
</template>

<script>
import Knob from "../Knob";
export default {
  name: "EQ3Body",
  components: { Knob },
  props: ["Node"],

  methods: {
    setInnerNodeAudioParam(inapIndex, value) {
      this.Node.setInnerNodeAudioParam(inapIndex, value);
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit("knobClicked", knobRef);
    },

    getCssNodeName(name) {
      return name.replace(new RegExp(" ", "g"), "-");
    },
  },

  
};
</script>

<style lang="scss" scoped>
.inner-node-audio-params {
  display: grid;
  padding-top: .2em;
  grid-template-areas:
    "h1 h2 h3"
    "t1 t2 t3"
    "m1 m2 m3"
    "b1 b2 b3";
}
.heading {
  font-weight: bold;
}

.heading.low {
  grid-area: h1;
  color: teal;
}
.heading.mid {
  grid-area: h2;
  color: coral;
}
.heading.high {
  grid-area: h3;
  color: yellow;
}

.lowFreq {
  grid-area: t1;
}
.lowGain {
  grid-area: m1;
}

.midFreq {
  grid-area: t2;
}
.midGain {
  grid-area: m2;
}
.midQ {
  grid-area: b2;
}

.highFreq {
  grid-area: t3;
}
.highGain {
  grid-area: m3;
}
</style>