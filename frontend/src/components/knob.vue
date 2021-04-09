<template>
  <div
    class="knob"
    :class="{ mapping: thisIsMapping }"
    @mousedown="onMouseDown"
  >
    <div
      class="knob-inner"
      :style="`transform: rotate(${deg}deg); border-color: ${trackColor};`"
    >
      <div class="knob-handle"></div>
    </div>
    <div class="mapped-cmd" v-if="appIsMapping">
      {{ mappedCmd }}
    </div>
    <div class="value set-default-value pointer" @click="valueClicked">
      <div>{{ emitValue }}</div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      startY: 0,
      lastYPos: 0,

      knobValue: 0,
      minKnobVal: 0,
      maxKnobVal: 127,
      initknobValue: 0,

      emitValue: 0,

      calib: 2,
      fineTunning: false,
      fineTuneStep: 0.1,

      deg: 0,
      trackColor: "#111",
      maxTurningDeg: 278,
      min_v: 0,
      max_v: 127,

      thisIsMapping: false,
      mappedCmd: null,
    };
  },

  props: ["minVal", "maxVal", "initVal"],

  computed: {
    ...mapGetters(["appIsMapping"]),
  },

  mounted() {
    this.setParamContraints(this.minVal, this.maxVal, parseFloat(this.initVal));
  },

  methods: {
    valueClicked() {
      this.setKnobValueAndPosition(parseFloat(this.initknobValue));
    },

    setKnobValueAndPosition(value) {
      this.knobValue = value;
      this.deg = value.map(0, this.maxKnobVal, 0, this.maxTurningDeg);
      const r = value.map(0, this.maxKnobVal, 10, 150);
      this.trackColor = `rgb(0, ${r}, ${r});`;

      this.emitValue = value
        .map(0, this.maxKnobVal, this.min_v, this.max_v)
        .toFixed(2);

      this.$emit("knobTurned", this.emitValue);
    },

    moveKnob(e) {
      let translation = this.lastYPos - e.clientY;
      if (translation < this.calib && translation > -this.calib) return;

      this.lastYPos = e.clientY;

      const amount = this.fineTunning ? this.fineTuneStep : 1;

      let knobValue =
        translation > 0 ? this.knobValue + amount : this.knobValue - amount;

      if (knobValue < this.minKnobVal) knobValue = this.minKnobVal;
      if (knobValue > this.maxKnobVal) knobValue = this.maxKnobVal;

      this.setKnobValueAndPosition(knobValue);
    },

    startMapping() {
      this.thisIsMapping = true;
    },
    stopMapping() {
      this.thisIsMapping = false;
    },
    assignMap(cmd, note) {
      this.mappedCmd = cmd + "/" + note;
    },

    receiveMidi(value) {
      let knobValue = value;

      if (knobValue < this.minKnobVal) knobValue = this.minKnobVal;
      if (knobValue > this.maxKnobVal) knobValue = this.maxKnobVal;

      this.setKnobValueAndPosition(knobValue);
    },

    onMouseDown(e) {
      this.startY = e.clientY;
      this.lastYPos = e.clientY;
      window.addEventListener("mousemove", this.moveKnob);
      window.addEventListener("mouseup", this.onMouseUp);
      window.addEventListener("keydown", this.onKeydown);
      window.addEventListener("keyup", this.onKeyup);
    },

    onMouseUp() {
      window.removeEventListener("mousemove", this.moveKnob);
    },

    onKeydown(e) {
      if (e.key === "Control") this.fineTunning = true;
    },

    onKeyup(e) {
      if (e.key === "Control") this.fineTunning = false;
    },

    setParamContraints(minVal, maxVal, initValue) {
      this.min_v = parseFloat(minVal);
      this.max_v = parseFloat(maxVal);

      this.knobValue = Math.round(
        initValue.map(this.min_v, this.max_v, this.minKnobVal, this.maxKnobVal)
      );
      this.initknobValue = this.knobValue;
      this.emitValue = initValue.toFixed(2);
      this.setKnobValueAndPosition(this.knobValue);
      // console.log("knob val", this.knobValue);
    },
  },
};
</script>

<style lang="scss" scoped>
.knob {
  width: 30px;
  margin: 0 auto;
  background: transparent;
  user-select: none;
  border: 1px solid transparent;
  position: relative;
}

.knob.mapping {
  border: 1px solid yellow;
}

.knob-inner {
  width: 30px;
  height: 30px;
  border: 3px solid #111;
  border-radius: 50%;
  position: relative;
  user-select: none;
}

.knob-handle {
  position: absolute;
  background: #445863;
  border-bottom-left-radius: 3px;
  border-top-left-radius: 3px;
  transform: rotate(-50deg);
  height: 6px;
  width: 9px;
  left: -3px;
  bottom: -4px;
}

.value {
  margin-top: 0.3em;
  font-size: 0.8rem;
}

.mapped-cmd {
  position: absolute;
  top: 22px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  font-size: 0.8rem;
}
</style>