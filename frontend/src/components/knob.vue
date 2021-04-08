<template>
  <div class="knob" @mousedown="startKnobTurning">
    <div class="knob-inner" :style="`transform: rotate(${deg}deg)`">
      <div class="knob-handle"></div>
    </div>
    <div class="value set-default-value pointer" @click="valueClicked">
      <div>{{ emitVal }}</div>
    </div>
  </div>
</template>

<script>
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

      calib: 2.5, //se podría agregar tecla modificadora tipo ctrl para ajuste fino

      deg: 0,
      maxTurningDeg: 260,
      min_v: 0,
      max_v: 127,
    };
  },

  props: ["minVal", "maxVal", "initVal"],

  mounted() {
    this.min_v = parseFloat(this.minVal);
    this.max_v = parseFloat(this.maxVal);
    const initVal = parseFloat(this.initVal);
    this.knobValue = Math.round(
      initVal.map(this.min_v, this.max_v, this.minKnobVal, this.maxKnobVal)
    );
    this.initknobValue = this.knobValue;
    this.deg = this.knobValue.map(0, this.maxKnobVal, 0, this.maxTurningDeg);
    this.emitVal = initVal.toFixed(2);
  },

  methods: {
    valueClicked() {
      this.setKnobValueAndPosition(parseFloat(this.initknobValue));
    },

    setKnobValueAndPosition(value) {
      this.knobValue = value;
      this.deg = value.map(0, this.maxKnobVal, 0, this.maxTurningDeg);

      this.emitVal = value
        .map(0, this.maxKnobVal, this.min_v, this.max_v)
        .toFixed(2);

      this.$emit("knobTurned", this.emitVal);
    },

    moveKnob(e) {
      let translation = this.lastYPos - e.clientY;
      if (translation < this.calib && translation > -this.calib) return;

      this.lastYPos = e.clientY;

      let knobValue = translation > 0 ? this.knobValue + 1 : this.knobValue - 1;

      if (knobValue < this.minKnobVal) knobValue = this.minKnobVal;
      if (knobValue > this.maxKnobVal) knobValue = this.maxKnobVal;

      this.setKnobValueAndPosition(knobValue);
    },

    startKnobTurning(e) {
      this.turning = true;
      this.startY = e.clientY;
      this.lastYPos = e.clientY;
      window.addEventListener("mousemove", this.moveKnob);
      window.addEventListener("mouseup", this.stopKnobTurning);
    },

    stopKnobTurning() {
      this.turning = false;
      window.removeEventListener("mousemove", this.moveKnob);
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
}

.knob-inner {
  width: 40px;
  height: 40px;
  border: 3px solid white;
  border-radius: 50%;
  position: relative;
  user-select: none;
}

.knob-handle {
  position: absolute;
  height: 10px;
  width: 10px;
  background: red;
  border-radius: 50%;
  left: -2px;
  bottom: 0;
}

.value {
  margin-top: 0.3em;
}
</style>