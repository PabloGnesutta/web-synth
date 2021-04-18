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
      <!-- <div>{{ knobValue }}</div> -->
      <div>{{ displayValue }}</div>
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
      displayValue: 0,

      calib: 2,
      ctrlPressed: false,
      fineTuneStep: 0.1,
      finerTuneStep: 0.01,

      deg: 0,
      trackColor: "#111",
      maxTurningDeg: 235,
      min_v: 0,
      max_v: 127,
      defaultValue: null,

      thisIsMapping: false,
      mappedCmd: null,
    };
  },

  props: ["minVal", "maxVal", "initVal", "unit"],

  computed: {
    ...mapGetters(["appIsMapping", "appConnecting"]),
  },

  mounted() {
    this.setParamContraints(this.minVal, this.maxVal, parseFloat(this.initVal));
    console.log("knob mounted");
  },

  methods: {
    valueClicked() {
      if (this.appConnecting) return;
      this.setKnobValueAndPosition(parseFloat(this.initknobValue));
      this.emitAndSetEmitValueWithRawValue(this.defaultValue);
    },

    setKnobValueAndPosition(knobValue) {
      this.knobValue = knobValue;
      this.deg = knobValue.map(0, this.maxKnobVal, 0, this.maxTurningDeg);
      const r = knobValue.map(0, this.maxKnobVal, 255, 10);
      this.trackColor = `rgb(100, ${r},200);`;
    },

    emitAndSetEmitValueWithKnobValue(knobValue) {
      this.emitValue = knobValue
        .map(0, this.maxKnobVal, this.min_v, this.max_v)
        .toFixed(2);
      this.processDisplayValue();
      this.$emit("knobTurned", this.emitValue);
    },

    emitAndSetEmitValueWithRawValue(value) {
      this.emitValue = value.toFixed(2);
      this.processDisplayValue();
      this.$emit("knobTurned", this.emitValue);
    },

    moveKnob(e) {
      let translation = this.lastYPos - e.clientY;
      if (translation < this.calib && translation > -this.calib) return;
      this.lastYPos = e.clientY;

      let amount = 1;
      if (this.ctrlPressed || this.shiftPressed) {
        amount = this.fineTuneStep;
        if (this.ctrlPressed && this.shiftPressed) {
          amount = 0.05;
        }
      }

      let knobValue =
        translation > 0 ? this.knobValue + amount : this.knobValue - amount;

      if (knobValue < this.minKnobVal) knobValue = this.minKnobVal;
      if (knobValue > this.maxKnobVal) knobValue = this.maxKnobVal;

      this.setKnobValueAndPosition(knobValue);
      this.emitAndSetEmitValueWithKnobValue(knobValue);
      // this.emitAndSetEmitValueWithRawValue(knobValue);
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
      window.removeEventListener("mouseup", this.onMouseUp);
      window.removeEventListener("keydown", this.onKeydown);
      window.removeEventListener("keyup", this.onKeyup);
      this.ctrlPressed = false;
      this.shiftPressed = false;
    },

    onKeydown(e) {
      if (e.key === "Control") this.ctrlPressed = true;
      if (e.key === "Shift") this.shiftPressed = true;
    },

    onKeyup(e) {
      if (e.key === "Control") this.ctrlPressed = false;
      if (e.key === "Shift") this.shiftPressed = false;
    },

    setParamContraints(minVal, maxVal, initValue) {
      this.min_v = parseFloat(minVal);
      this.max_v = parseFloat(maxVal);

      this.knobValue = Math.round(
        initValue.map(this.min_v, this.max_v, this.minKnobVal, this.maxKnobVal)
      );

      this.defaultValue = initValue;
      this.initknobValue = this.knobValue;

      //acá (o en node render) chequear que no haya sido creado este nodo previamente antes de forzar reset de parámetros
      this.emitValue = initValue.toFixed(2);
      this.processDisplayValue();
      this.setKnobValueAndPosition(this.knobValue);
      this.$emit("knobTurned", this.emitValue);
    },

    processDisplayValue() {
      this.displayValue =
        this.emitValue >= 1000
          ? (this.emitValue / 100).toFixed(1) + "k"
          : parseFloat(this.emitValue).toFixed(1);
      this.displayValue = this.displayValue + (this.unit || "");
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
  background: white;
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
  font-size: 0.7rem;
  padding: 0.1em 0.2em;
  position: absolute;
  bottom: 0;
  right: 0;
  background: #272727;
  transform: translate(50%, 40%);
  border-radius: 5px;
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