<template>
  <div class="analyser-container">
    <canvas ref="canvas"></canvas>
    <div class="switch select-none pointer" @click="switchMode">{{ mode }}</div>
  </div>
</template>


<script>
// These variables being local instead of instance's is ok because 
// there's only one instance of this spectrum waveshape at a time
const nextTime = 32;
let now = 0;
let next = 0;
let rAF = null;
let ctx = null;
let canvasWidth = null;
let canvasHeight = null;
let freqBarWidth = 0;
let dataArray = null;
let dataArrayLength = null;

export default {
  name: 'SpectrumWaveshape',
  props: ['analyser'],

  data() {
    return {
      mode: 'spectrum',
    };
  },

  mounted() {
    const canvas = this.$refs['canvas'];
    const canvasContainer = document.querySelector('.analyser-container');
    canvas.width = canvasContainer.offsetWidth;
    canvas.height = canvasContainer.offsetHeight;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    ctx = canvas.getContext('2d');

    this.startAnimation();
  },

  beforeDestroy() {
    window.cancelAnimationFrame(rAF);
  },

  methods: {
    switchMode() {
      if (this.mode === 'spectrum') this.mode = 'oscilloscope';
      else this.mode = 'spectrum';
      this.startAnimation();
    },

    startAnimation() {
      window.cancelAnimationFrame(rAF);
      now = performance.now();
      next = now + nextTime;

      if (this.mode === 'spectrum') {
        dataArrayLength = this.analyser.frequencyBinCount;
        dataArray = new Uint8Array(dataArrayLength);
        freqBarWidth = canvasWidth / this.analyser.frequencyBinCount;
        this.renderSpectrum();
      } else if (this.mode === 'oscilloscope') {
        dataArrayLength = this.analyser.fftSize;
        dataArray = new Uint8Array(dataArrayLength);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgb(2, 2, 2)';
        this.renderOscilloscope();
      }
    },

    // Spectrum
    renderSpectrum() {
      rAF = window.requestAnimationFrame(this.renderSpectrum);
      now = performance.now();
      if (now <= next) {
        return;
      }
      next = now + nextTime;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      this.analyser.getByteFrequencyData(dataArray);
      var barHeight;
      var x = 0;
      for (var i = 0; i < dataArrayLength; i++) {
        barHeight = dataArray[i].map(0, 255, 1, canvasHeight);
        ctx.fillStyle = 'rgb(' + barHeight.map(1, canvasHeight, 32, 64) + ', 128, 128)';
        ctx.fillRect(x, canvasHeight, freqBarWidth, -barHeight);
        x += freqBarWidth;
      }
    },
    // Oscilloscope
    renderOscilloscope() {
      rAF = window.requestAnimationFrame(this.renderOscilloscope);
      now = performance.now();
      if (now <= next) {
        return;
      }
      next = now + nextTime;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      this.analyser.getByteTimeDomainData(dataArray);
      ctx.beginPath();
      var sliceWidth = (canvasWidth * 1.0) / dataArrayLength;
      var x = 0;

      for (var i = 0; i < dataArrayLength; i++) {
        var v = dataArray[i] / 128.0;
        var y = (v * canvasHeight) / 2;

        if (i > 0) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(canvasWidth, canvasHeight / 2);
      ctx.stroke();
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