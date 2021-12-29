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
      barWidth: 0,

      fftSize: 512,
      dataArray: null,
      bufferLength: null,

      expanded: false,

      mode: 'spectrum',
    };
  },

  mounted() {
    this.analyser.fftSize = this.fftSize;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    const refname = 'canvas';
    this.canvas = this.$refs[refname];
    this.ctx = this.canvas.getContext('2d');

    if (this.expanded) this.barWidth = this.canvas.width / this.bufferLength;
    else this.barWidth = this.canvas.width;
    // this.renderWaveForm();
    this.renderSpectrum();
  },

  beforeDestroy() {
    window.cancelAnimationFrame(this.renderWaveForm);
    window.cancelAnimationFrame(this.renderSpectrum);
  },

  methods: {
    switchMode() {
      if (this.mode === 'spectrum') this.mode = 'waveshape';
      else this.mode = 'spectrum';

      if (this.mode === 'spectrum') {
        window.cancelAnimationFrame(this.renderWaveForm);
        this.renderSpectrum();
      } else {
        window.cancelAnimationFrame(this.renderSpectrum);
        this.renderWaveForm();
      }
    },

    canvasClicked() {
      window.cancelAnimationFrame(this.renderSpectrum);
      window.cancelAnimationFrame(this.renderWaveForm);
      this.expanded = !this.expanded;
      if (this.expanded) this.barWidth = (this.canvas.width / this.bufferLength) * 2.5;
      else this.barWidth = this.canvas.width;
    },

    renderSpectrum() {
      this.analyser.getByteFrequencyData(this.dataArray);

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      var barHeight;
      var x = 0;

      for (var i = 0; i < this.bufferLength; i++) {
        barHeight = this.dataArray[i];
        this.ctx.fillStyle = 'rgb(' + barHeight + ',50,50)';
        this.ctx.fillRect(x, this.canvas.height - barHeight / 2, this.barWidth, barHeight / 2);

        if (this.expanded) x += this.barWidth + 1; //
      }

      window.requestAnimationFrame(this.renderSpectrum);
    },

    renderWaveForm() {
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
      this.analyser.getByteTimeDomainData(this.dataArray);
      this.ctx.fillStyle = 'rgb(200, 200, 200)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = 'rgb(2, 2, 2)';

      this.ctx.beginPath();

      var sliceWidth = (this.canvas.width * 1.0) / this.bufferLength;
      var x = 0;

      for (var i = 0; i < this.bufferLength; i++) {
        var v = this.dataArray[i] / 128.0;

        var y = (v * this.canvas.height) / 2;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
      this.ctx.stroke();

      window.requestAnimationFrame(this.renderWaveForm);
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
  background: pink;
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