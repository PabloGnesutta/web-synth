<template>
  <div class="Click">
    <h3>click</h3>

    <div class="section on-off">
      <div class="on" v-if="clickActive" @click="turnOff">ON</div>
      <div class="off" v-if="!clickActive" @click="turnOn">OFF</div>
    </div>

    <div class="section signature">
      <div @click="substractFromTimeSignature" class="time-signature-control">
        -
      </div>
      <div class="current-signature">
        {{ totalBeats }}/{{ beatSubdivition }}
      </div>
      <div @click="addToTimeSignature" class="time-signature-control">+</div>
    </div>

    <div>
      <div class="label">Tempo:</div>
      <input
        type="range"
        min="30"
        max="300"
        step="1"
        v-model="tempoKnobValue"
        @input="setTempoAndSecondsPerBeat"
      />
      <div class="label">{{ tempo }} bpm</div>
    </div>

    <div class="section volume">
      <div class="label">Volume</div>
      <input
        type="range"
        min="0"
        max="1"
        v-model="clickLevel"
        step="0.01"
        @input="setClickLevel"
      />
      <div class="label">{{ clickLevel }}</div>
    </div>
  </div>
</template>

<script>
const Node = require("../class/Node");
import { mapGetters, mapMutations } from "vuex";
export default {
  data() {
    return {
      tempoKnobValue: 60.0,
      tempo: 60.0,
      lookahead: 25.0,
      scheduleAheadTime: 0.1,

      totalBeats: 4,
      nextBeat: 1,
      beatSubdivition: 4,
      nextBeatTime: 0.0,
      // secondsPerBeat: 0,

      timerID: null,

      clickActive: false,
      clickComp: null,
      clickGain: null,
      clickLevel: 0.8,
      clickBuffer1: null,
      clickBuffer2: null,
    };
  },

  computed: {
    ...mapGetters(["context", "secondsPerBeat"]),
  },

  mounted() {
    this.clickGain = this.context.createGain();
    this.clickGain.gain.setValueAtTime(this.clickLevel, 0);
    this.clickGain.connect(this.context.destination);

    this.loadClickSamples();
    this.setTempoAndSecondsPerBeat();

    if (this.clickActive) this.scheduler();
  },

  methods: {
    ...mapMutations(["setNextBeatTime", "setCurrentBeat", "setSecondsPerBeat"]),

    turnOff() {
      window.clearTimeout(this.timerID);
      this.nextBeat = 1;
      this.nextBeatTime = 0.0;
      // this.secondsPerBeat = 0.0;
      this.clickActive = false;
      this.setCurrentBeat(this.nextBeat);
      this.setNextBeatTime(this.nextBeatTime);
      this.setSecondsPerBeat(0.0);
    },

    turnOn() {
      this.nextBeat = 1;
      this.nextBeatTime = this.context.currentTime;
      this.setCurrentBeat(this.nextBeat);
      this.setNextBeatTime(this.nextBeatTime);
      this.setTempoAndSecondsPerBeat();
      this.scheduler();
      this.clickActive = true;
    },

    setClickLevel() {
      this.clickGain.gain.setValueAtTime(this.clickLevel, 0);
    },

    addToTimeSignature() {
      this.nextBeat = 1;
      this.totalBeats = this.totalBeats < 12 ? this.totalBeats + 1 : 1;
    },
    substractFromTimeSignature() {
      this.nextBeat = 1;
      this.totalBeats = this.totalBeats > 1 ? this.totalBeats - 1 : 12;
    },

    nextNote() {
      this.nextBeatTime += this.secondsPerBeat;
      Node.nextBeatTime = this.nextBeatTime;

      this.setNextBeatTime(this.nextBeatTime);
      this.setCurrentBeat(this.nextBeat);

      this.nextBeat = this.nextBeat >= this.totalBeats ? 1 : this.nextBeat + 1;
    },

    setTempoAndSecondsPerBeat() {
      this.tempo = this.tempoKnobValue;
      // this.secondsPerBeat = 60.0 / this.tempo;
      this.setSecondsPerBeat(60.0 / this.tempo);
    },

    sheduleClickNote(time) {
      const source = this.context.createBufferSource();
      if (this.nextBeat === 1) source.buffer = this.clickBuffer1;
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
  },
};
</script>

<style lang="scss" scoped>
.Click {
  margin-top: 1em;
}

.section {
  padding: 0.5em;
}

.on-off {
  user-select: none;
  cursor: pointer;
  display: inline-block;
  padding: 0.5em;
}

.signature {
  display: flex;
  justify-content: center;
  gap: 1em;
  font-size: 1.2rem;
  user-select: none;
  .current-signature {
    padding: 0.2em;
  }
  .time-signature-control {
    cursor: pointer;
    padding: 0.2em 0.4em;
  }
}

.label {
  user-select: none;
}
</style>