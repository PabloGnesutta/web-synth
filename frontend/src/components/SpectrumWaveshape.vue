<template>
  <div class="analyser-container">
    <canvas ref="canvas"></canvas>
    <div class="switch select-none pointer" @click="switchMode">{{ mode }}</div>
  </div>
</template>

<script>
export default {
  name: 'SpectrumWaveshape',
  props: ['analyser'],

  data() {
    return {
      ctx: null,
      canvas: null,
      canvasWidth: null,
      canvasHeight: null,
      freqBarWidth: 0,

      dataArray: null,
      dataArrayLength: null,

      mode: 'spectrum',
      rAF: null,
      now: 0,
      next: 0,
      nextTime: 16,
    };
  },

  mounted() {
    this.canvas = this.$refs['canvas'];
    const canvasContainer = document.querySelector('.analyser-container');
    this.canvas.width = canvasContainer.offsetWidth;
    this.canvas.height = canvasContainer.offsetHeight;
    this.canvasWidth = this.canvas.width;
    this.canvasHeight = this.canvas.height;
    this.ctx = this.canvas.getContext('2d');

    this.startAnimation();
  },

  beforeDestroy() {
    window.cancelAnimationFrame(this.rAF);
  },

  methods: {
    switchMode() {
      if (this.mode === 'spectrum') this.mode = 'oscilloscope';
      else this.mode = 'spectrum';
      this.startAnimation();
    },

    startAnimation() {
      window.cancelAnimationFrame(this.rAF);
      this.now = performance.now();
      this.next = this.now + this.nextTime;

      if (this.mode === 'spectrum') {
        this.dataArrayLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.dataArrayLength);
        this.freqBarWidth = this.canvasWidth / this.analyser.frequencyBinCount;
        this.renderSpectrum();
      } else if (this.mode === 'oscilloscope') {
        this.dataArrayLength = this.analyser.fftSize;
        this.dataArray = new Uint8Array(this.dataArrayLength);
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = 'rgb(2, 2, 2)';
        this.renderOscilloscope();
      }
    },

    // Spectrum
    renderSpectrum() {
      this.rAF = window.requestAnimationFrame(this.renderSpectrum);
      this.now = performance.now();

      if (this.now > this.next) {
        this.next = this.now + this.nextTime;
        this.analyser.getByteFrequencyData(this.dataArray);
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        var barHeight;
        var x = 0;
        for (var i = 0; i < this.dataArrayLength; i++) {
          barHeight = this.dataArray[i].map(0, 255, 1, this.canvasHeight);
          this.ctx.fillStyle = 'rgb(' + barHeight.map(1, this.canvasHeight, 32, 64) + ', 128, 128)';
          this.ctx.fillRect(x, this.canvasHeight, this.freqBarWidth, -barHeight);

          x += this.freqBarWidth; //
        }
      }
    },
    // Oscilloscope
    renderOscilloscope() {
      this.rAF = window.requestAnimationFrame(this.renderOscilloscope);
      this.now = performance.now();

      if (this.now > this.next) {
        this.analyser.getByteTimeDomainData(this.dataArray);
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.ctx.beginPath();

        var sliceWidth = (this.canvasWidth * 1.0) / this.dataArrayLength;
        var x = 0;

        for (var i = 0; i < this.dataArrayLength; i++) {
          var v = this.dataArray[i] / 128.0;
          var y = (v * this.canvasHeight) / 2;

          if (i > 0) this.ctx.lineTo(x, y);
          else this.ctx.moveTo(x, y);

          x += sliceWidth;
        }

        this.ctx.lineTo(this.canvasWidth, this.canvasHeight / 2);
        this.ctx.stroke();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.analyser-container {
  position: relative;
  width: 400px;
  height: 240px;
}
canvas {
  width: 100%;
  display: block;
  background: rgb(201, 201, 201);
  transition: width 0.1s linear;
}
.switch {
  position: absolute;
  top: 0;
  right: 0;
  color: white;
  background: gray;
  padding: 0.2em;
}
</style>