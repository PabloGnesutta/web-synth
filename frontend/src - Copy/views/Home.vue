<template>
  <div class="Home" @click="init">
    <div class="header" v-if="inited">
      <div class="buttons">
        <div class="btn" @click="createPiano">Piano</div>
        <div class="btn" @click="createModulator">Modulator</div>
        <div class="btn" @click="createADSROscillator">ADSR Oscillator</div>
        <div class="btn" @click="createCarrier">Carrier</div>
        <div class="btn" @click="createWiteNoise">White Noise</div>
        <div class="btn" @click="createBiquadFilter">Filter</div>
        <div class="btn" @click="createDelay">Delay</div>
        <div class="btn" @click="createGain">Gain</div>
        <div class="btn" @click="save">GUARDAR</div>
      </div>
    </div>

    <div class="nodes" :class="{ connecting: connecting }">
      <div
        class="node"
        v-for="(node, n) in nodes"
        :key="n"
        :ref="'node-' + n"
        :class="[node.nodeType, getCssNodeName(node.name)]"
      >
        <div class="first">
          <div class="node-name" @click="nodeClicked(node, n)">
            {{ node.name }}
          </div>
          <div class="types" v-if="node.types">
            <select @input="setType(node, $event)">
              <option v-for="type in node.types" :key="type">
                {{ type }}
              </option>
            </select>
          </div>
        </div>

        <div class="second">
          <div class="audio-params">
            <!-- Audio Params -->
            <div
              class="audio-param"
              v-for="(audioParam, apIndex) in node.audioParams"
              :key="audioParam.name"
              :class="[getCssNodeName(node.name + ' ' + audioParam.name)]"
            >
              <div
                class="audio-param-name"
                @click="audioParamClicked(node, audioParam)"
              >
                {{ audioParam.name }}
              </div>

              <div class="knob">
                <div>
                  <input
                    :min="audioParam.minValue"
                    :max="audioParam.maxValue"
                    :step="audioParam.step"
                    :value="audioParam.value"
                    type="range"
                    @input="setAudioParam(node, apIndex, $event)"
                  />
                </div>
                <div class="value">{{ audioParam.value }}</div>
              </div>
            </div>
          </div>
          <!-- Custom Params -->
          <div class="custom-params">
            <div
              class="custom-param"
              v-for="(customParam, cpIndex) in node.customParams"
              :key="customParam.name"
              :class="[getCssNodeName(node.name + ' ' + customParam.name)]"
            >
              <div
                class="custom-param-name"
                @click="customParamClicked(node, customParam, cpIndex)"
              >
                {{ customParam.name }}
              </div>

              <div class="knob">
                <div>
                  <input
                    :min="customParam.minValue"
                    :max="customParam.maxValue"
                    :step="customParam.step"
                    :value="customParam.value"
                    type="range"
                    @input="setCustomParam(node, cpIndex, $event)"
                  />
                </div>
                <div class="value">{{ customParam.value }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="third">
          <!-- Level -->
          <div
            class="level"
            v-if="node.level"
            :class="getCssNodeName(node.name + ' Level')"
          >
            <h4 @click="levelClicked(node)">Level</h4>
            <div class="knob">
              <input
                type="range"
                :min="node.minGain"
                :max="node.maxGain"
                :step="node.gainStep"
                :value="node.gain"
                @input="setNodeGain(node, $event)"
              />
            </div>
            <div class="value">{{ node.gain }}</div>
          </div>
        </div>

        <!-- Start/Stop -->
        <div class="fourth">
          <div
            class="start-stop"
            v-if="
              node.nodeType === 'Carrier' || node.nodeType === 'ADSROscillator'
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
        </div>

        <!-- DELETE -->
        <div class="delete" @click="deleteNode(n)">X</div>
      </div>
    </div>

    <div class="scroll-pane" @scroll="paneScrolled">
      <div class="scroll-pane-inner"></div>
    </div>

    <!-- Main Gain -->
    <div class="section">
      <div class="section-inner Main-Gain">
        <h2 @click="mainGainClicked()">Main Gain</h2>
        <input
          type="range"
          v-model="mainGainKnob"
          min="0"
          max="1"
          step="0.01"
          @input="onMainGainKnobInput"
        />
        <div>{{ mainGainKnob }}</div>
      </div>
    </div>
  </div>
</template>

<script>
const scale = require("../data/scale.js");

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
      inited: false,
      context: null,

      nodes: [],
      originNode: null,
      connecting: false,

      originNode: null,
      originNodeIndex: null,

      trackGain: null,

      mainGain: null,
      mainGainKnob: 0.2,

      piano: null,
      keyPressed: false,
      test_var: "",

      scale: scale,
      scaleNodes: [],
      scaleGain: null,
      scaleFilter: null,
      scaleInterface: {},

      keyEnabled: [],

      octave: 3,
    };
  },

  mounted() {
    this.keyEnabled = Array(222).fill(true);
  },

  beforeDestroy() {
    window.removeEventListener("keyup", this.onKeyup);
    window.removeEventListener("keydown", this.onKeydown);
  },

  methods: {
    init() {
      if (this.context) return;
      this.inited = true;
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      Node.context = this.context;

      this.createMainGain();

      this.trackGain = new Gain("Track Gain");
      this.trackGain.connectNativeNode(this.mainGain, "Main Gain");

      this.scaleFilter = new BiquadFilter("lowpass", "Scale Filter");
      this.scaleFilter.connect(this.trackGain);

      // this.delay = new Delay();
      // this.nodes.push(this.delay);

      // this.whiteNoise = new WhiteNoise();
      // this.nodes.push(this.whiteNoise);
      this.nodes.push(this.scaleFilter);
      this.nodes.push(this.trackGain);

      window.addEventListener("keyup", this.onKeyup);
      window.addEventListener("keydown", this.onKeydown);

      this.initScale();
    },

    initScale() {
      this.scaleInterface = new ScaleInterface("Piano 1");
      this.scaleInterface.connect(this.scaleFilter);
      this.nodes.unshift(this.scaleInterface);
    },

    startConnect(Node, n) {
      console.log("Connecting");
      this.originNode = Node;
      this.connecting = true;

      this.originNodeIndex = n;
      this.$refs["node-" + n][0].classList.add("current-node");
    },

    nodeClicked(Node, n) {
      if (!this.connecting) return this.startConnect(Node, n);

      if (this.originNodeIndex === n)
        return this.stopConnect("Cancel connection");

      if (Node.nodeType === "BufferSource")
        return this.stopConnect("Cannot connect to BufferSource node");

      if (Node.nodeType === "Delay") {
        this.originNode.connectDelay(Node);
      }

      this.originNode.connect(Node);
      this.stopConnect("Connected");
    },

    audioParamClicked(Node, audioParam) {
      if (!this.connecting) return;
      this.originNode.connectAudioParam(Node, audioParam);
      this.stopConnect("Connected");
    },

    levelClicked(Node) {
      if (!this.connecting) return;
      this.originNode.connectOutputNode(Node);
      this.stopConnect("Connected");
    },

    mainGainClicked() {
      if (!this.connecting) return;
      this.originNode.connectNativeNode(this.mainGain, "Main Gain");
      this.stopConnect("Connected");
    },

    // Custom Params

    customParamClicked(Node, customParam, cpIndex) {
      if (!this.connecting) return;
      this.originNode.connectCustomParam(Node, customParam, cpIndex);
      this.stopConnect("Connected");
    },

    setCustomParam(Node, cpIndex, event) {
      Node.setCustomParam(cpIndex, event.target.value);
    },

    stopConnect(msg) {
      this.connecting = false;
      this.$refs["node-" + this.originNodeIndex][0].classList.add(
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
    },

    setAudioParam(Node, audioParamIndex, event) {
      Node.setAudioParam(audioParamIndex, event.target.value);
    },

    setNodeGain(Node, event) {
      Node.setGain(event.target.value);
    },

    setType(Node, e) {
      Node.setType(e.target.value);
    },

    startOsc(Node) {
      if (!this.connecting) Node.start(0);
    },

    stopOsc(Node) {
      if (!this.connecting) Node.stop(0);
    },

    createCarrier() {
      this.nodes.unshift(new Carrier());
    },
    createADSROscillator() {
      this.nodes.unshift(new ADSROscillator("sawtooth", 330));
    },
    createModulator() {
      this.nodes.unshift(new Modulator());
    },
    createBiquadFilter() {
      this.nodes.unshift(new BiquadFilter());
    },
    createGain() {
      this.nodes.unshift(new Gain());
    },
    createWiteNoise() {
      this.nodes.unshift(new WhiteNoise());
    },
    createDelay() {
      this.nodes.unshift(new Delay());
    },
    createPiano() {
      this.nodes.unshift(new ScaleInterface());
    },

    createMainGain() {
      this.mainGain = this.context.createGain();
      this.mainGain.gain.value = this.mainGainKnob;
      this.mainGain.connect(this.context.destination);
    },

    onMainGainKnobInput() {
      this.mainGain.gain.setValueAtTime(this.mainGainKnob, 0);
    },

    onKeydown(e) {
      if (!this.keyEnabled[e.keyCode]) return;

      this.keyEnabled[e.keyCode] = false;
      this.scaleInterface.start(e);
    },

    onKeyup(e) {
      this.keyEnabled[e.keyCode] = true;
      this.scaleInterface.stop(e);
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

  components: {},
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

.nodes {
  margin: 3em 0;
  padding: 1em;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2em;
}

.node {
  border: 2px solid transparent;
  padding: 0.5em;
  background: #333;
  color: #f3f3f3;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.2s ease-out;
}

.delete {
  cursor: pointer;
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.2em 0.4em;
  background: #444;
}

.node-name,
.audio-param-name {
  padding: 0.5em;
  font-weight: bold;
}

.node-name {
  cursor: pointer;
  margin-bottom: 0.5em;
}

.audio-param-name {
  margin-bottom: 0em;
}

.audio-params {
  margin-bottom: 1em;
}

.audio-param,
.custom-param,
.level {
  padding: 0.2em;
  margin-top: 0.5em;
  cursor: default;
  background: #222;
  border: 2px solid transparent;
  transition: border-color 0.2s ease-out;
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

  .audio-param-name {
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
  h5 {
    margin-bottom: 0.2em;
  }
}

.output {
  cursor: pointer;
  padding: 0.2em;
  padding-left: 1em;
  font-size: 1.1rem;
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
</style>
