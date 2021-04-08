<template>
  <div class="Home" @click="init">
    <div>
      <video
        style="height: 200px"
        controls
        src="../../public/video/test.mp4"
      ></video>
    </div>
    <div>
      <!-- <button @click.prevent="initMic">INIT MIC</button>
      <button @click.prevent="stopMic">STOP MIC</button> -->
    </div>

    <!-- Osciladores -->
    <div class="section">
      <div class="section-inner">
        <h2>Osciladores</h2>
        <div>
          <button @click.prevent="unmuteOscillators">PLAY OSC</button>
          <button @click.prevent="muteOscillators">STOP OSC</button>
        </div>
        <div class="osciladores">
          <div class="oscilador" v-for="(osc, o) in osciladores" :key="o">
            <h4>{{ osc.type }}</h4>
            <div class="knobs">
              <!-- Osc Freq -->
              <div class="knob">
                <span class="param">Hz: </span>
                <span class="value">{{ osc.minFreq }}</span>
                <input
                  type="range"
                  :min="osc.minFreq"
                  :max="osc.maxFreq"
                  step="1"
                  v-model="knonbOscillatorFreq[o]"
                  @input="setOscillatorFreq(o)"
                />
                <span>{{ osc.maxFreq }}</span>
                <div>
                  {{ knonbOscillatorFreq[o] }}
                </div>
              </div>

              <!-- Osc Gain -->
              <div class="knob">
                <span class="param">Gain: </span>
                <span class="value">0</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  v-model="knobOscillatorGain[o]"
                  @input="setOscillatorGain(o)"
                />
                <span>1</span>
                <div>
                  {{ knobOscillatorGain[o] }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="section">
      <div class="section-inner">
        <h2>Filtros</h2>
        <div class="filtros">
          <div class="filtro" v-for="(filtro, f) in filtros" :key="f">
            <h4>{{ filtro.desc }}</h4>
            <!-- freq -->
            <div class="knobs">
              <div class="knob">
                <div>
                  <span class="param">Hz: </span>
                  <span class="value">{{ filtro.minFreq }}</span>
                  <input
                    type="range"
                    :min="filtro.minFreq"
                    :max="filtro.maxFreq"
                    v-model="knobFreq[f]"
                    @input="setFilterFreq(f)"
                  />
                  <span>{{ filtro.maxFreq }}</span>
                </div>
                <div>
                  {{ getFilterFreq(f) }}
                </div>
              </div>

              <!-- Q -->
              <div class="knob">
                <span class="param">Q: </span>
                <span class="value">{{ filtro.minQ }}</span>
                <input
                  type="range"
                  :min="filtro.minQ"
                  :max="filtro.maxQ"
                  v-model="knobQ[f]"
                  :step="filtro.qStep"
                  @input="setFilterQ(f)"
                />
                <span>{{ filtro.maxQ }}</span>
                <div>
                  {{ getFilterQ(f) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Gain -->
    <div class="section">
      <div class="section-inner">
        <h2>Gain</h2>
        <span>0</span>
        <input
          type="range"
          v-model="gainKnob"
          min="0"
          max="1"
          step="0.01"
          @input="onGainKnobInput"
        />
        <span>1</span>
        <div>{{ gainKnob }}</div>
      </div>
    </div>
  </div>
</template>

<script>
/*
  tres osciladores conectados a 4 filtros
  un array para cada grupo en /data/componentes.js
  un video que se conecta a la misma cadena
  la posibilidad de utilizar un mic
*/

const { filtros, osciladores } = require("../data/componentes.js");
export default {
  name: "Home",
  data() {
    return {
      context: null,

      whiteNoise: null,

      gain: null,
      gainKnob: 0.5,

      mic: null,

      filtros,
      osciladores,

      knonbOscillatorFreq: [],
      knobOscillatorGain: [],

      filterNodes: [],
      oscillatorNodes: [],
      oscillatorGain: [],
      oscillatorGainNodes: [],

      knobFreq: [],
      knobQ: [],

      mediaStream: null,
      compressor: null,

      oscIntialGain: 0.05,
    };
  },

  mounted() {
    this.filtros.forEach((filtro) => {
      this.knobFreq.push(filtro.freqValue);
      this.knobQ.push(filtro.qValue);
    });

    this.osciladores.forEach((o) => {
      this.knonbOscillatorFreq.push(o.freq);
      this.knobOscillatorGain.push(this.oscIntialGain);
    });
  },

  methods: {
    init() {
      if (this.context) return;
      console.log("init");
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.gain = this.context.createGain();

      this.oscillator = this.context.createOscillator();
      this.oscillator.type = "square";

      this.crearCompressor();
      this.conectarCompresor();
      this.crearFiltros();
      this.conectarFiltros();
      this.crearOsciladores();
      this.crearWhiteNoise();
      this.initVideo();
      this.connectGain();
    },

    crearOsciladores() {
      this.osciladores.forEach((osc) => {
        const gainNode = this.context.createGain();
        gainNode.gain.value = 0;
        this.oscillatorGain.push(this.oscIntialGain);
        this.oscillatorGainNodes.push(gainNode);

        const oscillatorNode = this.context.createOscillator();
        oscillatorNode.type = osc.type;
        oscillatorNode.frequency.setValueAtTime(
          osc.freq,
          this.context.currentTime
        );

        oscillatorNode.connect(gainNode);
        gainNode.connect(this.filterNodes[this.filterNodes.length - 1]);
        oscillatorNode.start();

        this.oscillatorNodes.push(oscillatorNode);
      });

      console.log(this.filterNodes[this.filterNodes.length - 1]);

      // FM:

      const newOsc = this.context.createOscillator();
      newOsc.type = "square";
      const newGain = this.context.createGain();
      newGain.gain.value = 1000;

      newOsc.connect(newGain);
      newGain.connect(this.oscillatorNodes[0].frequency);
      newOsc.start();
    },

    muteOscillators() {
      this.oscillatorGainNodes.forEach((o) => {
        o.gain.value = 0;
      });
    },

    unmuteOscillators() {
      this.oscillatorGainNodes.forEach((o, i) => {
        o.gain.value = this.knobOscillatorGain[i];
      });
    },

    setOscillatorFreq(index) {
      this.oscillatorNodes[index].frequency.setValueAtTime(
        this.knonbOscillatorFreq[index],
        this.context.currentTime
      );
    },

    setOscillatorGain(index) {
      this.oscillatorGainNodes[index].gain.value = this.knobOscillatorGain[
        index
      ];
      // this.oscillatorGainNodes[index].gain.value = this.knobOscillatorGain[
      //   index
      // ];
    },

    crearWhiteNoise() {
      const bufferSize = 2 * this.context.sampleRate;
      const noiseBuffer = this.context.createBuffer(
        1,
        bufferSize,
        this.context.sampleRate
      );
      const output = noiseBuffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.whiteNoise = this.context.createBufferSource();
      this.whiteNoise.buffer = noiseBuffer;
      this.whiteNoise.loop = true;
      const wnGain = this.context.createGain();
      wnGain.gain.value = 0.3;
      this.whiteNoise.connect(wnGain);

      // this.whiteNoise.start(0);

      wnGain.connect(this.filterNodes[this.filterNodes.length - 1]);
    },

    // Filtros

    crearFiltros() {
      this.filtros.forEach((filtro) => {
        const filterNode = this.context.createBiquadFilter();
        filterNode.type = filtro.type;
        filterNode.frequency.setValueAtTime(filtro.freqValue, 0);
        filterNode.Q.setValueAtTime(filtro.qValue, 0);

        this.filterNodes.push(filterNode);
      });
    },

    conectarFiltros() {
      let prev = this.filterNodes[0];
      for (let i = 1; i < this.filterNodes.length; i++) {
        this.filterNodes[i].connect(prev);
        prev = this.filterNodes[i];
      }
      console.log("conecatar filtro 0 a compre");
      this.filterNodes[0].connect(this.compressor);
    },

    // Compresor

    crearCompressor() {
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-10, this.context.currentTime);
      this.compressor.knee.setValueAtTime(40, this.context.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.context.currentTime);
      this.compressor.attack.setValueAtTime(0.7, this.context.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.context.currentTime);
    },

    conectarCompresor() {
      console.log("conectar compresor a gain", this.compressor);
      this.compressor.connect(this.gain);
    },

    connectGain() {
      this.gain.gain.value = this.gainKnob;
      this.gain.connect(this.context.destination);
    },

    // Sources

    initVideo() {
      const video = document.querySelector("video");
      this.mediaStream = this.context.createMediaElementSource(video);
      this.mediaStream.connect(this.filterNodes[this.filterNodes.length - 1]);
    },

    initMic() {
      navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;
      navigator.getUserMedia(
        { video: false, audio: true },
        this.startMic,
        console.log
      );
    },

    startMic(stream) {
      this.mic = this.context.createMediaStreamSource(stream);
    },

    stopMic() {
      this.mic.disconnect(0);
    },

    // Filter

    getFilterFreq(index) {
      return this.knobFreq[index];
    },

    setFilterFreq(index) {
      this.filterNodes[index].frequency.setValueAtTime(
        this.knobFreq[index],
        this.context.currentTime
      );
    },

    getFilterQ(index) {
      return this.knobQ[index];
    },

    setFilterQ(index) {
      this.filterNodes[index].Q.setValueAtTime(
        this.knobQ[index],
        this.context.currentTime
      );
    },

    setGain(value) {
      this.gain.gain.setValueAtTime(value, this.context.currentTime + 0.012);
    },

    onGainKnobInput() {
      this.setGain(this.gainKnob);
    },

    AudioParams(node) {
      const AudioParams = [];
      for (let key in node) {
        if (node[key]) {
          if (node[key].toString().includes("AudioParam")) {
            AudioParams.push(key);
          }
        }
      }
      return AudioParams;
    },
  },

  components: {},
};
</script>

<style scoped>
button {
  display: block;
  max-width: 200px;
  margin: auto;
}

.section {
  max-width: 1000px;
  margin: 0 auto 2em;
}

.filtros,
.osciladores {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.filtro,
.oscilador {
  flex-basis: 300px;
}

.knob {
  margin-bottom: 2em;
}
.param {
}

.value {
}
</style>
