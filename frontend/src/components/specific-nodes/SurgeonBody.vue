<template>
  <div class="SurgeonBody">
    <div
      class="oscillator"
      v-for="(osc, o) in Node.oscillatorGroupProps"
      :key="o"
    >
      <div class="oscillator-inner">
        <div class="top">
          <div class="types">
            <span class="label">{{ osc.name }}</span>
            <select @input="setType(o, $event)">
              <option
                :key="type"
                v-for="type in Node.oscTypes"
                :selected="type === osc.type"
              >
                {{ type }}
              </option>
            </select>
          </div>
          <div
            class="octave-transpose"
            tabindex="1"
            @focus="selectOsc(o)"
            @blur="deselectOsc(o)"
            :class="{ selected: currentOsc === o }"
          >
            <div class="octave" :ref="o + 'octave'">
              <span>oct:</span> {{ groupOctaveTranspose[o].octave }}
            </div>
            <div
              class="transpose"
              :ref="o + 'transpose'"
              :class="{ selected: transposeSelected[o] }"
            >
              <span>transp:</span> {{ groupOctaveTranspose[o].transpose }}
            </div>
          </div>

          <!-- Destination -->
          <div class="destination">
            <span class="label">Dest</span>
            <select @input="setOscillatorTarget(o, $event)">
              <option
                :selected="dest[1] === osc.destination"
                v-for="(dest, d) in osc.destinations"
                :key="d"
                :value="dest[1]"
              >
                {{ dest[0] }}
              </option>
            </select>
          </div>

          <!-- Mute/Unmute -->
          <div
            class="mute-unmute"
            @click="toggleMute(o)"
            :class="{ muted: osc.muted }"
          >
            M
          </div>
        </div>
        <div class="custom-params params-container">
          <div
            class="custom-param param"
            v-for="(customParam, paramIndex) in Node.surgeonParams"
            :key="customParam.name"
            :class="[getCssNodeName(Node.name + ' ' + customParam.name)]"
          >
            <div class="param-name">
              {{ customParam.displayName }}
            </div>

            <div
              class="knob-wrapper"
              @click="
                knobClicked(Node.name + '-osc-' + o + '-' + customParam.name)
              "
            >
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
import Knob from "../Knob";
export default {
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
  props: ["Node"],

  created() {
    this.groupOctaveTranspose = this.Node.oscillatorGroupProps.map((ot) => {
      return {
        octave: ot.octave,
        transpose: ot.transpose,
      };
    });
  },

  beforeDestroy() {
    window.removeEventListener("keyup", this.onKeyUp);
  },

  methods: {
    selectOsc(o) {
      window.addEventListener("keyup", this.onKeyUp);
      this.currentOsc = o;
    },

    deselectOsc(o) {
      this.currentOsc = null;
      window.removeEventListener("keyup", this.onKeyUp);
    },

    onKeyUp(e) {
      let val = 0;
      let param = "octave";
      switch (e.keyCode) {
        case 37: //left
          val = -1;
          param = "transpose";
          break;
        case 38: //up
          val = 1;
          break;
        case 39: //right
          val = 1;
          param = "transpose";
          break;
        case 40: //bottom
          val = -1;
          break;
      }

      if (val === 0) return;

      this.Node.addToOctaveTranspose(this.currentOsc, param, val);

      //rendering
      this.$set(this.groupOctaveTranspose, this.currentOsc, {
        octave: this.Node.oscillatorGroupProps[this.currentOsc].octave,
        transpose: this.Node.oscillatorGroupProps[this.currentOsc].transpose,
      });
    },

    setOscillatorTarget(o, event) {
      const { minValue, maxValue, value } = this.Node.setOscillatorTarget(
        o,
        event.target.value
      );
      let refName = this.Node.name + "-osc-" + o + "-S";

      let ref = this.$refs[refName][0];
      ref.setParamContraints(minValue, maxValue, value);
    },

    toggleMute(index) {
      this.Node.toggleMute(index);
    },

    setType(index, event) {
      this.Node.setType(index, event.target.value);
    },

    setSurgeonParam(oscIndex, paramIndex, value) {
      this.Node.setSurgeonParam(oscIndex, paramIndex, value);
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit("knobClicked", knobRef);
    },

    getCssNodeName(name) {
      return name.replace(new RegExp(" ", "g"), "-");
    },
  },

  components: {
    Knob,
  },
};
</script>

<style lang="scss" scoped>
.SurgeonBody {
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

  .types {
    text-align: left;
    margin: 0;
  }

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
    // font-size: 0.9rem;
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