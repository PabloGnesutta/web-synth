<template>
  <div class="AnalyserRender">
    <canvas ref="canvas" :class="{ expanded: expanded }" @click.self="canvasClicked"></canvas>
    <div class="switch" v-if="expanded" @click="switchMode">
      {{ mode }}
    </div>
  </div>
</template>

<script>
//fftSize = 2048; //osciloscopio
//fftSize = 256; //freq bars
export default {
  props: ['analyser'],

  data() {
    return {
      ctx: null,
      canvas: null,
      canvasWidth: null,
      canvasHeight: null,
      freqBarWidth: 0,

      fftSize: 512,
      dataArray: null,
      bufferLength: null,

      expanded: false,

      mode: 'spectrum',
      rAF: null,
    };
  },

  mounted() {
    this.analyser.fftSize = this.fftSize;

    this.canvas = this.$refs['canvas'];
    this.canvasWidth = this.canvas.width;
    this.canvasHeight = this.canvas.height;
    this.ctx = this.canvas.getContext('2d');

    // this.freqBarWidth = this.canvasWidth / this.analyser.frequencyBinCount;
    this.freqBarWidth = (this.canvasWidth / this.analyser.frequencyBinCount) * 2.5;

    this.startAnimation();
  },

  beforeDestroy() {
    window.cancelAnimationFrame(this.rAF);
  },

  methods: {
    switchMode() {
      if (this.mode === 'spectrum') this.mode = 'waveshape';
      else this.mode = 'spectrum';
      this.startAnimation();
    },

    startAnimation() {
      window.cancelAnimationFrame(this.rAF);

      if (this.expanded) {
        if (this.mode === 'spectrum') {
          this.bufferLength = this.fftSize;
          this.dataArray = new Uint8Array(this.bufferLength);
          this.renderSpectrum();
        } else {
          this.bufferLength = this.analyser.frequencyBinCount;
          this.dataArray = new Uint8Array(this.bufferLength);
          this.renderWaveForm();
        }
      } else {
        this.bufferLength = this.fftSize;
        this.dataArray = new Float32Array(this.bufferLength);
        const gradient = this.ctx.createLinearGradient(0, this.canvasHeight, 0, 0);
        gradient.addColorStop(0, 'green');
        gradient.addColorStop(0.4, 'green');
        gradient.addColorStop(0.5, 'yellow');
        gradient.addColorStop(0.75, 'red');
        this.ctx.fillStyle = gradient;
        this.renderPeaks();
      }
    },

    canvasClicked() {
      window.cancelAnimationFrame(this.rAF);
      this.expanded = !this.expanded;
      this.startAnimation();
    },

    renderPeaks() {
      this.rAF = window.requestAnimationFrame(this.renderPeaks);
      this.analyser.getFloatTimeDomainData(this.dataArray);
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

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
        barHeight = avgPower.map(1, 50, this.canvasHeight * 0.75, this.canvasHeight);
      }

      this.ctx.fillRect(0, this.canvasHeight, this.canvasWidth, -barHeight);
    },

    renderSpectrum() {
      this.rAF = window.requestAnimationFrame(this.renderSpectrum);
      this.analyser.getByteFrequencyData(this.dataArray);
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

      var barHeight;
      var x = 0;

      for (var i = 0; i < this.bufferLength; i++) {
        barHeight = this.dataArray[i];
        this.ctx.fillStyle = 'rgb(' + barHeight + ', 50, 50)';
        this.ctx.fillRect(x, this.canvasHeight - barHeight / 2, this.freqBarWidth, barHeight / 2);

        x += this.freqBarWidth + 1; //
      }
    },

    renderWaveForm() {
      this.rAF = window.requestAnimationFrame(this.renderWaveForm);
      this.analyser.getByteTimeDomainData(this.dataArray);
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = 'rgb(2, 2, 2)';

      this.ctx.beginPath();

      var sliceWidth = (this.canvasWidth * 1.0) / this.bufferLength;
      var x = 0;

      for (var i = 0; i < this.bufferLength; i++) {
        var v = this.dataArray[i] / 128.0;

        var y = (v * this.canvasHeight) / 2;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      this.ctx.lineTo(this.canvasWidth, this.canvasHeight / 2);
      this.ctx.stroke();
    },
  },
};
</script>

<style lang="scss" scoped>
.AnalyserRender {
  position: relative;
}
canvas {
  width: 13px;
  height: 3rem;
  display: block;
  background: white;
  cursor: pointer;
  transition: width 0.1s linear;
}
canvas.expanded {
  width: 400px;
}
.switch {
  cursor: default;
  position: absolute;
  top: 0;
  right: 0;
  color: white;
  background: gray;
  padding: 0.2em;
}
</style>