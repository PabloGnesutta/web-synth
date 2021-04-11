<template>
  <div class="Home" @click="init">
    <div class="header" v-if="inited">
      <div class="buttons">
        <div class="btn" @click="createInstrument('ScaleInterface')">Piano</div>
        <div class="btn" @click="createInstrument('Carrier')">Oscillator</div>
        <div class="btn" @click="createInstrument('WhiteNoise')">
          White Noise
        </div>
        <br />
        <div class="btn" @click="createModulator">Modulator</div>
        <br />
        <!-- <div class="btn" @click="createADSROscillator">ADSR Oscillator</div> -->
        <div class="btn" @click="createEffect('BiquadFilter')">Filter</div>
        <div class="btn" @click="createEffect('Delay')">Delay</div>
        <div class="btn" @click="createEffect('Gain')">Gain</div>
        <br />

        <div class="btn" @click="save">GUARDAR</div>
        <div class="btn btn-2" @click="toggleMapping">MAP</div>
      </div>
    </div>

    <!-- TRACKS -->
    <div class="tracks" :class="{ mapping: mapping }" v-if="inited">
      <div
        class="track"
        :key="track.name"
        v-for="(track, t) in tracks"
        :class="{ selected: currentTrack === t }"
        @click.self="trackClicked(t)"
      >
        <!-- <h3>{{ track.displayName }}</h3> -->
        <!-- Instrument -->
        <div class="track-instrument">
          <NodeRender
            :Node="track.instrument"
            :analyser="track.instrumentAnalyser"
            @deleteNode="deleteTrack(t)"
          />
        </div>
        <!-- Effects -->
        <div class="effects-container">
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
        <NodeRender
          :Node="track.trackGain"
          :analyser="track.trackGainAnalyser"
        />
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
import { context } from "../class/Node";

export default {
  name: "Home",
  data() {
    return {
      inited: false,
      context: null,

      tracks: [],
      nodes: [],

      originNode: null,
      connecting: false,
      originNodeIndex: null,

      trankGainDefaultVal: 0.4,

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

      trackCount: 0,
      currentTrack: 0,

      globalEnvironment: window,

      analyser: null,
      dataArray: null,
      bufferLength: null,
    };
  },

  computed: {
    ...mapGetters(["appIsMapping"]),
  },

  mounted() {
    this.keyEnabled = Array(222).fill(true);
    navigator.requestMIDIAccess().then(this.onMIDISuccess, this.onMIDIFailure);
  },

  methods: {
    ...mapMutations(["setAppIsMapping"]),

    init() {
      if (this.context) return;
      this.inited = true;
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      Node.context = this.context;

      this.createMainGain();

      window.addEventListener("keyup", this.onKeyup);
      window.addEventListener("keydown", this.onKeydown);

      const scaleInterface = new ScaleInterface("sawtooth");

      this.createNewTrack(scaleInterface);
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
      });

      this.currentTrack = this.tracks.length - 1;
    },

    deleteTrack(t) {
      let track = this.tracks[t];
      track.instrument.destroy();
      track.trackGain.destroy();
      track.effects.forEach((e) => {
        e.destroy();
      });
      track = null;
      this.tracks.splice(t, 1);
    },

    insertEffect(Node) {
      const track = this.tracks[this.currentTrack];
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
      this.insertEffect(new Modulator());
    },

    createPiano() {
      const scaleInterface = new ScaleInterface("sawtooth");
      this.insertEffect(scaleInterface);
      this.keypressListeners.push(scaleInterface);
    },

    trackClicked(t) {
      this.currentTrack = t;
    },

    // Connect

    startConnect(Node, n) {
      this.connecting = true;
      this.originNode = Node;
      this.originNodeIndex = n;
      this.$refs["node-" + n][0].classList.add("current-node");
      console.log("Connecting");
    },

    nodeClicked(Node, n) {
      if (!this.connecting) return this.startConnect(Node, n);
      if (Node.name === this.originNode.name)
        return this.stopConnect("Cancel connect");
      if (Node.nodeType === "BufferSource")
        return this.stopConnect("Cannot connect to BufferSource node");

      if (Node.nodeType === "Delay") this.originNode.connectDelay(Node);
      this.originNode.connect(Node);

      this.stopConnect("Connected");
    },

    audioParamClicked(Node, audioParam) {
      if (!this.connecting) return;
      if (Node.name === this.originNode.name)
        return this.stopConnect("Cannot connect to itself");

      this.originNode.connectAudioParam(Node, audioParam);
      this.stopConnect("Connected");
    },

    levelClicked(Node) {
      if (!this.connecting) return;
      if (Node.name === this.originNode.name)
        return this.stopConnect("Cannot connect to itself");

      this.originNode.connectOutputNode(Node);
      this.stopConnect("Connected");
    },

    innerNodeAudioParamClicked(Node, customParam, inapIndex) {
      if (!this.connecting) return;
      this.originNode.connectInnerNodeAudioParam(Node, customParam, inapIndex);
      this.stopConnect("Connected");
    },

    customParamClicked() {
      if (!this.connecting) return;
      console.log("connect custom param not available yet");
    },

    stopConnect(msg) {
      this.connecting = false;
      this.$refs["node-" + this.originNodeIndex][0].classList.remove(
        "current-node"
      );
      console.log(msg);
    },

    disconnect(Node, output) {
      if (this.connecting) return;
      Node.disconnectOutput(output);
      this.onMouseLeaveOutput(output);
    },

    //output hover

    onMouseEnterOutput(output) {
      const el = document.querySelector("." + this.getCssNodeName(output.name));
      el.classList.add("is-connection-destination");
    },

    onMouseLeaveOutput(output) {
      const el = document.querySelector("." + this.getCssNodeName(output.name));
      el.classList.remove("is-connection-destination");
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
  background: rgba(0, 0, 0, 0.089);
  padding: 0.2em;
  width: 100%;

  .buttons {
    display: flex;
    justify-content: center;
    gap: 1em;
  }

  .btn {
    padding: 0.5em;
    background: gray;
    cursor: pointer;
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

// Nodes

.effects-container {
  display: flex;
  align-items: center;
  gap: 1em;
}

// IF CONNECTING
.effects-container.connecting {
  .node.current-node {
    border: 2px solid yellow;
  }

  .node:not(.current-node) {
    border-color: green;
    .node-name {
      color: var(--color-2);
    }
  }

  .param-name {
    color: var(--color-1);
    cursor: pointer;
  }

  .level h4 {
    color: lime;
    cursor: pointer;
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

.btn {
  width: 120px;
  border-radius: 10px;
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
