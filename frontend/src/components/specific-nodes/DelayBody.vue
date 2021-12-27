<template>
  <div class="DelayBody">
    <!-- Sync -->
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
    <!-- Inner node audio params -->
    <div class="inner-node-audio-params params-container">
      <div
        v-for="(innerNodeAudioParam, inapIndex) in Node.innerNodeAudioParams"
        :key="innerNodeAudioParam.name"
        class="inner-node-audio-param param"
      >
        <div
          class="param-container"
          v-if="
            innerNodeAudioParam.name !== 'delayTime' || (innerNodeAudioParam.name === 'delayTime' && !sync)
          "
        >
          <div class="param-name">
            {{ innerNodeAudioParam.displayName }}
          </div>

          <div class="knob-wrapper" @click="knobClicked(Node.name + '-' + innerNodeAudioParam.name)">
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

    <div class="custom-params params-container">
      <div
        v-for="(customParam, cpIndex) in Node.customParams"
        :key="customParam.name"
        class="custom-param param"
      >
        <div class="param-name">
          {{ customParam.displayName }}
        </div>

        <div class="knob-wrapper" @click="knobClicked(Node.name + '-' + customParam.name)">
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

    <!-- Set as TEmpo -->
    <div class="set-as-tempo" @click="setAsTempo">SET AS ROUGH TEMPO</div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import Knob from '../Knob';
export default {
  data() {
    return {
      sync: false,
      syncButtonSelected: 1,
      syncButtons: [
        { display: '1/2', value: 0.5 },
        { display: '1', value: 1 },
        { display: '2', value: 2 },
        { display: '3', value: 3 },
        { display: '4', value: 4 },
        { display: '6', value: 6 },
      ],
      delayTimeKnobValue: 0,
    };
  },

  props: ['Node'],
  computed: {
    ...mapGetters(['secondsPerBeat']),
  },

  methods: {
    ...mapMutations(['setTempo', 'setSecondsPerBeat']),

    setSync(i) {
      this.syncButtonSelected = i;
      let delayTime = this.secondsPerBeat / this.syncButtons[i].value;

      delayTime -= delayTime * 0.01;
      // delayTime -= 0.01;

      if (this.sync) this.setInnerNodeAudioParam('delayTime', delayTime, true);
    },

    toggleSync() {
      this.sync = !this.sync;

      if (this.sync) this.setSync(this.syncButtonSelected);
      else this.setInnerNodeAudioParam('delayTime', this.delayTimeKnobValue);
    },

    setAsTempo() {
      let secondsPerBeat = this.Node.delay.delayTime.value;

      this.setTempo(60 / secondsPerBeat);
      this.setSecondsPerBeat(secondsPerBeat);
    },

    setCustomParam(cpIndex, value) {
      this.Node.setCustomParam(cpIndex, value);
    },

    setInnerNodeAudioParam(inapIndex, value, callerIsSetSync) {
      if (inapIndex === 0 && !callerIsSetSync) {
        //delayTime
        this.delayTimeKnobValue = value;
      }
      this.Node.setInnerNodeAudioParam(inapIndex, value);
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit('knobClicked', knobRef);
    },

    getCssNodeName(name) {
      return name.replace(new RegExp(' ', 'g'), '-');
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

.sync-buttons {
  margin: 0.2em 0;
  background: #222;
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

.set-as-tempo {
  font-size: 0.8rem;
  cursor: pointer;
  margin-top: 0.5em;
  padding: 0.2em;
  background: #111;
}
</style>