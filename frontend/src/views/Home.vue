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
        :class="{ 'is-current-track': currentTrack === t }"
        @click.self="trackClicked(t)"
      >
        <!-- Instrument -->
        <div class="track-instrument">
          <NodeRender :Node="track.instrument" />
        </div>
        <!-- Effects -->
        <div class="nodes">
          <NodeRender
            v-for="(Node, n) in track.effects"
            :Node="Node"
            :key="n"
            :ref="'Node-' + n"
            @deleteNode="deleteEffect(t, n)"
            @levelClicked="levelClicked(Node)"
          />
        </div>
        <!-- Track Gain -->
        <NodeRender :Node="track.trackGain" />
      </div>
    </div>

    <!-- Main Gain -->
    <div class="section-inner Main-Gain" v-if="inited">
      <h2 @click="mainGainClicked()">Main Gain</h2>
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
const ADSROscillator = require("../class/Oscillator/ADSROscillator");
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
      nodes: [],

      originNode: null,
      connecting: false,
      originNodeIndex: null,

      trackGain: null,
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

    createNewTrack(instrumentNode) {
      //track gain
      this.trackGain = new Gain("Track Gain");
      this.trackGain.setGain(0.4);
      this.trackGain.connectNativeNode(this.mainGain, "Main Gain");

      //instrument
      instrumentNode.connect(this.trackGain);
      if (instrumentNode.nodeType === "ScaleInterface")
        this.keypressListeners.push(instrumentNode); //esto compensa midichannel

      this.tracks.push({
        name: ++this.trackCount,
        instrument: instrumentNode,
        effects: [],
        trackGain: this.trackGain,
      });

      this.currentTrack = 0;
    },

    insertEffect(Node) {
      const effects = this.tracks[this.currentTrack].effects;
      const prev =
        effects[effects.length - 1] ||
        this.tracks[this.currentTrack].instrument;

      const next = this.tracks[this.currentTrack].trackGain;

      prev.disconnect();
      prev.connect(Node);
      Node.connect(next);
      effects.push(Node);
    },

    deleteEffect(t, n) {
      if (this.connecting) return;
      const effects = this.tracks[t].effects;

      const prev = effects[n - 1] || this.tracks[t].instrument;

      console.log("prev", prev);
      const next = effects[n + 1] || this.tracks[t].trackGain; //ultimo nodo, o si no track gain

      prev.disconnect();
      prev.connect(next);

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
      console.log("track clicked");
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

    mainGainClicked() {
      // if (!this.connecting) return;
      // this.originNode.connectNativeNode(this.mainGain, "Main Gain");
      // this.stopConnect("Connected");
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
    },

    onMainGainKnobInput(val) {
      this.mainGain.gain.setValueAtTime(val, 0);
    },

    onKeydown(e) {
      if (!this.keyEnabled[e.keyCode]) return;
      this.keyEnabled[e.keyCode] = false;
      this.keypressListeners.forEach((si) => {
        si.processKeydown(e);
      });
    },

    onKeyup(e) {
      this.keyEnabled[e.keyCode] = true;
      this.keypressListeners.forEach((si) => {
        si.processKeyup(e);
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

    // paneScrolled(e) {
    //   if (!this.inited) return;

    //   let x = e.srcElement.scrollLeft;
    //   let y = e.srcElement.scrollTop;

    //   this.scaleFilter.setAudioParam(0, x * 10);
    //   this.scaleFilter.setAudioParam(2, y - 30);
    // },

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
  .buttons {
    display: flex;
    justify-content: center;
    gap: 1em;
  }

  .btn {
    padding: 1em;
    background: coral;
    cursor: pointer;
  }
}

.tracks {
  margin: 1em 0;
  // padding: 0.5em 0.3em;
  border: 3px solid transparent;
}

.tracks.mapping {
  border: 3px solid teal;
}

.track {
  // width: 99%;
  margin: 0 auto 1em;
  overflow-x: auto;
  background: #111;
  padding: 0.5em;

  display: flex;
  gap: 1em;
  border: 1px solid transparent;
  transition: border-color 0.2s ease-out;
}

.track.is-current-track {
  border: 1px solid teal;
}

.track-gain {
}

.nodes {
  // padding: 0.5em 0.2em;
  display: flex;
  align-items: center;
  gap: 1em;
}

.node {
  border: 2px solid transparent;
  padding: 0.5em 0.2em 0.2em;
  background: #333;
  color: #f3f3f3;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  transition: border-color 0.2s ease-out;
  .node-name {
    font-size: 1.2rem;
    margin-top: 0.5em;
    padding: 0.5em;
    // font-weight: bold;
  }
}

.node-header {
  order: 0;
}

.node-params {
  order: 1;
}

.node-output {
  order: 2;
}

.node.ScaleInterface,
.node.Delay {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  min-width: 205px;
  max-width: 205px;
  gap: 1em;
  .node-header {
    // align-self: flex-end;
    margin-top: 0.5em;
    display: flex;
    align-items: center;
    .node-name {
      margin: 0;
    }
  }
  .node-output {
    // order: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 0.5em;
    .level {
      // order: -1;
      // width: 50%;
    }
    .connections {
      width: 50%;
    }
  }
  .node-params {
    // order: 1;
    // display: flex;
  }
  .params-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 0;
    // margin-top: 1em;
    // gap: 0.5em;
  }
  .param {
    margin-top: 0;
    flex-basis: 30%;
  }
}

// DELAY NODE
.node.Delay {
  min-width: 190px;
  max-width: 190px;
  .params-container {
    min-width: 200px;
    max-width: 200px;
  }
  .param {
    min-width: 85px;
    flex-basis: auto;
  }
}

.delete {
  cursor: pointer;
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.2em 0.4em;
  background: #444;
}

.node-name {
  cursor: pointer;
  // margin-bottom: 0.5em;
}

.types {
  margin-bottom: 0.2em;
}

.params-wrapper {
  // display: flex;
}

.params-container {
  // display: flex;
  // margin-bottom: 1em;
}

.param {
  padding: 0.2em;
  // margin-top: 0.5em;
  cursor: default;
  border: 2px solid transparent;
  transition: border-color 0.2s ease-out;
  font-size: 0.95rem;
  background: #0000003b;
}

.param-name {
  padding: 0.3em 0.2em 0.5em;
}

.is-connection-destination {
  border: 2px solid white;
}

.start,
.stop {
  cursor: pointer;
  border: 1px solid teal;
  padding: 0.2em 0 0.1em;
  font-weight: bold;
}

.stop {
  border: 1px solid red;
}

// IF CONNECTING
.nodes.connecting {
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

.connections {
  cursor: default;
}

.outputs {
  text-align: left;
  margin-top: 0.5em;
  h5 {
    margin-bottom: 0.2em;
  }
}

.output {
  cursor: pointer;
  padding: 0.2em;
  padding-left: 0.5em;
  font-size: 0.95rem;
  color: teal;
  margin-bottom: 0.4em;
}

// El panel tiene que tener el aspecto que quieras (H * W) + 17px por lado por scroll bar (en desktop)

$spWidth: 200px;
$spHeight: 200px;
$scrollBarThickness: 17px;

$yAmount: 60px;
$xAmount: 1000px;

.scroll-pane {
  display: none;
  // height: 217px; //200 + 17
  // width: 217px; //200 + 17
  height: $spHeight + $scrollBarThickness;
  width: $spWidth + $scrollBarThickness;
  background: black;
  overflow: auto;
  padding: 0;
}

// El inner tiene que tener de heigh H + n y width W + n donde n es el máximo rango de medición

.scroll-pane-inner {
  // height: 1200px; //200 + 1000 = 1000 unidades de medición
  // width: 1200px; //100 + 500 = 500 unidades de medición
  height: $spHeight + $yAmount;
  width: $spWidth + $xAmount;
}

.Main-Gain {
  color: #f3f3f3;
  max-width: 300px;
  margin: auto;
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

.group-label {
  display: none;
}

.btn {
  width: 120px;
  border-radius: 10px;
}
</style>
