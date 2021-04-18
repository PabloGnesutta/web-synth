<template>
  <div class="DelayBody">
    <div class="sync-container">
      <div class="sync" @click="toggleSync" :class="{ synced: sync }">Sync</div>
      <div class="sync-buttons" v-show="sync">
        <div
          class="sync-button"
          :class="{ selected: i === syncButtonSelected }"
          v-for="(btn, i) in syncButtons"
          :key="i"
          @click="setSync(i)"
        >
          {{ btn.display }}
        </div>
      </div>
    </div>
    <div
      class="inner-node-audio-params params-container"
      v-if="Node.innerNodeAudioParams"
    >
      <div
        class="inner-node-audio-param param"
        v-for="(innerNodeAudioParam, inapIndex) in Node.innerNodeAudioParams"
        :key="innerNodeAudioParam.name"
        :class="[
          getCssNodeName(Node.name + ' ' + innerNodeAudioParam.name),
          getCssNodeName(innerNodeAudioParam.name),
        ]"
      >
        <div
          class="param-container"
          v-if="
            innerNodeAudioParam.name !== 'delayTime' ||
            (innerNodeAudioParam.name === 'delayTime' && !sync)
          "
        >
          <div class="param-name">
            {{ innerNodeAudioParam.displayName }}
          </div>

          <div class="knob-wrapper">
            <Knob
              :ref="Node.name + '-' + innerNodeAudioParam.name"
              :unit="innerNodeAudioParam.unit"
              :minVal="innerNodeAudioParam.minValue"
              :maxVal="innerNodeAudioParam.maxValue"
              :initVal="innerNodeAudioParam.value"
              @knobTurned="setInnerNodeAudioParam(inapIndex, $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="custom-params params-container" v-if="Node.customParams">
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
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import Knob from "../Knob";
export default {
  data() {
    return {
      sync: false,
      syncButtonSelected: 1,
      syncButtons: [
        { display: "1/2", value: 0.5 },
        { display: "1", value: 1 },
        { display: "2", value: 2 },
        { display: "3", value: 3 },
        { display: "4", value: 4 },
        { display: "5", value: 5 },
        { display: "6", value: 6 },
      ],
      delayTimeKnobValue: 0,
    };
  },

  props: ["Node"],
  computed: {
    ...mapGetters(["secondsPerBeat"]),
  },

  methods: {
    setSync(i) {
      this.syncButtonSelected = i;
      const delayTime = this.secondsPerBeat / this.syncButtons[i].value;

      if (this.sync) this.setInnerNodeAudioParam(0, delayTime, true);
    },

    toggleSync() {
      this.sync = !this.sync;

      if (this.sync) this.setSync(this.syncButtonSelected);
      else this.setInnerNodeAudioParam(0, this.delayTimeKnobValue);
    },

    getCssNodeName(name) {
      return name.replace(new RegExp(" ", "g"), "-");
    },

    setCustomParam(cpIndex, value) {
      this.$emit("setCustomParam", { cpIndex, value });
    },

    setInnerNodeAudioParam(inapIndex, value, callerIsSetSync) {
      if (inapIndex === 0 && !callerIsSetSync) {
        //delay time
        this.delayTimeKnobValue = value;
        console.log("delay time change");
      }
      this.$emit("setInnerNodeAudioParam", { inapIndex, value });
    },
  },

  components: {
    Knob,
  },
};
</script>

<style lang="scss" scoped>
.sync {
  background: gray;
  user-select: none;
}

.sync.synced {
  background: green;
}

.sync-button {
  cursor: pointer;
  display: inline-block;
  padding: 0.3em;
  margin: 0 0.2em;
  &.selected {
    background: var(--color-1);
  }
}
</style>