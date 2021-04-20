<template>
  <div class="Click">
    <div class="section on-off" :class="{ 'click-on': clickActive }">
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

    <div class="slider-container">
      <span class="label tempo">{{ tempo }} bpm</span>
      <input
        type="range"
        min="30"
        max="300"
        step="1"
        v-model="tempoKnobValue"
        @input="setTempoAndSecondsPerBeat"
      />
    </div>

    <div class="slider-container">
      <span class="label volume">vol: {{ clickLevel }}</span>
      <input
        type="range"
        min="0"
        max="1"
        v-model="clickLevel"
        step="0.01"
        @input="setClickLevel"
      />
    </div>

    <div class="mute-unmute" :class="{ muted: muted }" @click="toggleMute">
      M
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
      lookahead: 25.0,
      scheduleAheadTime: 0.1,

      nextBeat: 1,
      beatSubdivition: 4,
      nextBeatTime: 0.0,

      timerID: null,

      clickActive: false,
      clickComp: null,
      clickGain: null,
      clickLevel: 0.8,
      muted: false,
      clickBuffer1: null,
      clickBuffer2: null,
    };
  },

  computed: {
    ...mapGetters(["context", "tempo", "totalBeats", "secondsPerBeat"]),
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
    ...mapMutations([
      "setTempo",
      "setTotalBeats",
      "setCurrentBeat",
      "setNextBeatTime",
      "setSecondsPerBeat",
    ]),

    turnOff() {
      window.clearTimeout(this.timerID);
      this.nextBeat = 1;
      this.nextBeatTime = 0.0;
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
      this.setSecondsPerBeat(60.0 / this.tempo);
      this.scheduler();
      this.clickActive = true;
    },

    setClickLevel() {
      if (this.muted) return;
      this.clickGain.gain.setValueAtTime(this.clickLevel, 0);
    },

    toggleMute() {
      this.muted = !this.muted;
      if (this.muted) this.clickGain.gain.setValueAtTime(0, 0);
      else this.clickGain.gain.setValueAtTime(this.clickLevel, 0);
    },

    addToTimeSignature() {
      this.nextBeat = 1;
      this.setTotalBeats(this.totalBeats < 12 ? this.totalBeats + 1 : 1);
    },
    substractFromTimeSignature() {
      this.nextBeat = 1;
      this.setTotalBeats(this.totalBeats > 1 ? this.totalBeats - 1 : 12);
    },

    nextNote() {
      this.nextBeatTime += this.secondsPerBeat;
      Node.nextBeatTime = this.nextBeatTime;

      this.setNextBeatTime(this.nextBeatTime);
      this.setCurrentBeat(this.nextBeat);

      this.nextBeat = this.nextBeat >= this.totalBeats ? 1 : this.nextBeat + 1;
    },

    setTempoAndSecondsPerBeat() {
      this.setTempo(this.tempoKnobValue);
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1em;
  background: #333;
}

.on-off {
  user-select: none;
  cursor: pointer;
  display: inline-block;
  div {
    padding: 0.5em;
    background: rosybrown;
    min-width: 50px;
  }
}
.click-on {
  div {
    background: green;
  }
}

.signature {
  display: flex;
  justify-content: center;
  font-size: 1.2rem;
  user-select: none;
  .current-signature {
    padding: 0.2em;
  }
  .time-signature-control {
    font-weight: bold;
    cursor: pointer;
    padding: 0.2em 0.4em;
  }
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.label {
  user-select: none;
}

.label.tempo {
  min-width: 65px;
  text-align: right;
}

.label.volume {
  text-align: left;
  min-width: 60px;
}

.mute-unmute {
  background: cyan;
  padding: 0.5em;
}

.mute-unmute.muted {
  background: red;
}
</style>