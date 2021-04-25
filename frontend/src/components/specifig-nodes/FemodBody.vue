<template>
  <div class="FemodBody">
    <!-- Custom Params -->
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
              :initVal="customParam.value"
              @knobTurned="setCustomParam(cpIndex, $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modulation Params -->
    <div
      class="modulation-params params-container"
      v-if="Node.modulationParams"
    >
      <div
        class="modulation-param param"
        :key="motulationParam.name"
        v-for="(motulationParam, mpIndex) in Node.modulationParams"
        :class="[getCssNodeName(Node.name + ' ' + motulationParam.name)]"
      >
        <div class="param-name">
          {{ motulationParam.displayName }}
        </div>

        <div
          class="knob-wrapper"
        >
          <div class="knob-wrapper" v-if="motulationParam.name !== 'type'">
            <Knob
              :ref="Node.name + '-' + motulationParam.name"
              :unit="motulationParam.unit"
              :minVal="motulationParam.minValue"
              :maxVal="motulationParam.maxValue"
              :initVal="motulationParam.value"
              @knobTurned="setModulationParam(mpIndex, $event)"
            />
          </div>
          <div class="select-wrapper" v-else>
            <select @input="setModType(mpIndex, $event)">
              <option
                :key="type"
                v-for="type in motulationParam.types"
                :selected="type === motulationParam.value"
              >
                {{ type }}
              </option>
            </select>
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
    setCustomParam(cpIndex, value) {
      this.Node.setCustomParam(cpIndex, value);
    },

    setModulationParam(mpIndex, value) {
      this.Node.setModulationParam(mpIndex, value);
    },

    setModType(mpIndex, e) {
      e.target.blur();
      this.Node.setModulationParam(mpIndex, e.target.value);
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