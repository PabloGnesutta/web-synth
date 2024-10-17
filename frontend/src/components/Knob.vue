<template>
  <div
    class="knob"
    :class="{ mapping: knobIsBeingMapped }"
    @mousedown="onMouseDown"
    @touchstart="onTouchStart"
    @dblclick="resetToDefault"
  >
    <div class="knob-inner" :style="`transform: rotate(${deg}deg); border-color: ${trackColor}`">
      <div class="knob-handle"></div>
    </div>
    <div class="mapped-cmd" v-if="midiState.mapping">
      {{ mappedCmd }}
    </div>
    <div class="value set-default-value pointer" @click="resetToDefault">
      <div>{{ displayValue }}</div>
    </div>
  </div>
</template>

<script>
import { midiState } from '../state/vueInstance.js';

const movementMultiplier = 0.5;
const fineStepMultiplier = 0.3;
const microStepMultiplier = 0.2;
const maxTurningDeg = 235;
const minKnobVal = 0;
const maxKnobVal = 127;

export default {
  data() {
    return {
      midiState,

      lastYPos: 0,
      knobValue: 0, //0 - 127
      defaultKnobValue: 0,
      displayValue: 0,

      min_v: 0,
      max_v: 127,
      default_v: null,
      deg: 0,
      trackColor: '',

      knobIsBeingMapped: false,
      mappedCmd: null,
    };
  },

  props: ['minVal', 'maxVal', 'initVal', 'unit'],

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

      this.lastYPos = e.clientY || e.touches[0].clientY;
      let amount = translation * movementMultiplier; // before, amount = 2

      if (e.ctrlKey && e.altKey) {
        amount *= microStepMultiplier;
      } else if (e.ctrlKey && e.altKey) {
        amount *= fineStepMultiplier;
      }

      let knobValue = this.knobValue + amount;
      if (knobValue < minKnobVal) knobValue = minKnobVal;
      else if (knobValue > maxKnobVal) knobValue = maxKnobVal;

      this.setKnobValueAndPosition(knobValue);
      this.emitWithKnobValue(knobValue);
    },

    resetToDefault() {
      this.setKnobValueAndPosition(parseFloat(this.defaultKnobValue));
      this.emitKnobTurned(this.default_v.toFixed(2));
    },

    setKnobValueAndPosition(knobValue) {
      this.knobValue = knobValue;
      this.deg = knobValue.map(0, maxKnobVal, 0, maxTurningDeg);
      const colorAmount = knobValue.map(0, maxKnobVal, 255, 10);
      this.trackColor = `rgb(100, ${colorAmount}, 200)`;
    },

    emitWithKnobValue(knobValue) {
      const emitValue = knobValue.map(0, maxKnobVal, this.min_v, this.max_v).toFixed(2);
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

      this.knobValue = Math.round(initVal.map(this.min_v, this.max_v, minKnobVal, maxKnobVal));
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
    setKnobMappingStatus(isBeingMapped) {
      this.knobIsBeingMapped = isBeingMapped;
    },
    assignMap(cmd, note) {
      this.mappedCmd = cmd + '/' + note;
    },

    receiveMidi(knobValue) {
      if (knobValue < minKnobVal) knobValue = minKnobVal;
      if (knobValue > maxKnobVal) knobValue = maxKnobVal;
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
