<template>
  <div class="pad-container">
    <div class="top">TOP</div>
    <div
      class="pad"
      @touchstart.prevent="onPadTouchStart"
      @touchend.prevent="onPadTouchEnd"
      @touchcancel.prevent="onPadTouchCancel"
      @touchmove.prevent="onPadTouchMove"
    >
      <div class="under" @touchstart.prevent="underTouchStart">
        <div
          v-for="n in notes"
          :key="n"
          class="band"
          :style="{ backgroundColor: `rgba(${20 * n}, ${10 * n}, ${8 * n})` }"
        ></div>
      </div>
      <p v-for="(log, l) in logs" :key="l">{{ log }}</p>
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
      notes: 12,
    };
  },
  mounted() {
    this.getPadDimensions();
  },

  methods: {
    onPadTouchStart(e) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        // if (e.changedTouches[i].force) {
        const touch = e.changedTouches[i];
        const padY = touch.clientY - this.bounding.y;
        const noteFreqIndex = Math.round(padY.map(0, this.height, 0, this.notes));
        this.touches[touch.identifier] = noteFreqIndex;
        this.$emit('onPadTouchStart', noteFreqIndex);
        // }
      }
    },

    onPadTouchEnd(e) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        // if (e.changedTouches[i].force < 1) {
        const touch = e.changedTouches[i];
        this.$emit('onPadTouchEnd', this.touches[touch.identifier]);
        this.touches[touch.identifier] = null;
        // }
      }
    },

    onPadTouchCancel(e) {
      this.$emit('onPadTouchCancel', e);
    },

    onPadTouchMove(e) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const padY = touch.clientY - this.bounding.y;
        const newNoteFreqIndex = Math.round(padY.map(0, this.height, 0, this.notes));

        if (newNoteFreqIndex !== this.touches[touch.identifier]) {
          this.$emit('onPadTouchEnd', this.touches[touch.identifier]);
          this.touches[touch.identifier] = newNoteFreqIndex;
          this.$emit('onPadTouchStart', newNoteFreqIndex);
        }
      }
    },

    underTouchStart() {
      console.log('under');
    },

    log(msg) {
      this.logs.unshift(msg);
    },
    getPadDimensions() {
      const padDiv = document.querySelector('.pad');
      padDiv.requestFullscreen({ navigationUI: 'hide' }).catch(err => {
        alert('error requesting fullscreen');
      });
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
  padding: 0;
  top: 0;
  left: 0;
  z-index: 99999;
  width: 100%;
  height: 100vh;
  background: gray;
  user-select: none;
}
.top {
  height: 1rem;
}
.pad {
  position: relative;
  z-index: 10;
  height: calc(100vh - 1rem);
  // width: calc(100vw - 1rem);
  background: teal;
  user-select: none;
  background: transparent;
  p {
    text-align: left;
    font-size: 1.5rem;
    font-family: 'Courier New', Courier, monospace;
    padding: 3px;
    font-weight: bold;
    letter-spacing: 1px;
  }
}

.under {
  background: linear-gradient(coral, teal);
  position: absolute;
  left: 0;
  width: 100%;
  height: 100vh;
  .band {
    // background: red;
    height: calc((100vh - 1rem) / 12);
  }
}

@media (min-width: 500px) {
  .pad-container {
    display: none;
  }
}
</style>