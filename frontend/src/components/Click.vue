<template>
  <div>
    <input type="range" min="30" max="300" step="1" v-model="tempo" />
    <div>{{ tempo }} bpm</div>
  </div>
</template>

<script>
const Node = require("../class/Node");
import { mapGetters, mapMutations } from "vuex";
export default {
  data() {
    return {
      tempo: 60.0,
      lookahead: 25.0,
      scheduleAheadTime: 0.1,

      totalBeats: 4,
      currentBeat: 1,
      nextBeatTime: 0.0,

      notesInQueue: [],
      timerID: null,
    };
  },

  computed: {
    ...mapGetters(["context"]),
  },

  mounted() {
    this.scheduler();
  },

  methods: {
    ...mapMutations(["setNextBeatTime"]),

    nextNote() {
      const secondsPerBeat = 60.0 / this.tempo;

      Node.lastBeatTime = this.nextBeatTime;
      this.nextBeatTime += secondsPerBeat;
      this.setNextBeatTime(this.nextBeatTime);
      Node.nextBeatTime = this.nextBeatTime;
      this.currentBeat =
        this.currentBeat === this.totalBeats ? 1 : this.currentBeat + 1;
    },

    sheduleClickNote(time) {
      const freq = this.currentBeat === 1 ? 440 : 220;
      var osc = this.context.createOscillator();
      osc.connect(this.context.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);

      osc.start(time);
      osc.stop(time + 0.05);
    },

    scheduler() {
      while (
        this.nextBeatTime <
        this.context.currentTime + this.scheduleAheadTime
      ) {
        this.sheduleClickNote(this.nextBeatTime);
        this.nextNote();
      }
      this.timerID = window.setTimeout(this.scheduler, this.lookahead);
    },
  },
};
</script>

<style>
</style>