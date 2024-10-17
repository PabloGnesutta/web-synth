<template>
  <canvas ref="canvas"></canvas>
</template>


<script>
const nextTime = 16;

export default {
  name: 'PeakMeter',
  props: ['analyser'],

  data() {
    return {
      ctx: null,
      canvas: null,
      canvasWidth: null,
      canvasHeight: null,

      bufferLength: this.analyser.fftSize,
      dataArray: new Float32Array(this.analyser.fftSize),

      rAF: null,
      now: 0,
      next: 0,
    };
  },

  mounted() {
    this.canvas = this.$refs['canvas'];
    this.canvasWidth = this.canvas.width;
    this.canvasHeight = this.canvas.height;
    this.ctx = this.canvas.getContext('2d');

    const gradient = this.ctx.createLinearGradient(0, this.canvasHeight, 0, 0);
    gradient.addColorStop(0, 'green');
    gradient.addColorStop(0.4, 'green');
    gradient.addColorStop(0.6, 'yellow');
    gradient.addColorStop(0.75, 'red');
    this.ctx.fillStyle = gradient;
    this.startAnimation();
  },

  beforeDestroy() {
    window.cancelAnimationFrame(this.rAF);
  },

  methods: {
    startAnimation() {
      this.now = performance.now();
      this.next = this.now + nextTime;
      this.renderPeaks();
    },

    renderPeaks() {
      this.rAF = window.requestAnimationFrame(this.renderPeaks);
      this.now = performance.now();
      if (this.now <= this.next) {
        return;
      }
      this.next = this.now + nextTime;
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

      this.analyser.getFloatTimeDomainData(this.dataArray);
      let sumOfSquares = 0;
      // let peakInstantaneousPower = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const power = this.dataArray[i] ** 2;
        sumOfSquares += power;
        // peakInstantaneousPower = Math.max(power, peakInstantaneousPower);
      }
      // const peakInstantaneousPowerDecibels = 10 * Math.log10(peakInstantaneousPower);
      // const avgPowerDecibels = 10 * Math.log10(sumOfSquares / this.dataArray.length);
      const avgPower = sumOfSquares / this.dataArray.length;

      let barHeight = 0;
      if (avgPower === 0) {
        barHeight = 0;
      } else if (avgPower < 1) {
        barHeight = avgPower.map(0, 1, 0, this.canvasHeight * 0.75);
      } else {
        barHeight = avgPower.map(1, 20, this.canvasHeight * 0.75, this.canvasHeight);
      }

      this.ctx.fillRect(0, this.canvasHeight, this.canvasWidth, -barHeight);
    },
  },
};
</script>


<style lang="scss" scoped>
canvas {
  width: 13px;
  height: 3rem;
  display: block;
  background: white;
}
</style>