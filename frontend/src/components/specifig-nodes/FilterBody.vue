<template>
  <div class="DuetteBody">
    <div class="select-wrapper">
      <span>mod type</span>
      <select @input="setModType($event)">
        <option
          :key="modType"
          v-for="modType in Node.modTypes"
          :selected="modType === Node.modType"
        >
          {{ modType }}
        </option>
      </select>
    </div>
    <div class="set-as-tempo" @click="setAsTempo">
      SET AS TEMPO--- {{ Node.node.frequency.value }}
    </div>
  </div>
</template>

<script>
import { mapMutations } from "vuex";
import Knob from "../Knob";
export default {
  props: ["Node"],

  methods: {
    ...mapMutations([
      "setTempo",
      "setTotalBeats",
      "setCurrentBeat",
      "setNextBeatTime",
      "setSecondsPerBeat",
    ]),

    setModType(event) {
      this.Node.setModType(event.target.value);
    },

    setAsTempo() {
      let tempo = this.Node.mod.frequency.value * 60;
      while (tempo > 260) {
        tempo /= 2;
      }
      this.setTempo(tempo);
      console.log();
    },

    sync(fraction) {

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