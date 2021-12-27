<template>
  <div class="pad-container">
    <div
      class="pad"
      @touchstart.prevent="onPadTouchStart"
      @touchend.prevent="onPadTouchEnd"
      @touchcancel.prevent="onPadTouchCancel"
      @touchmove.prevent="onPadTouchMove"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'Pad',
  data() {
    return {
      bounding: null,
      height: null,
      width: null,
      currentIndex: null,
    };
  },
  mounted() {
    const padDiv = document.querySelector('.pad');
    this.bounding = padDiv.getBoundingClientRect();
    this.height = this.bounding.height;
    this.width = this.bounding.width;
  },

  methods: {
    onPadTouchStart(e) {
      const padX = e.touches[0].clientX - this.bounding.x;
      const xPercent = (padX / this.width) * 100;

      const padY = e.touches[0].clientY - this.bounding.y;
      const yPercent = Math.round((padY / this.height) * 100);

      this.currentIndex = Math.round(yPercent.map(0, 100, 0, 12));
      // console.log(this.currentIndex)
      console.log(e);
      this.$emit('onPadTouchStart', this.currentIndex);
    },

    onPadTouchEnd(e) {
      console.log(e);
      this.$emit('onPadTouchEnd', this.currentIndex);
    },

    onPadTouchCancel(e) {
      this.$emit('onPadTouchCancel', e);
    },

    onPadTouchMove(e) {
      const padX = e.touches[0].clientX - this.bounding.x;
      const xPercent = (padX / this.width) * 100;

      const padY = e.touches[0].clientY - this.bounding.y;
      const yPercent = Math.round((padY / this.height) * 100);

      const newIndex = Math.round(yPercent.map(0, 100, 0, 12));
      if (newIndex !== this.currentIndex) {
        this.$emit('onPadTouchEnd', this.currentIndex);
        this.currentIndex = newIndex;
        this.$emit('onPadTouchStart', this.currentIndex);
      }
    },
  },
};
</script>

<style scoped>
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
  background: linear-gradient(#e66465, #071cff);
}
@media (min-width: 500px) {
  .pad-container {
    display: none;
  }
}
</style>