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
      touches: [],
    };
  },
  mounted() {
    this.getPadDimensions();
  },

  methods: {
    onPadTouchStart(e) {
      console.log(e);
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].force) {
          const padY = e.changedTouches[i].clientY - this.bounding.y;
          const noteFreqIndex = Math.round(padY.map(0, this.height, 0, 12));
          this.log('++started ' + e.changedTouches[i].identifier + ' note ' + noteFreqIndex);
          this.touches[e.changedTouches[i].identifier] = noteFreqIndex;
          this.$emit('onPadTouchStart', noteFreqIndex);
        }
      }
    },

    onPadTouchEnd(e) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        this.log(
          '----ended ' +
            e.changedTouches[i].identifier +
            ' note ' +
            this.touches[e.changedTouches[i].identifier]
        );
        if (!e.changedTouches[i].force) {
          this.$emit('onPadTouchEnd', this.touches[e.changedTouches[i].identifier]);
          this.touches[e.changedTouches[i].identifier] = null;
        }
      }
    },

    onPadTouchCancel(e) {
      this.$emit('onPadTouchCancel', e);
    },

    onPadTouchMove(e) {
      // const padY = e.touches[0].clientY - this.bounding.y;
      // const newNoteFreqIndex = Math.round(padY.map(0, this.height, 0, 12));
      // for (let i = 0; i < e.changedTouches.length; i++) {
      //   this.log('----moved ' + e.changedTouches[i].identifier);
      //   if (e.changedTouches[i].force) {
      //     if (newNoteFreqIndex !== this.touches[e.changedTouches[i].identifier]) {
      //       this.$emit('onPadTouchEnd', this.touches[e.changedTouches[i].identifier]);
      //       this.touches[e.changedTouches[i].identifier] = newNoteFreqIndex;
      //       this.$emit('onPadTouchStart', newNoteFreqIndex);
      //     }
      //   }
      // }
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