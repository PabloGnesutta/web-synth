<template>
  <div class="Home" @click="init">
    <div class="header" v-if="inited">
      <div class="buttons">
        <div class="btn" @click="createPiano">Piano</div>
        <div class="btn" @click="createModulator">Modulator</div>
        <!-- <div class="btn" @click="createADSROscillator">ADSR Oscillator</div> -->
        <div class="btn" @click="createCarrier">Oscillator</div>
        <div class="btn" @click="createWiteNoise">White Noise</div>
        <div class="btn" @click="createBiquadFilter">Filter</div>
        <div class="btn" @click="createDelay">Delay</div>
        <div class="btn" @click="createGain">Gain</div>
        <div class="btn" @click="save">GUARDAR</div>
        <div class="btn btn-2" @click="toggleMapping">MAP</div>
      </div>
    </div>

    <div class="tracks">
      <div class="track">
        <div class="nodes" :class="{ connecting: connecting }">
          <div
            class="node"
            v-for="(node, n) in nodes"
            :key="n"
            :ref="'node-' + n"
            :class="[node.nodeType, getCssNodeName(node.name)]"
          >
            <div class="node-header">
              <div class="node-name" @click="nodeClicked(node, n)">
                {{ node.name }}
              </div>
              <!-- Types -->
              <div class="types" v-if="node.types">
                <select @input="setType(node, $event)">
                  <option
                    v-for="type in node.types"
                    :key="type"
                    :selected="type === node.type"
                  >
                    {{ type }}
                  </option>
                </select>
              </div>
            </div>

            <div class="node-output">
              <!-- Start/Stop -->
              <div
                class="start-stop"
                v-if="
                  node.nodeType === 'Carrier' ||
                  node.nodeType === 'ADSROscillator'
                "
              >
                <div
                  class="start"
                  v-if="node.status === 'STOPPED'"
                  @click="startOsc(node)"
                >
                  START
                </div>
                <div class="stop" v-else @click="stopOsc(node)">STOP</div>
              </div>
              <!-- Connections -->
              <div class="connections">
                <div class="outputs" v-if="node.outputs.length > 0">
                  <h5>Outputs</h5>
                  <div
                    class="output"
                    v-for="output in node.outputs"
                    @click="disconnect(node, output)"
                    @mouseenter="onMouseEnterOutput(output)"
                    @mouseleave="onMouseLeaveOutput(output)"
                    :key="output.name"
                  >
                    <span>
                      {{ output.name }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Level -->
              <div
                class="level"
                v-if="node.level"
                :class="getCssNodeName(node.name + ' Level')"
              >
                <h4 class="param-name" @click="levelClicked(node)">Level</h4>
                <div
                  class="knob-wrapper"
                  @click="knobClicked(node.name + '-level')"
                >
                  <knob
                    :ref="node.name + '-level'"
                    :minVal="node.minGain"
                    :maxVal="node.maxGain"
                    :initVal="node.gain"
                    @knobTurned="setNodeGain(node, $event)"
                  />
                </div>
              </div>
            </div>

            <div class="node-params">
              <div class="params-wrapper">
                <div
                  class="audio-params params-container"
                  v-if="node.audioParams.length > 0"
                >
                  <!-- Audio Params -->
                  <p class="group-label">audio params</p>
                  <div
                    class="audio-param param"
                    v-for="(audioParam, apIndex) in node.audioParams"
                    :key="audioParam.name"
                    :class="[getCssNodeName(node.name + ' ' + audioParam.name)]"
                  >
                    <div
                      class="param-name"
                      @click="audioParamClicked(node, audioParam)"
                    >
                      {{ audioParam.name }}
                    </div>

                    <div
                      class="knob-wrapper"
                      @click="knobClicked(node.name + '-' + audioParam.name)"
                    >
                      <knob
                        :ref="node.name + '-' + audioParam.name"
                        :minVal="audioParam.minValue"
                        :maxVal="audioParam.maxValue"
                        :initVal="audioParam.defaultValue"
                        @knobTurned="setAudioParam(node, apIndex, $event)"
                      />
                    </div>
                  </div>
                </div>

                <!-- Inner Node Audio Params -->
                <div
                  class="inner-node-audio-params params-container"
                  v-if="node.innerNodeAudioParams"
                >
                  <p class="group-label">inner node audio</p>
                  <div
                    class="inner-node-audio-param param"
                    v-for="(
                      innerNodeAudioParam, inapIndex
                    ) in node.innerNodeAudioParams"
                    :key="innerNodeAudioParam.name"
                    :class="[
                      getCssNodeName(
                        node.name + ' ' + innerNodeAudioParam.name
                      ),
                      getCssNodeName(innerNodeAudioParam.name),
                    ]"
                  >
                    <!-- la concatenaciión acá arriba tendría que eliminarse, y que construya el nombre en base a
                  calcular el nombre del nodo más el nombre del parámetro -->
                    <div
                      class="param-name"
                      @click="
                        innerNodeAudioParamClicked(
                          node,
                          innerNodeAudioParam,
                          inapIndex
                        )
                      "
                    >
                      {{ innerNodeAudioParam.name }}
                    </div>

                    <div
                      class="knob-wrapper"
                      @click="
                        knobClicked(node.name + '-' + innerNodeAudioParam.name)
                      "
                    >
                      <knob
                        :ref="node.name + '-' + innerNodeAudioParam.name"
                        :minVal="innerNodeAudioParam.minValue"
                        :maxVal="innerNodeAudioParam.maxValue"
                        :initVal="innerNodeAudioParam.defaultValue"
                        @knobTurned="
                          setInnerNodeAudioParam(node, inapIndex, $event)
                        "
                      />
                    </div>
                  </div>
                </div>

                <!-- Custom Params -->
                <div
                  class="custom-params params-container"
                  v-if="node.customParams"
                >
                  <p class="group-label">custom</p>
                  <div
                    class="custom-param param"
                    v-for="(customParam, cpIndex) in node.customParams"
                    :key="customParam.name"
                    :class="[
                      getCssNodeName(node.name + ' ' + customParam.name),
                    ]"
                  >
                    <div
                      class="param-name"
                      @click="customParamClicked(node, customParam, cpIndex)"
                    >
                      {{ customParam.name }}
                    </div>

                    <div
                      class="knob-wrapper"
                      @click="knobClicked(node.name + '-' + customParam.name)"
                    >
                      <knob
                        :ref="node.name + '-' + customParam.name"
                        :minVal="customParam.minValue"
                        :maxVal="customParam.maxValue"
                        :initVal="customParam.defaultValue"
                        @knobTurned="setCustomParam(node, cpIndex, $event)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- DELETE -->
            <div class="delete" @click="deleteNode(n)">X</div>
          </div>
        </div>
      </div>
    </div>

    <div class="scroll-pane" @scroll="paneScrolled">
      <div class="scroll-pane-inner"></div>
    </div>

    <!-- Main Gain -->
    <div class="section">
      <div class="section-inner Main-Gain">
        <h2 @click="mainGainClicked()">Main Gain</h2>
        <div class="knob-wrapper" @click="knobClicked('MainGain')">
          <knob
            :ref="'MainGain'"
            minVal="0"
            maxVal="1"
            :initVal="mainGainKnob"
            @knobTurned="onMainGainKnobInput"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapGetters } from "vuex";
import knob from "../components/knob";
const Node = require("../class/Node");

const Gain = require("../class/Gain");
const ScaleInterface = require("../class/ScaleInterface");
const Modulator = require("../class/Oscillator/Modulator");
const Carrier = require("../class/Oscillator/Carrier");
const ADSROscillator = require("../class/Oscillator/ADSROscillator");
const WhiteNoise = require("../class/Effects/WhiteNoise");
const BiquadFilter = require("../class/BiquadFilter");
const Delay = require("../class/Effects/Delay");
export default {
  name: "Home",
  data() {
    return {
      knobValue: 0,
      inited: false,
      context: null,

      nodes: [],

      originNode: null,
      connecting: false,
      originNodeIndex: null,

      trackGain: null,

      mainGain: null,
      mainGainKnob: 0.5,

      scaleNodes: [],
      scaleGain: null,
      scaleFilter: null,
      scaleInterface: {},

      scaleInterfaces: [],

      keyEnabled: [],

      inputs: [],
      outputs: [],
      maps: [],
      mapping: true,
      refBeignMapped: null,
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

      this.trackGain = new Gain("Track Gain");
      this.trackGain.connectNativeNode(this.mainGain, "Main Gain");

      this.scaleFilter = new BiquadFilter("highpass", "Scale Filter");
      this.scaleFilter.connect(this.trackGain);

      this.nodes.push(new Delay());
      this.nodes.push(new WhiteNoise());
      this.nodes.push(this.scaleFilter);
      this.nodes.push(this.trackGain);

      window.addEventListener("keyup", this.onKeyup);
      window.addEventListener("keydown", this.onKeydown);

      this.initScale();
    },

    initScale() {
      const scaleInterface = new ScaleInterface("sawtooth");
      scaleInterface.connect(this.scaleFilter);
      this.nodes.unshift(scaleInterface);
      this.scaleInterfaces.push(scaleInterface);
      this.scaleInterface = scaleInterface;
    },

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

    mainGainClicked() {
      if (!this.connecting) return;
      this.originNode.connectNativeNode(this.mainGain, "Main Gain");
      this.stopConnect("Connected");
    },

    // Inner Node Audio & Custom Params

    innerNodeAudioParamClicked(Node, customParam, inapIndex) {
      if (!this.connecting) return;
      this.originNode.connectInnerNodeAudioParam(Node, customParam, inapIndex);
      this.stopConnect("Connected");
    },

    setInnerNodeAudioParam(Node, inapIndex, value) {
      Node.setInnerNodeAudioParam(inapIndex, value);
    },

    customParamClicked() {
      if (!this.connecting) return;
      console.log("connect custom param not available yet");
    },

    setCustomParam(Node, cpIndex, value) {
      Node.setCustomParam(cpIndex, value);
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

    deleteNode(n) {
      if (this.connecting) return;
      this.nodes[n].destroy();
      this.nodes.splice(n, 1);
      //ver tema si es scale interface sacarlo del array
    },

    setAudioParam(Node, audioParamIndex, value) {
      Node.setAudioParam(audioParamIndex, value);
    },

    setNodeGain(Node, value) {
      Node.setGain(value);
    },

    setType(Node, e) {
      Node.setType(e.target.value);
      e.target.blur();
    },

    startOsc(Node) {
      if (!this.connecting) Node.start(0);
    },

    stopOsc(Node) {
      if (!this.connecting) Node.stop(0);
    },

    createCarrier() {
      this.nodes.push(new Carrier());
    },
    createADSROscillator() {
      this.nodes.push(new ADSROscillator("sawtooth", 330));
    },
    createModulator() {
      this.nodes.push(new Modulator());
    },
    createBiquadFilter() {
      this.nodes.push(new BiquadFilter());
    },
    createGain() {
      this.nodes.push(new Gain());
    },
    createWiteNoise() {
      this.nodes.push(new WhiteNoise());
    },
    createDelay() {
      this.nodes.push(new Delay());
    },
    createPiano() {
      const scaleInterface = new ScaleInterface("sawtooth");
      this.nodes.push(scaleInterface);
      this.scaleInterfaces.push(scaleInterface);
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
      this.scaleInterfaces.forEach((si) => {
        si.processKeydown(e);
      });
    },

    onKeyup(e) {
      this.keyEnabled[e.keyCode] = true;
      this.scaleInterfaces.forEach((si) => {
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

      const ref = this.$refs[refName][0] || this.$refs[refName];
      this.refBeignMapped = ref;
      ref.startMapping();
    },

    getMIDIMessage({ data }) {
      const cmd = data[0];
      const note = data[1];
      const value = data[2];

      if (this.mapping) {
        let refName = this.refBeignMapped.$vnode.data.ref;
        const exists = this.maps.find((m) => m.refName === refName);
        if (!exists) {
          this.maps.push({
            refName,
            cmd,
            note,
          });
        } else {
          exists.cmd = cmd;
          exists.note = note;
        }
        const ref = this.$refs[refName][0] || this.$refs[refName];
        ref.assignMap(cmd, note);
        return;
      } else {
        const mappedItem = this.maps.find(
          (m) => m.cmd === cmd && m.note === note
        );
        if (!mappedItem) return;
        const ref =
          this.$refs[mappedItem.refName][0] || this.$refs[mappedItem.refName];
        ref.receiveMidi(value);
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

    paneScrolled(e) {
      if (!this.inited) return;

      let x = e.srcElement.scrollLeft;
      let y = e.srcElement.scrollTop;

      this.scaleFilter.setAudioParam(0, x * 10);
      this.scaleFilter.setAudioParam(2, y - 30);
    },

    save() {
      let count = localStorage.getItem("websynth-count");
      if (!count) localStorage.setItem("websynth-count", 0);
      localStorage.setItem("websynth-count", ++count);

      localStorage.setItem(
        "websynth_save_" + count,
        JSON.stringify(this.nodes)
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
    knob,
  },
};
</script>

<style lang="scss" scoped>
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
  margin-top: 1em;
}

.track {
  width: 98%;
  overflow-x: scroll;
}

.node.Track-Gain {
  order: 1;
  // position: absolute;
  // right: 1em;
  z-index: 1;
}

.nodes {
  padding: 1em;
  display: flex;
  // justify-content: center;
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
    font-weight: bold;
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
  min-width: 213px;
  max-width: 213px;
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
