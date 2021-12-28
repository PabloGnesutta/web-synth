<template>
  <div class="pad-container">
    <div
      class="pad"
      @touchstart.prevent="onPadTouchStart"
      @touchend.prevent="onPadTouchEnd"
      @touchcancel.prevent="onPadTouchCancel"
      @touchmove.prevent="onPadTouchMove"
    >
      <p v-for="(log, l) in logs" :key="l">
        {{ log }}
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Pad',
  data() {
    return {
      logs: [],
      bounding: null,
      height: null,
      width: null,
      noteFreqIndex: null,
    };
  },
  mounted() {
    this.getPadDimensions();
  },

  methods: {
    onPadTouchStart(e) {
      const padY = e.touches[0].clientY - this.bounding.y;
      this.noteFreqIndex = Math.round(padY.map(0, this.height, 0, 12));
      console.log(e.changedTouches);
      for (let i = 0; i < e.changedTouches.length; i++) {
        this.log('++started ' + e.changedTouches[i].identifier);
      }
      this.$emit('onPadTouchStart', this.noteFreqIndex);
    },

    onPadTouchEnd(e) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        this.log('----ended ' + e.changedTouches[i].identifier);
      }
      this.$emit('onPadTouchEnd', this.noteFreqIndex);
    },

    onPadTouchCancel(e) {
      this.$emit('onPadTouchCancel', e);
    },

    onPadTouchMove(e) {
      const padY = e.touches[0].clientY - this.bounding.y;
      const newNoteFreqIndex = Math.round(padY.map(0, this.height, 0, 12));

      if (newNoteFreqIndex !== this.noteFreqIndex) {
        this.$emit('onPadTouchEnd', this.noteFreqIndex);
        this.noteFreqIndex = newNoteFreqIndex;
        this.$emit('onPadTouchStart', this.noteFreqIndex);
      }
    },
    log(msg) {
      this.logs.unshift(msg);
    },
    getPadDimensions() {
      const padDiv = document.querySelector('.pad');
      this.bounding = padDiv.getBoundingClientRect();
      this.height = this.bounding.height;
      this.width = this.bounding.width;
    },
  },
};
</script>

<style lang="scss" scoped>
.pad-container {
  position: fixed;
  padding: 0.5rem;
  top: 0;
  left: 0;
  z-index: 99999;
  width: 100%;
  height: 100vh;
  background: gray;
  user-select: none;
}
.pad {
  height: calc(100vh - 1rem);
  width: calc(100vw - 1rem);
  background: teal;
  user-select: none;
  background: linear-gradient(coral, teal);
  p {
    text-align: left;
    font-size: 1.5rem;
    font-family: 'Courier New', Courier, monospace;
    padding: 3px;
    font-weight: bold;
    letter-spacing: 1px;
  }
}
@media (min-width: 500px) {
  .pad-container {
    display: none;
  }
}
</style>