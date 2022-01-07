<template>
  <div
    class="knob"
    :class="{ mapping: thisIsMapping, appIsMapping }"
    @mousedown="onMouseDown"
    @touchstart="onTouchStart"
  >
    <div class="knob-inner" :style="`transform: rotate(${deg}deg); border-color: ${trackColor};`">
      <div class="knob-handle"></div>
    </div>
    <div class="mapped-cmd" v-if="appIsMapping">
      {{ mappedCmd }}
    </div>
    <div class="value set-default-value pointer" @click="onDefaultValueClick">
      <div>{{ displayValue }}</div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  data() {
    return {
      lastYPos: 0,
      knobValue: 0, //0 - 127
      minKnobVal: 0,
      maxKnobVal: 127,
      defaultKnobValue: 0,

      displayValue: 0,

      calib: 2,
      fineTuneStep: 0.2,
      microTuneStep: 0.1,

      deg: 0,
      trackColor: '#111',
      maxTurningDeg: 235,
      min_v: 0,
      max_v: 127,
      default_v: null,

      thisIsMapping: false,
      mappedCmd: null,
    };
  },

  props: ['minVal', 'maxVal', 'initVal', 'unit'],

  computed: {
    ...mapGetters(['appIsMapping']),
  },

  mounted() {
    this.setParamContraints(this.minVal, this.maxVal, parseFloat(this.initVal));
  },

  beforeDestroy() {
    window.removeEventListener('mousemove', this.moveKnob);
    window.removeEventListener('mouseup', this.onMouseUp);
  },

  methods: {
    onMouseDown(e) {
      this.lastYPos = e.clientY;
      window.addEventListener('mousemove', this.moveKnob);
      window.addEventListener('mouseup', this.onMouseUp);
    },
    moveKnob(e) {
      let translation = this.lastYPos - (e.clientY || e.touches[0].clientY);
      if (translation < this.calib && translation > -this.calib) return;

      this.lastYPos = e.clientY || e.touches[0].clientY;
      let amount = 1;

      if (e.ctrlKey || e.shiftKey) {
        console.log('ctrl or shift');
        amount = this.fineTuneStep;
        if (e.ctrlKey && e.shiftKey) {
          amount = this.microTuneStep;
        }
      }

      let knobValue = translation > 0 ? this.knobValue + amount : this.knobValue - amount;

      if (knobValue < this.minKnobVal) knobValue = this.minKnobVal;
      else if (knobValue > this.maxKnobVal) knobValue = this.maxKnobVal;

      this.setKnobValueAndPosition(knobValue);
      this.emitWithKnobValue(knobValue);
    },

    onDefaultValueClick() {
      this.setKnobValueAndPosition(parseFloat(this.defaultKnobValue));
      // this.emitWithKnobValue(this.defaultKnobValue);
      this.emitKnobTurned(this.default_v.toFixed(2));
    },

    setKnobValueAndPosition(knobValue) {
      this.knobValue = knobValue;
      this.deg = knobValue.map(0, this.maxKnobVal, 0, this.maxTurningDeg);
      const colorAmount = knobValue.map(0, this.maxKnobVal, 255, 10);
      this.trackColor = "rgb(100, " + ${colorAmount} + ", 200)";
    },

    emitWithKnobValue(knobValue) {
      const emitValue = knobValue.map(0, this.maxKnobVal, this.min_v, this.max_v).toFixed(2);
      this.emitKnobTurned(emitValue);
    },

    emitKnobTurned(emitValue) {
      this.$emit('knobTurned', emitValue);
      this.formatDisplayValue(emitValue);
    },

    setParamContraints(minVal, maxVal, initVal) {
      this.min_v = parseFloat(minVal);
      this.max_v = parseFloat(maxVal);
      this.default_v = initVal;

      this.knobValue = Math.round(initVal.map(this.min_v, this.max_v, this.minKnobVal, this.maxKnobVal));
      this.defaultKnobValue = this.knobValue;

      const emitValue = initVal.toFixed(2);
      this.formatDisplayValue(emitValue);
      this.setKnobValueAndPosition(this.knobValue);
    },

    formatDisplayValue(emitValue) {
      this.displayValue =
        emitValue >= 1000 ? (emitValue / 1000).toFixed(2) + 'k' : parseFloat(emitValue).toFixed(2);

      this.displayValue = this.displayValue + (this.unit || '');
    },

    log10(x) {
      return Math.log(Math.abs(x)) / Math.LN10;
    },

    onTouchStart(e) {
      window.addEventListener('touchmove', this.moveKnob);
      window.addEventListener('touchend', this.onTouchEnd);
    },

    onMouseUp() {
      window.removeEventListener('mousemove', this.moveKnob);
      window.removeEventListener('mouseup', this.onMouseUp);
    },

    onTouchEnd() {
      window.removeEventListener('touchmove', this.moveKnob);
      window.removeEventListener('touchend', this.onMouseUp);
    },

    // MIDI:
    startMapping() {
      this.thisIsMapping = true;
    },
    stopMapping() {
      this.thisIsMapping = false;
    },
    assignMap(cmd, note) {
      this.mappedCmd = cmd + '/' + note;
    },

    receiveMidi(value) {
      let knobValue = value;

      if (knobValue < this.minKnobVal) knobValue = this.minKnobVal;
      if (knobValue > this.maxKnobVal) knobValue = this.maxKnobVal;

      this.setKnobValueAndPosition(knobValue);
      this.emitWithKnobValue(knobValue);
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
  border-radius: 5px;
  position: relative;
}

.knob.mapping {
  background: yellow;
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
  color: lightgreen;
  background: #272727;
  border-radius: 5px;
  position: absolute;
  bottom: 0;
  right: 0;
  transform: translate(50%, 40%);
}

.set-default-value {
}

.mapped-cmd {
  position: absolute;
  top: 22px;
  left: 50%;
  min-width: 50px;
  transform: translateX(-50%);
  background: black;
  font-size: 0.8rem;
  z-index: 2;
}
</style>