<template>
  <div class="FilterBody">
    <!-- Audio Params -->
    <div class="audio-params params-container">
      <div v-for="(audioParam, apIndex) in Node.audioParams" :key="audioParam.name">
        <div
          class="audio-param param"
          v-if="
            !(Node.type === 'highshelf' && audioParam.name === 'Q') &&
            !(Node.type === 'lowshelf' && audioParam.name === 'Q') &&
            !(Node.type === 'notch' && audioParam.name === 'gain') &&
            !(Node.type === 'lowpass' && audioParam.name === 'gain') &&
            !(Node.type === 'bandpass' && audioParam.name === 'gain') &&
            !(Node.type === 'highpass' && audioParam.name === 'gain')
          "
        >
          <div class="param-name">
            {{ audioParam.displayName }}
          </div>

          <div class="knob-wrapper" @click="knobClicked(Node.name + '-' + audioParam.name)">
            <Knob
              :ref="Node.name + '-' + audioParam.name"
              :minVal="audioParam.minValue"
              :maxVal="audioParam.maxValue"
              :initVal="audioParam.value"
              :unit="audioParam.unit"
              @knobTurned="setAudioParam(apIndex, $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="lfo-container">
      <!-- Mod Type, Tempo, Sync -->
      <div class="select-wrapper">
        <span>LFO</span>
        <select @input="setModType($event)">
          <option v-for="modType in Node.modTypes" :key="modType" :selected="modType === Node.modType">
            {{ modType }}
          </option>
        </select>
      </div>

      <!-- Inner Node Audio Params -->
      <div class="inner-node-audio-params">
        <div
          v-for="(innerNodeAudioParam, inapIndex) in Node.innerNodeAudioParams"
          :key="innerNodeAudioParam.name"
          class="inner-node-audio-param param"
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

      <!-- Set as Tempo -->
      <div class="set-as-tempo" @click="setAsTempo">SET AS ROUGH TEMPO</div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import Knob from '../Knob';
export default {
  name: 'BiquadFilterBody',
  components: { Knob },
  props: ['Node'],

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
        { display: '5', value: 5 },
        { display: '6', value: 6 },
        { display: '8', value: 8 },
        { display: '12', value: 12 },
      ],
    };
  },

  computed: {
    ...mapGetters(['secondsPerBeat', 'tempo']),
  },

  methods: {
    ...mapMutations(['setTempo', 'setSecondsPerBeat']),

    setAudioParam(apIndex, value, callerIsSetSync) {
      // if (inapIndex === 0 && !callerIsSetSync) {
      //   //frequency... VER
      //   this.delayTimeKnobValue = value;
      // }
      this.Node.setAudioParam(apIndex, value);
    },

    setInnerNodeAudioParam(inapIndex, value) {
      this.Node.setInnerNodeAudioParam(inapIndex, value);
    },

    setModType(event) {
      this.Node.setModType(event.target.value);
    },

    setAsTempo() {
      let tempo = this.Node.mod.frequency.value * 60;
      while (tempo > 260) {
        tempo /= 2;
      }
      this.setTempo(tempo);
      this.setSecondsPerBeat(60.0 / tempo);
    },

    setSync(i) {
      this.syncButtonSelected = i;
      const frequency = this.secondsPerBeat * 2 * this.syncButtons[i].value;

      console.log(frequency);
      if (this.sync) this.Node.setInnerNodeAudioParam('modFrequency', frequency);
    },

    toggleSync() {
      this.sync = !this.sync;

      if (this.sync) this.setSync(this.syncButtonSelected);
      // else this.setInnerNodeAudioParam("delayTime", this.delayTimeKnobValue);
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit('knobClicked', knobRef);
    },
  },
};
</script>

<style lang="scss" scoped>
.FilterBody {
  font-size: 0.9rem;
}

.lfo-container {
  margin-top: 0.2em;
  padding: 0.1em 0;
  background: #111;
  .select-wrapper {
    display: flex;
    gap: 0.5em;
    justify-content: center;
    align-items: center;
    margin-top: 0.3em;
    user-select: none;
  }

  .param-name {
    padding: 0 0 0.2em 0;
  }

  .set-as-tempo,
  .sync-container {
    margin: 0.3em 0;
    user-select: none;
  }

  .set-as-tempo {
    font-size: 0.8rem;
    cursor: pointer;
  }

  .sync-container {
    background: darkgray;
    cursor: default;
  }

  .sync-container:hover {
    background: gray;
  }

  .sync.synced {
    background: green;
  }

  .sync-buttons {
    // margin-bottom: 0.2em;
    padding-top: 0.2em;
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
}

.inner-node-audio-params {
  display: flex;
  justify-content: center;
}
</style>