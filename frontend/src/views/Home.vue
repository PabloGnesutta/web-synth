<template>
  <div class="Home" @click="init">
    <div class="header" v-if="inited">
      <div class="buttons">
        <div class="btn btn-instrument" @click="createPiano('ScaleInterface')">
          Piano
        </div>
        <div class="btn btn-instrument" @click="createInstrument('Carrier')">
          Oscillator
        </div>
        <div class="btn btn-instrument" @click="createInstrument('WhiteNoise')">
          White Noise
        </div>
        <br />
        <div class="btn btn-modulator" @click="createModulator">Modulator</div>
        <br />
        <div class="btn btn-effect" @click="createEffect('BiquadFilter')">
          Filter
        </div>
        <div class="btn btn-effect" @click="createEffect('Delay')">Delay</div>
        <div class="btn btn-effect" @click="createEffect('Gain')">Gain</div>
        <br />
        <div class="btn btn-2" v-if="!recording" @click="rec">REC</div>
        <div class="btn btn-2" v-if="recording" @click="stopRec">STOP</div>
        <!-- <div class="btn" @click="save">GUARDAR</div> -->
        <!-- <div class="btn btn-2" @click="toggleMapping">MAP</div> -->
      </div>
    </div>

    <!-- TRACKS -->
    <div class="tracks" :class="{ mapping: mapping }" v-if="inited">
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
        <!-- <h3>{{ track.displayName }}</h3> -->
        <!-- Modulators -->
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
        </div>

        <!-- Track Gain -->
        <div class="track-gain">
          <NodeRender
            :Node="track.trackGain"
            :analyser="track.trackGainAnalyser"
          />
        </div>
      </div>
    </div>

    <!-- Main Gain -->
    <div class="section-inner Main-Gain" v-if="inited">
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

    <br />
    <div v-show="recordFinished">
      <h3>audio</h3>
      <audio controls></audio>
    </div>
    <!-- <div class="scroll-pane" @scroll="paneScrolled">
      <div class="scroll-pane-inner"></div>
    </div> -->
  </div>
</template>

<script>
const Node = require("../class/Node");
const Gain = require("../class/Gain");
const ScaleInterface = require("../class/ScaleInterface");
const Modulator = require("../class/Oscillator/Modulator");
const Carrier = require("../class/Oscillator/Carrier");
const WhiteNoise = require("../class/Effects/WhiteNoise");
const BiquadFilter = require("../class/BiquadFilter");
const Delay = require("../class/Effects/Delay");

const instrumentsDict = new Map([
  ["ScaleInterface", ScaleInterface],
  ["WhiteNoise", WhiteNoise],
  ["Carrier", Carrier],
]);

const effectsDict = new Map([
  ["BiquadFilter", BiquadFilter],
  ["Delay", Delay],
  ["Gain", Gain],
]);

import { mapMutations, mapGetters } from "vuex";
import NodeRender from "../components/NodeRender";
import Knob from "../components/Knob";

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
    };
  },

  computed: {
    ...mapGetters(["appIsMapping", "appConnecting"]),
  },

  mounted() {
    this.keyEnabled = Array(222).fill(true);
    navigator.requestMIDIAccess().then(this.onMIDISuccess, this.onMIDIFailure);
  },

  methods: {
    ...mapMutations(["setAppIsMapping"]),
    rec() {
      if (this.recording) return;
      console.log("rec start");
      this.chunks = [];
      this.dest = this.context.createMediaStreamDestination();
      this.mainGain.connect(this.dest);

      this.mediaRecorder = new MediaRecorder(this.dest.stream);
      this.mediaRecorder.ondataavailable = this.ondataavailable;
      this.mediaRecorder.onstop = this.onstop;

      this.mediaRecorder.start();
      this.recording = true;
      this.recordFinished = false;
    },

    stopRec() {
      console.log("stop rec");
      this.mediaRecorder.stop();
      this.recording = false;
      this.recordFinished = true;
    },

    ondataavailable(evt) {
      this.chunks.push(evt.data);
    },

    onstop(evt) {
      console.log("onstop");
      var blob = new Blob(this.chunks, { type: "audio/ogg; codecs=opus" });
      document.querySelector("audio").src = URL.createObjectURL(blob);

      const fileReader = new FileReader();

      fileReader.onloadend = () => {
        let myArrayBuffer = fileReader.result;

        this.context.decodeAudioData(myArrayBuffer, (audioBuffer) => {
          this.source = this.context.createBufferSource();
          this.source.buffer = audioBuffer;
          this.source.start();
          this.source.loop = true;

          const buffGain = this.context.createGain();
          buffGain.gain.value = 2;
          this.source.connect(buffGain);
          buffGain.connect(this.mainGain);
          console.log("thissource", this.source);
        });
      };

      fileReader.readAsArrayBuffer(blob);
    },

    init() {
      if (this.context) return;
      this.inited = true;
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      Node.context = this.context;

      this.createMainGain();

      window.addEventListener("keyup", this.onKeyup);
      window.addEventListener("keydown", this.onKeydown);

      this.createNewTrack(new ScaleInterface("sawtooth"));
    },

    createNewTrack(instrument) {
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
      this.createNewTrack(Node);
    },

    createModulator() {
      const track = this.tracks[this.currentTrackIndex];
      track.modulators.push(new Modulator("sawtooth"));
    },

    createPiano() {
      const scaleInterface = new ScaleInterface("sawtooth");
      this.createNewTrack(scaleInterface);
    },

    trackClicked(t) {
      this.currentTrackIndex = t;
      this.currentTrack = this.tracks[this.currentTrackIndex];
    },

    //output hover

    // onMouseEnterOutput(output) {
    //   const el = document.querySelector("." + this.getCssNodeName(output.name));
    //   el.classList.add("is-connection-destination");
    // },

    // onMouseLeaveOutput(output) {
    //   const el = document.querySelector("." + this.getCssNodeName(output.name));
    //   el.classList.remove("is-connection-destination");
    // },

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
    background: teal;
  }
  .btn-modulator {
    background: coral;
  }
  .btn-effect {
    background: green;
  }
}

.tracks {
  margin: 3em 0 1em;
  border: 3px solid transparent;
}

.tracks.mapping {
  border: 3px solid teal;
}

.track {
  margin: 0 auto 1em;
  overflow-x: auto;
  background: #111;
  padding: 0.5em;

  display: flex;
  align-items: center;
  gap: 1em;
  border: 1px solid transparent;
  transition: border-color 0.2s ease-out;
}

.track-instrument .node-name {
  color: coral;
}

.track.selected {
  border: 1px solid teal;
}

.track-gain {
}

.is-connection-destination {
  border: 2px solid white;
}

.track-modulators {
  display: flex;
  align-items: center;
  gap: 1em;
}

.track-effects {
  display: flex;
  align-items: center;
  gap: 1em;
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
  color: #f3f3f3;
  max-width: 300px;
  transition: border-color 0.2s ease-out;
  // position: fixed;
  bottom: 5px;
  right: 10px;
}

.level {
  cursor: default;
  transition: border-color 0.2s ease-out;
}

.Main-Gain:not(.is-connection-destination),
.level:not(.is-connection-destination) {
  border: 2px solid transparent;
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
