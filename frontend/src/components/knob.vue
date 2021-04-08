<template>
  <div>
    <h1>knob</h1>
    <div class="knob" @mousedown="startKnobTurning">
      <div class="knob-inner" :style="`transform: rotate(${deg}deg)`">
        <div class="knob-handle"></div>
      </div>
      <div>{{ value }}</div>
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

      value: 0,
      minVal: 0,
      maxVal: 127,

      calib: 2.5, //se podría agregar tecla modificadora tipo ctrl para ajuste fino

      deg: 0,
      maxTurningDeg: 260,
    };
  },

  methods: {
    moveKnob(e) {
      let translation = this.lastYPos - e.clientY;
      if (translation < this.calib && translation > -this.calib) return;

      this.lastYPos = e.clientY;

      let value = translation > 0 ? this.value + 1 : this.value - 1;

      if (value < this.minVal) value = this.minVal;
      if (value > this.maxVal) value = this.maxVal;
      this.value = value;

      this.deg = value.map(0, this.maxVal, 0, this.maxTurningDeg);
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
  height: 40px;
  width: 40px;
  background: transparent;
  user-select: none;
}

.knob-inner {
  width: 100%;
  height: 100%;
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
</style>