<template>
  <div class="surgeon-body">
    <div v-for="(osc, o) in Node.oscillatorGroupProps" :key="o" class="oscillator">
      <div class="oscillator-inner">
        <!-- Top Section -->
        <div class="top">
          <!-- Oscillator Waveshape (Type) -->
          <div>
            <span class="label">{{ osc.name }}</span>
            <select @input="setType(o, $event)">
              <option v-for="type in Node.oscTypes" :key="type" :selected="type === osc.type">
                {{ type }}
              </option>
            </select>
          </div>

          <!-- Octave/Transpose -->
          <div
            tabindex="1"
            class="octave-transpose"
            :class="{ selected: currentOsc === o }"
            @focus="selectOsc(o)"
            @blur="deselectOsc(o)"
          >
            <div class="octave" :ref="o + 'octave'">
              <span>oct:</span> {{ groupOctaveTranspose[o].octave }}
            </div>
            <div :ref="o + 'transpose'" class="transpose" :class="{ selected: transposeSelected[o] }">
              <span>transp:</span> {{ groupOctaveTranspose[o].transpose }}
            </div>
          </div>

          <!-- Destination -->
          <div class="destination">
            <span class="label">Dest</span>
            <select @input="setOscillatorTarget(o, $event)">
              <option
                v-for="(dest, d) in osc.destinations"
                :key="d"
                :selected="dest[1] === osc.destination"
                :value="dest[1]"
              >
                {{ dest[0] }}
              </option>
            </select>
          </div>

          <!-- Mute/Unmute -->
          <div class="mute-unmute" :class="{ muted: osc.muted }" @click="toggleOscillatorGroupMute(o)">M</div>
        </div>

        <!-- Custom Params -->
        <!-- A, D, S, R, Detune  -->
        <div class="params-container">
          <div v-for="(customParam, paramIndex) in Node.surgeonParams" :key="customParam.name" class="param">
            <div class="param-name">{{ customParam.displayName }}</div>

            <div class="knob-wrapper" @click="knobClicked(Node.name + '-osc-' + o + '-' + customParam.name)">
              <Knob
                :ref="Node.name + '-osc-' + o + '-' + customParam.name"
                :unit="customParam.unit"
                :minVal="Node.minValues[paramIndex]"
                :maxVal="Node.maxValues[o][paramIndex]"
                :initVal="osc[customParam.name]"
                @knobTurned="setSurgeonParam(o, paramIndex, $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Knob from '../Knob';
export default {
  name: 'SurgeonBody',
  components: { Knob },
  props: ['Node'],

  data() {
    return {
      octaveSelected: [false, false, false],
      transposeSelected: [false, false, false],
      changingValue: false,
      currentRef: null,
      currentOsc: null,
      groupOctaveTranspose: [],
    };
  },

  created() {
    this.groupOctaveTranspose = this.Node.oscillatorGroupProps.map(props => {
      return {
        octave: props.octave,
        transpose: props.transpose,
      };
    });
  },

  beforeDestroy() {
    window.removeEventListener('keyup', this.onKeyDown);
  },

  methods: {
    selectOsc(o) {
      window.addEventListener('keydown', this.onKeyDown);
      this.currentOsc = o;
    },

    deselectOsc(o) {
      this.currentOsc = null;
      window.removeEventListener('keydown', this.onKeyDown);
    },

    onKeyDown(e) {
      e.preventDefault(); //avoid triggering blur

      let val = 0;
      let param = 'octave';
      switch (e.keyCode) {
        case 38: //up
          val = 1;
          break;
        case 40: //down
          val = -1;
          break;
        case 37: //left
          val = -1;
          param = 'transpose';
          break;
        case 39: //right
          val = 1;
          param = 'transpose';
          break;

        default:
          return;
      }

      this.Node.addToOctaveTranspose(this.currentOsc, param, val);

      //rendering
      this.$set(this.groupOctaveTranspose, this.currentOsc, {
        octave: this.Node.oscillatorGroupProps[this.currentOsc].octave,
        transpose: this.Node.oscillatorGroupProps[this.currentOsc].transpose,
      });
    },

    setOscillatorTarget(o, event) {
      const { minValue, maxValue, value } = this.Node.setOscillatorTarget(o, event.target.value);
      let refName = this.Node.name + '-osc-' + o + '-S';

      let ref = this.$refs[refName][0];
      ref.setParamContraints(minValue, maxValue, value);
    },

    toggleOscillatorGroupMute(index) {
      this.Node.toggleOscillatorGroupMute(index);
    },

    setType(index, event) {
      this.Node.setType(index, event.target.value);
    },

    setSurgeonParam(oscIndex, paramIndex, value) {
      this.Node.setSurgeonParam(oscIndex, paramIndex, value);
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit('knobClicked', knobRef);
    },
  },
};
</script>

<style lang="scss" scoped>
.surgeon-body {
  font-size: 0.9rem;
}
.oscillator {
  display: flex;
  .oscillator-inner {
    width: 100%;
    background: #272727;
    .node-name {
      margin: 0;
    }
  }
  margin-bottom: 0.3em;
}

.oscillator:last-child {
  margin-bottom: 0;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  // .types {
  // text-align: left;
  // margin: 0;
  // }

  .octave-transpose:focus {
    border-color: yellow;
    outline: none;
  }
  .octave-transpose {
    display: flex;
    align-items: center;
    gap: 1em;
    user-select: none;
    border: 2px solid transparent;
    padding: 0 0.2em;
    transition: border-color 0.1s ease-out;
  }

  .mute-unmute {
    user-select: none;
    align-self: flex-start;
    background: #444;
    padding: 0 0.2em;
    &.muted {
      background: crimson;
    }
  }

  .label {
    display: inline-block;
    margin-right: 0.2em;
  }
}

.params-container {
  .param {
    min-width: 50px;
  }
  .param-name {
    padding: 0 0 0.3em 0;
    font-size: 0.8rem;
  }
}
</style>