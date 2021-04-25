<template>
  <div>
    <div class="oscillator" v-for="(osc, o) in Node.oscillatorValues" :key="o">
      <div class="oscillator-inner">
        <div class="top">
          <div class="types">
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
            v-for="(customParam, cpIndex) in Node.customParams"
            :key="customParam.name"
            :class="[getCssNodeName(Node.name + ' ' + customParam.name)]"
          >
            <div class="param-name">
              {{ customParam.displayName }}
            </div>

            <div class="knob-wrapper">
              <div class="knob-wrapper">
                <Knob
                  :ref="Node.name + '-' + customParam.name"
                  :unit="customParam.unit"
                  :minVal="customParam.minValue"
                  :maxVal="customParam.maxValue"
                  :initVal="osc[customParam.name]"
                  @knobTurned="setCustomParam(o, cpIndex, $event)"
                />
              </div>
              <!-- :initVal="osc[customParam.name]" -->
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
  props: ["Node"],

  methods: {
    toggleMute(index) {
      this.Node.toggleMute(index);
    },

    setType(index, event) {
      this.Node.setType(index, event.target.value);
    },

    setCustomParam(oscIndex, cpIndex, value) {
      this.Node.setCustomParam(oscIndex, cpIndex, value);
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
.oscillator {
  display: flex;
  .oscillator-inner {
    width: 100%;
    background: #272727;
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .types {
      text-align: left;
    }
    .mute-unmute {
      background: gray;
      padding: 0 .2em;
      &.muted {
        background: crimson;
      }
    }
  }
  margin-bottom: 0.3em;
}

.params-container {
  .param {
    min-width: 50px;
  }
}
</style>