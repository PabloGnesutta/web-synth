<template>
  <div class="click">
    Click
    <div class="on-off" :class="{ 'click-on': clickActive }">
      <div v-if="clickActive" class="on" @click="turnOff">ON</div>
      <div v-if="!clickActive" class="off" @click="turnOn">OFF</div>
    </div>

    <div class="signature">
      <div class="signature-control" @click="substractFromTimeSignature">-</div>
      <div class="current-signature">{{ totalBeats }}/{{ beatSubdivition }}</div>
      <div class="signature-control" @click="addToTimeSignature">+</div>
    </div>

    <div class="slider-container">
      <span class="label tempo">{{ tempo }} bpm</span>
      <input
        v-model="tempoKnobValue"
        class="select-none"
        type="range"
        min="30"
        max="300"
        step="1"
        @input="setTempoWithSlider"
      />
    </div>

    <div class="slider-container">
      <span class="label volume">vol: {{ clickLevel }}</span>
      <input
        v-model="clickLevel"
        class="select-none"
        type="range"
        min="0"
        max="3"
        step="0.1"
        @input="setClickLevel"
      />
    </div>

    <div class="mute-unmute" :class="{ muted: muted }" @click="toggleMute">M</div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
const Node = require('../class/Node');

export default {
  name: 'Click',
  data() {
    return {
      lookahead: 25.0,
      scheduleAheadTime: 0.1,

      nextBeat: 1,
      nextBeatTime: 0.0,
      beatSubdivition: 4,
      tempoKnobValue: 120.0,

      clickActive: false,
      muted: false,

      clickLevel: 1,
      clickGain: null,
      clickBuffer1: null,
      clickBuffer2: null,
      timerID: null,
    };
  },

  computed: {
    ...mapGetters(['context', 'tempo', 'totalBeats', 'secondsPerBeat']),
  },

  mounted() {
    this.clickGain = this.context.createGain();
    this.clickGain.connect(this.context.destination);
    this.clickGain.gain.setValueAtTime(this.clickLevel, 0);

    this.loadClickSamples();
    if (this.clickActive) this.turnOn();
  },

  methods: {
    ...mapMutations(['setTempo', 'setTotalBeats', 'setCurrentBeat', 'setNextBeatTime', 'setSecondsPerBeat']),

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
      this.setCurrentBeat(1);
      this.setNextBeatTime(this.nextBeatTime);
      this.setTempoWithSlider();
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

    localSetSecondsPerBeat() {
      this.setSecondsPerBeat(60.0 / this.tempo);
    },

    setTempoWithSlider() {
      this.setTempo(this.tempoKnobValue);
      this.localSetSecondsPerBeat();
    },

    sheduleClickNote(time) {
      const source = this.context.createBufferSource();
      if (this.nextBeat === 1) source.buffer = this.clickBuffer1;
      else source.buffer = this.clickBuffer2;

      source.connect(this.clickGain);
      source.start(time);
    },

    scheduler() {
      while (this.nextBeatTime < this.context.currentTime + this.scheduleAheadTime) {
        this.sheduleClickNote(this.nextBeatTime);
        this.nextNote();
      }
      this.timerID = window.setTimeout(this.scheduler, this.lookahead);
    },

    loadClickSamples() {
      const that = this;

      const request1 = new XMLHttpRequest();
      request1.open('GET', '/audio/click1.wav');
      request1.responseType = 'arraybuffer';

      request1.onload = function () {
        that.context.decodeAudioData(request1.response, audioBuffer => {
          that.clickBuffer1 = audioBuffer;
        });
      };
      request1.send();

      const request2 = new XMLHttpRequest();
      request2.open('GET', '/audio/click2.wav');
      request2.responseType = 'arraybuffer';

      request2.onload = function () {
        that.context.decodeAudioData(request2.response, audioBuffer => {
          that.clickBuffer2 = audioBuffer;
        });
      };
      request2.send();
    },
  },
};
</script>

<style lang="scss" scoped>
.click {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1em;
  background: #333;
  padding: 0.25rem 0;
}

.on-off {
  display: inline-block;
  user-select: none;
  cursor: pointer;
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
  .signature-control {
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
  background: #111;
  padding: 0.5em;
}

.mute-unmute.muted {
  background: red;
}
</style>