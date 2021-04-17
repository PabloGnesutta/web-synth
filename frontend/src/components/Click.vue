<template>
  <div>
    <div>
      <div>Tempo:</div>
      <input type="range" min="30" max="300" step="1" v-model="tempo" />
      <div>{{ tempo }} bpm</div>
    </div>

    <div class="on-off">
      <div class="on" v-if="clickActive" @click="turnOff">ON</div>
      <div class="off" v-if="!clickActive" @click="turnOn">OFF</div>
    </div>

    <div>
      <div>Volume</div>
      <input
        type="range"
        min="0"
        max="1"
        v-model="clickLevel"
        step="0.01"
        @input="setClickLevel"
      />
      <div>{{ clickLevel }}</div>
    </div>
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

      timerID: null,

      clickActive: false,
      clickComp: null,
      clickGain: null,
      clickLevel: 0.8,
      clickBuffer1: null,
      clickBuffer2: null,
    };
  },

  props: ["mainGain"],

  computed: {
    ...mapGetters(["context"]),
  },

  mounted() {
    this.clickGain = this.context.createGain();
    this.clickGain.gain.setValueAtTime(this.clickLevel, 0);
    this.clickGain.connect(this.mainGain);

    this.loadClickSamples();
    // this.scheduler();
  },

  methods: {
    ...mapMutations(["setNextBeatTime"]),

    loadClickSamples() {
      const that = this;

      const request = new XMLHttpRequest();
      request.open("GET", "/audio/click1.wav");
      request.responseType = "arraybuffer";

      request.onload = function () {
        that.context.decodeAudioData(request.response, (audioBuffer) => {
          that.clickBuffer1 = audioBuffer;
        });
      };

      request.send();

      const request2 = new XMLHttpRequest();
      request2.open("GET", "/audio/click2.wav");
      request2.responseType = "arraybuffer";

      request2.onload = function () {
        that.context.decodeAudioData(request2.response, (audioBuffer) => {
          that.clickBuffer2 = audioBuffer;
        });
      };

      request2.send();
    },

    turnOff() {
      window.clearTimeout(this.timerID);
      this.nextBeatTime = 0.0;
      this.clickActive = false;
    },

    turnOn() {
      this.clickActive = true;
      this.nextBeatTime = this.context.currentTime;
      this.currentBeat = 1;
      this.scheduler();
    },

    setClickLevel() {
      this.clickGain.gain.setValueAtTime(this.clickLevel, 0);
    },

    nextNote() {
      const secondsPerBeat = 60.0 / this.tempo;

      Node.lastBeatTime = this.nextBeatTime;
      this.nextBeatTime += secondsPerBeat;
      Node.nextBeatTime = this.nextBeatTime;
      this.setNextBeatTime(this.nextBeatTime);

      this.currentBeat =
        this.currentBeat === this.totalBeats ? 1 : this.currentBeat + 1;
    },

    sheduleClickNote(time) {
      const source = this.context.createBufferSource();
      if (this.currentBeat === 1) source.buffer = this.clickBuffer1;
      else source.buffer = this.clickBuffer2;

      source.connect(this.clickGain);
      source.start(time);
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