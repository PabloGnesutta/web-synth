<template>
  <div class="Home">
    <div class="welcome-msg" v-if="!inited">
      <p>Welcome to web-synth</p>
      <p>Click anywhere to Start!</p>
    </div>
    <div class="inited" v-if="inited">
      <div class="header">
        <div class="buttons">
          <!-- Instruments -->
          <div
            class="btn btn-instrument"
            @click="createPiano('ScaleInterface')"
          >
            Piano
          </div>
          <div class="btn btn-instrument" @click="createInstrument('Carrier')">
            Oscillator
          </div>
          <div
            class="btn btn-instrument"
            @click="createInstrument('WhiteNoise')"
          >
            White Noise
          </div>
          <!-- Modulator -->
          <br />
          <div class="btn btn-modulator" @click="createModulator">
            Modulator
          </div>
          <!-- Effects -->
          <br />
          <div class="btn btn-effect" @click="createEffect('BiquadFilter')">
            Filter
          </div>
          <div class="btn btn-effect" @click="createEffect('Compressor')">
            Compressor
          </div>
          <div class="btn btn-effect" @click="createEffect('Delay')">Delay</div>
          <div class="btn btn-effect" @click="createEffect('Gain')">Gain</div>
          <!-- REC -->
          <br />
          <div class="btn btn-2 rec" v-if="!recording" @click="rec">REC</div>
          <div class="btn btn-2 stop-rec" v-if="recording" @click="stopRec">
            STOP
          </div>
          <div class="play-stop">
            <div
              class="btn play-recs"
              @click="startPlaying"
              v-if="recordings.length > 0 && !playing"
            >
              PLAY
            </div>
            <div
              @click="stopPlaying"
              class="btn stop-playing"
              v-if="recordings.length > 0 && playing"
            >
              STOP
            </div>
          </div>
          <!-- <div class="btn" @click="save">GUARDAR</div> -->
          <!-- <div class="btn btn-2" @click="toggleMapping">MAP</div> -->
        </div>
      </div>

      <!-- TRACKS -->
      <div class="tracks" :class="{ mapping: mapping }">
        <div
          class="track"
          :key="track.name"
          v-for="(track, t) in tracks"
          :class="{
            selected: currentTrackIndex === t,
            connecting: appConnecting,
          }"
          @click="trackClicked(t)"
        >
          <!-- Modulators -->
          <div class="track-inner">
            <div class="track-modulators">
              <NodeRender
                v-for="(Mod, m) in track.modulators"
                :Node="Mod"
                :key="m"
                @deleteNode="deleteModulator(t, m)"
              />
            </div>

            <!-- Instrument -->
            <div class="track-instrument">
              <NodeRender
                :Node="track.instrument"
                :analyser="track.instrumentAnalyser"
                @deleteNode="deleteTrack(t)"
              />
            </div>

            <!-- Effects -->
            <div class="track-effects">
              <NodeRender
                v-for="(Node, n) in track.effects"
                :Node="Node"
                :analyser="Node.analyser"
                :key="n"
                :ref="'Node-' + n"
                @deleteNode="deleteEffect(t, n)"
                @levelClicked="levelClicked(Node)"
              />
              <div class="track-right-placeholder"></div>
            </div>
          </div>
          <!-- Track Gain -->
          <div class="track-gain">
            <NodeRender
              :Node="track.trackGain"
              :analyser="track.trackGainAnalyser"
              :recEnabled="track.recEnabled"
              @toggleRecEnabled="toggleRecEnabled(t)"
            />
          </div>
        </div>
      </div>

      <!-- Main Gain -->
      <div class="section-inner Main-Gain">
        <h3 @click="mainGainClicked()">Main Gain</h3>
        <div class="knob-wrapper" @click="knobClicked('MainGain')">
          <Knob
            :ref="'MainGain'"
            minVal="0"
            maxVal="1"
            :initVal="mainGainKnob"
            @knobTurned="onMainGainKnobInput"
          />
        </div>
      </div>

      <div class="recordings">
        <!-- <div class="recording" v-for="recording in recordings"></div> -->
      </div>

      <div>
        <canvas id="displaycanvas" width="1200px" height="300px"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
const Node = require("../class/Node");
const Gain = require("../class/Effects/Gain");
const Delay = require("../class/Effects/Delay");
const Compressor = require("../class/Effects/Compressor");
const BiquadFilter = require("../class/Effects/BiquadFilter");

const Carrier = require("../class/Oscillator/Carrier");
const ScaleInterface = require("../class/ScaleInterface");
const WhiteNoise = require("../class/Effects/WhiteNoise");
const Modulator = require("../class/Oscillator/Modulator");

const instrumentsDict = new Map([
  ["Carrier", Carrier],
  ["WhiteNoise", WhiteNoise],
  ["ScaleInterface", ScaleInterface],
]);

const effectsDict = new Map([
  ["Gain", Gain],
  ["Delay", Delay],
  ["Compressor", Compressor],
  ["BiquadFilter", BiquadFilter],
]);

import { mapMutations, mapGetters } from "vuex";
import NodeRender from "../components/NodeRender";
import Knob from "../components/Knob";
import { context } from "../class/Node";

export default {
  name: "Home",
  data() {
    return {
      inited: false,
      context: null,

      tracks: [],
      trackCount: 0,
      currentTrackIndex: 0,
      trankGainDefaultVal: 0.4,

      originNode: null,
      connecting: false,
      originNodeIndex: null,

      mainGain: null,
      mainGainKnob: 0.5,

      keyEnabled: [],
      keypressListeners: [],

      //MIDI
      maps: [],
      inputs: [],
      outputs: [],
      mapping: false,
      refBeignMapped: null,

      //rec
      dest: null,
      mediaRecorder: null,
      chunks: [],
      recording: false,
      recordFinished: false,

      mediaRecorders: [],
      recordings: [],
      blobs: [],

      //play
      playing: false,
      playingBuffers: [],
    };
  },

  computed: {
    ...mapGetters(["appIsMapping", "appConnecting"]),
  },

  mounted() {
    this.keyEnabled = Array(222).fill(true);
    navigator.requestMIDIAccess().then(this.onMIDISuccess, this.onMIDIFailure);
    document.querySelector(".Home").addEventListener("click", this.init);
  },

  methods: {
    ...mapMutations(["setAppIsMapping"]),
    toggleRecEnabled(t) {
      this.tracks[t].recEnabled = !this.tracks[t].recEnabled;
    },

    rec() {
      if (this.recording) return;
      const recordingTracks = this.tracks.filter((t) => t.recEnabled);
      console.log("rec start");
      this.recording = true;
      this.recordFinished = false;

      recordingTracks.forEach((t, i) => {
        let chunks = [];
        let dest = this.context.createMediaStreamDestination();
        t.trackGain.connectNativeNode(dest);

        let mediaRecorder = new MediaRecorder(dest.stream);
        this.mediaRecorders.push(mediaRecorder);

        mediaRecorder.ondataavailable = (evt) => {
          chunks.push(evt.data);
        };

        mediaRecorder.onstop = (evt) => {
          const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
          this.blobs.push(blob);

          const fileReader = new FileReader();

          fileReader.onloadend = () => {
            const arrayBuffer = fileReader.result;

            this.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
              this.recordings.push(audioBuffer);
            });
          };

          fileReader.readAsArrayBuffer(blob);
        };

        mediaRecorder.start();
      });
    },

    stopRec() {
      console.log("rec stop");
      this.mediaRecorders.forEach((mr) => {
        mr.stop();
      });
      (this.mediaRecorders = []), (this.recording = false);
      this.recordFinished = true;
    },

    startPlaying() {
      this.playing = true;
      this.recordings.forEach((audioBuffer) => {
        const source = this.context.createBufferSource();
        source.buffer = audioBuffer;
        // source.loop = true;

        const gain = this.context.createGain();

        source.connect(gain);
        gain.connect(this.mainGain);
        source.start();
        this.playingBuffers.push({
          source,
          gain,
        });

        this.displayBuffer(audioBuffer);
      });

      this.blobs.forEach((blob) => {
        console.log(URL.createObjectURL(blob)); //set as audio src
      });
    },

    displayBuffer(buff) {
      console.log(buff);
      const canvas = document.getElementById("displaycanvas");
      canvas.width = buff.duration * 100;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const context = canvas.getContext("2d");
      var leftChannel = buff.getChannelData(0); // Float32Array describing left channel

      var lineOpacity = canvasWidth / leftChannel.length;
      context.save();
      context.fillStyle = "#222";
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      context.strokeStyle = "#122";
      context.globalCompositeOperation = "lighter";
      context.translate(0, canvasHeight / 2);
      context.globalAlpha = 0.06; // lineOpacity ;
      for (var i = 0; i < leftChannel.length; i++) {
        // on which line do we get ?
        var x = Math.floor((canvasWidth * i) / leftChannel.length);
        var y = (leftChannel[i] * canvasHeight) / 2 - 2;
        // console.log(leftChannel[i])
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x + 1, y);
        context.stroke();
      }
      context.restore();
      console.log("done");
    },

    stopPlaying() {
      this.playingBuffers.forEach((pb) => {
        pb.source.disconnect();
        pb.gain.disconnect();
      });
      this.playingBuffers = [];
      this.playing = false;
    },

    init() {
      if (this.context) return;
      this.inited = true;
      document.querySelector(".Home").removeEventListener("click", this.init);
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      Node.context = this.context;

      this.createMainGain();

      window.addEventListener("keyup", this.onKeyup);
      window.addEventListener("keydown", this.onKeydown);

      this.createTrack(new ScaleInterface("sawtooth"));
    },

    createTrack(instrument) {
      //track gain
      const trackGain = new Gain("Track Gain");
      trackGain.setGain(0.4);
      trackGain.connectNativeNode(this.mainGain, "Main Gain");

      const trackGainAnalyser = this.context.createAnalyser();
      trackGain.connectNativeNode(trackGainAnalyser, "Analyser");

      //instrument
      instrument.connect(trackGain);
      if (instrument.nodeType === "ScaleInterface")
        this.keypressListeners.push(instrument); //esto compensa midichannel

      // const instrumentAnalyser = this.context.createAnalyser();
      // instrument.connectNativeNode(instrumentAnalyser);

      this.tracks.push({
        name: "Track " + ++this.trackCount,
        displayName: "Track " + this.trackCount,
        instrument,
        // instrumentAnalyser,
        modulators: [],
        effects: [],
        trackGain,
        trackGainAnalyser,
        recEnabled: true,
        recorder: null,
      });

      this.currentTrackIndex = this.tracks.length - 1;
      this.currentTrack = this.tracks[this.currentTrackIndex];
    },

    deleteTrack(t) {
      let track = this.tracks[t];
      track.instrument.destroy();
      track.trackGain.destroy();
      track.effects.forEach((e) => {
        e.destroy();
      });
      track.modulators.forEach((m) => {
        m.destroy();
      });
      track = null;
      this.tracks.splice(t, 1);
    },

    insertEffect(Node) {
      const track = this.tracks[this.currentTrackIndex];
      const effects = track.effects;
      const prev = effects[effects.length - 1] || track.instrument;
      const next = track.trackGain;

      prev.disconnect().connect(Node).connect(next);
      effects.push(Node);
    },

    deleteEffect(t, n) {
      const track = this.tracks[t];
      const effects = track.effects;

      const prev = effects[n - 1] || track.instrument;
      const next = effects[n + 1] || track.trackGain;

      prev.disconnect().connect(next);

      effects[n].destroy();
      effects.splice(n, 1);
    },

    deleteModulator(t, m) {
      const trackModulators = this.tracks[t].modulators;
      trackModulators[m].destroy();
      trackModulators.splice(m, 1);
    },

    // CREATE NODES

    createEffect(className) {
      const Node = new (effectsDict.get(className))();
      this.insertEffect(Node);
    },

    createInstrument(className) {
      const Node = new (instrumentsDict.get(className))();
      this.createTrack(Node);
    },

    createModulator() {
      const track = this.tracks[this.currentTrackIndex];
      track.modulators.push(new Modulator("sawtooth"));
    },

    createPiano() {
      const scaleInterface = new ScaleInterface("sawtooth");
      this.createTrack(scaleInterface);
    },

    trackClicked(t) {
      this.currentTrackIndex = t;
      this.currentTrack = this.tracks[this.currentTrackIndex];
    },

    createMainGain() {
      this.mainGain = this.context.createGain();
      this.mainGain.gain.value = this.mainGainKnob;
      this.mainGain.connect(this.context.destination);

      this.analyser = this.context.createAnalyser();
      this.mainGain.connect(this.analyser);
    },

    onMainGainKnobInput(val) {
      this.mainGain.gain.setValueAtTime(val, 0);
    },

    onKeydown(e) {
      if (!this.keyEnabled[e.keyCode]) return;
      this.keyEnabled[e.keyCode] = false;
      this.keypressListeners.forEach((scaleInterface) => {
        scaleInterface.processKeydown(e);
      });
    },

    onKeyup(e) {
      this.keyEnabled[e.keyCode] = true;
      this.keypressListeners.forEach((scaleInterface) => {
        scaleInterface.processKeyup(e);
      });
    },

    // MIDI
    toggleMapping() {
      if (this.refBeignMapped) {
        this.refBeignMapped.stopMapping();
        this.refBeignMapped = null;
      }
      this.mapping = !this.mapping;
      this.setAppIsMapping(this.mapping);
      console.log(this.appIsMapping);
    },

    knobClicked(refName) {
      if (!this.mapping) return;
      if (this.refBeignMapped) {
        this.refBeignMapped.stopMapping();
        this.refBeignMapped = null;
      }

      const knob = this.$refs[refName][0] || this.$refs[refName];
      this.refBeignMapped = knob;
      knob.startMapping();
    },

    getMIDIMessage({ data }) {
      const cmd = data[0];
      const note = data[1];
      const value = data[2];

      if (this.mapping) {
        let refName = this.refBeignMapped.$vnode.data.ref;
        const existingMap = this.maps.find((m) => m.refName === refName);
        if (!existingMap) {
          this.maps.push({
            refName,
            cmd,
            note,
          });
        } else {
          existingMap.cmd = cmd;
          existingMap.note = note;
        }
        const knob = this.$refs[refName][0] || this.$refs[refName];
        knob.assignMap(cmd, note);
        return;
      } else {
        const mappedItem = this.maps.find(
          (m) => m.cmd === cmd && m.note === note
        );
        if (!mappedItem) return;
        const knob =
          this.$refs[mappedItem.refName][0] || this.$refs[mappedItem.refName];
        knob.receiveMidi(value);
      }
    },

    onMIDISuccess(midiAccess) {
      // console.log("MIDI Access:", midiAccess);
      this.inputs = midiAccess.inputs;
      this.outputs = midiAccess.outputs;

      for (var input of this.inputs.values()) {
        input.onmidimessage = this.getMIDIMessage;
      }
    },

    onMIDIFailure() {
      console.log("Could not access your MIDI devices.");
    },

    save() {
      let count = localStorage.getItem("websynth-count");
      if (!count) localStorage.setItem("websynth-count", 0);
      localStorage.setItem("websynth-count", ++count);

      localStorage.setItem(
        "websynth_save_" + count,
        JSON.stringify(this.tracks)
      );
    },

    getCssNodeName(name) {
      return name.replace(new RegExp(" ", "g"), "-");
    },
  },

  beforeDestroy() {
    window.removeEventListener("keyup", this.onKeyup);
    window.removeEventListener("keydown", this.onKeydown);
  },

  components: {
    Knob,
    NodeRender,
  },
};
</script>

<style lang="scss">
.Home {
  min-height: 100vh;
}

.header {
  position: fixed;
  top: 0;
  z-index: 1;
  background: black;
  padding: 0.2em;
  width: 100%;

  .buttons {
    display: flex;
    justify-content: center;
    gap: 1em;
  }

  .btn {
    padding: 0.5em 1em;
    background: gray;
    cursor: pointer;
  }
  .btn-instrument {
    background: var(--color-1);
  }
  .btn-modulator {
    background: var(--color-2);
  }
  .btn-effect {
    background: green;
  }
  .btn.rec {
    background: red;
  }
  .btn.stop-rec {
    background: cyan;
    color: black;
  }
}

.tracks {
  margin: 3em 0 1em;
  border: 3px solid transparent;
}

.tracks.mapping {
  border: 3px solid var(--color-1);
}

.track {
  margin: 0 auto 0.5em;
  // overflow-x: auto;
  background: #111;
  padding: 0.3em 0.5em;

  display: flex;
  align-items: center;
  gap: 0.5em;
  border: 2px solid transparent;
  transition: border-color 0.2s ease-out;
}

.track-inner {
  background: transparent;
  display: flex;
  align-items: center;
  gap: 1em;
  overflow-x: auto;
  padding-bottom: 0.3em;
  flex: 1;
}

.track-right-placeholder {
  // width: 10px;
}

.track-instrument .node .node-name {
  color: var(--color-2);
  font-size: 1.1rem;
}

.track.selected {
  border: 2px solid #ff857c;
}

.track-modulators {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.track-effects {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

// IF CONNECTING
.connecting {
  .node.current-node {
    border: 2px solid yellow;
  }

  .node:not(.current-node):not(.Track-Gain) {
    border-color: green;
    .node-name {
      color: var(--color-2);
    }
    .param-name.connectable {
      color: var(--color-1);
      cursor: pointer;
    }
    .param-name:not(.connectable) {
      color: gray;
    }
  }

  .output {
    cursor: default;
    color: gray;
  }
}

.Main-Gain {
  margin: 1em auto 0;
  color: #f3f3f3;
  max-width: 300px;
  transition: border-color 0.2s ease-out;
}

.level {
  cursor: default;
  transition: border-color 0.2s ease-out;
}

.Main-Gain:not(.is-connection-destination),
.level:not(.is-connection-destination) {
  border: 2px solid transparent;
}

.welcome-msg {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
}

// Scoll Pane
$spWidth: 200px;
$spHeight: 200px;
$scrollBarThickness: 17px;
//@scroll
$xMaxVal: 1000px; //e.srcElement.scrollLeft;
$yMaxVal: 60px; //e.srcElement.scrollTop;
.scroll-pane {
  display: none;
  height: $spHeight + $scrollBarThickness;
  width: $spWidth + $scrollBarThickness;
  background: black;
  overflow: auto;
  padding: 0;
}

.scroll-pane-inner {
  height: $spHeight + $yMaxVal;
  width: $spWidth + $xMaxVal;
}
</style>
