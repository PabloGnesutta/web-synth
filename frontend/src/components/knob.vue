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
      <div>{{ emitVal }}</div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      turning: false,
      startY: 0,
      lastYPos: 0,

      knobValue: 0,
      minKnobVal: 0,
      maxKnobVal: 127,
      initknobValue: 0,

      emitVal: 0,

      calib: 2,
      fineTunning: false,
      fineTuneStep: 0.1,

      deg: 0,
      trackColor: "#111",
      maxTurningDeg: 260,
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
    this.min_v = parseFloat(this.minVal);
    this.max_v = parseFloat(this.maxVal);
    const initVal = parseFloat(this.initVal);
    this.knobValue = Math.round(
      initVal.map(this.min_v, this.max_v, this.minKnobVal, this.maxKnobVal)
    );
    this.initknobValue = this.knobValue;
    this.deg = this.knobValue.map(0, this.maxKnobVal, 0, this.maxTurningDeg);
    const r = this.knobValue.map(0, this.maxKnobVal, 10, 150);
    this.trackColor = `rgb(0, ${r}, ${r});`;
    this.emitVal = initVal.toFixed(2);
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

      this.emitVal = value
        .map(0, this.maxKnobVal, this.min_v, this.max_v)
        .toFixed(2);

      this.$emit("knobTurned", this.emitVal);
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
      this.turning = true;
      this.startY = e.clientY;
      this.lastYPos = e.clientY;
      window.addEventListener("mousemove", this.moveKnob);
      window.addEventListener("mouseup", this.onMouseUp);
      window.addEventListener("keydown", this.onKeydown);
      window.addEventListener("keyup", this.onKeyup);
    },

    onMouseUp() {
      this.turning = false;
      window.removeEventListener("mousemove", this.moveKnob);
    },

    onKeydown(e) {
      if (e.key === "Control") {
        this.fineTunning = true;
      }
    },

    onKeyup(e) {
      if (e.key === "Control") {
        this.fineTunning = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.knob {
  // height: 60px;
  width: 40px;
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
  width: 40px;
  height: 40px;
  border: 3px solid #111;
  border-radius: 50%;
  position: relative;
  user-select: none;
}

.knob-handle {
  position: absolute;
  background: #ff7a7a;
  // border-radius: 50%;
  // height: 10px;
  // width: 10px;
  transform: rotate(-45deg);
  height: 6px;
  width: 10px;
  left: -3px;
  bottom: -2px;
}

.value {
  margin-top: 0.3em;
}

.mapped-cmd {
  position: absolute;
  top: 22px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  font-size: 0.8rem;
  // padding: .2em;
}
</style>