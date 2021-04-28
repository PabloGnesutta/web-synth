<template>
  <div class="DuetteBody">
    <div class="oscillator" v-for="(osc, o) in Node.oscillatorsState" :key="o">
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
            v-for="(customParam, paramIndex) in Node.duetteParams"
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
                  @knobTurned="setDuetteParam(o, paramIndex, $event)"
                />
              </div>
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

    setDuetteParam(oscIndex, paramIndex, value) {
      this.Node.setDuetteParam(oscIndex, paramIndex, value);
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
    .node-name {
      margin: 0;
    }
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .types {
      text-align: left;
      margin: 0;
    }
    .mute-unmute {
      user-select: none;
      align-self: flex-start;
      font-size: 0.9rem;
      background: #444;
      padding: 0 0.2em;
      &.muted {
        background: crimson;
      }
    }
  }
  margin-bottom: 0.3em;
}

.oscillator:last-child {
  margin-bottom: 0;
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