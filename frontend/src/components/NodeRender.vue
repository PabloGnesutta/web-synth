<template>
  <div class="container">
    <div
      class="node"
      :class="[Node.nodeType, getCssNodeName(Node.name), { folded: folded }]"
      :ref="Node.name"
    >
      <div class="top-bar">
        <div class="top-left">
          <div
            class="instrument-enabler"
            @click="toggleInstrumentEnabled"
            v-if="Node.nodeRol === 'Instrument'"
          >
            <div
              class="instrument-enabler-inner"
              :class="{ enabled: instrumentEnabled }"
            ></div>
          </div>
          <div class="placeholder" v-else></div>
        </div>
        <div class="top-right" v-if="Node.name !== 'Track Gain'">
          <div class="delete" @click="deleteNode()">X</div>
        </div>
      </div>

      <div class="backdrop" v-if="folded" @click="toggleFold">
        <div class="folded-name">{{ Node.name }}</div>
      </div>

      <!-- Node Name -->
      <div class="node-header">
        <div class="node-name" @click="nodeClicked()">
          {{ Node.name }}
        </div>
        <!-- Types -->
        <div class="types" v-if="Node.types">
          <select @input="setType($event)">
            <option
              :key="type"
              v-for="type in Node.types"
              :selected="type === Node.type"
            >
              {{ type }}
            </option>
          </select>
        </div>
      </div>
      <!-- /node-header -->

      <div class="node-body">
        <div v-if="Node.nodeType === 'Delay'" class="delay-body-wrapper">
          <DelayBody :Node="Node" />
        </div>
        <div v-if="Node.nodeType === 'EQ3'" class="eq3-body-wrapper">
          <EQ3Body :Node="Node" />
        </div>
        <div v-if="Node.nodeType === 'Looper'" class="looper-body-wrapper">
          <LooperBody :Node="Node" />
        </div>
        <div v-if="Node.nodeType === 'Sampler'" class="sampler-body-wrapper">
          <SamplerBody :Node="Node" />
        </div>
        <div v-if="Node.nodeType === 'Duette'" class="duette-body-wrapper">
          <DuetteBody :Node="Node" />
        </div>
        <div v-if="Node.nodeType === 'Femod'" class="femod-body-wrapper">
          <FemodBody :Node="Node" />
        </div>

        <!-- The rest -->
        <div
          v-if="
            Node.nodeType !== 'Delay' &&
            Node.nodeType !== 'EQ3' &&
            Node.nodeType !== 'Femod' &&
            Node.nodeType !== 'Sampler' &&
            Node.nodeType !== 'Duette'
          "
          class="node-body-inner"
        >
          <div class="audio-params params-container" v-if="Node.audioParams">
            <!-- Audio Params -->
            <div
              class="audio-param param"
              :key="audioParam.name"
              v-for="(audioParam, apIndex) in Node.audioParams"
              :class="[getCssNodeName(Node.name + ' ' + audioParam.name)]"
              v-if="
                !(Node.type === 'highshelf' && audioParam.name === 'Q') &&
                !(Node.type === 'lowshelf' && audioParam.name === 'Q') &&
                !(Node.type === 'notch' && audioParam.name === 'gain') &&
                !(Node.type === 'lowpass' && audioParam.name === 'gain') &&
                !(Node.type === 'bandpass' && audioParam.name === 'gain') &&
                !(Node.type === 'highpass' && audioParam.name === 'gain')
              "
            >
              <div
                class="param-name connectable"
                @click="audioParamClicked(audioParam)"
              >
                {{ audioParam.displayName }}
              </div>

              <div
                class="knob-wrapper"
                @click="knobClicked(Node.name + '-' + audioParam.name)"
              >
                <Knob
                  :ref="Node.name + '-' + audioParam.name"
                  :minVal="audioParam.minValue"
                  :maxVal="audioParam.maxValue"
                  :initVal="audioParam.value"
                  :unit="audioParam.unit"
                  @knobTurned="setAudioParam(apIndex, $event)"
                />
              </div>
            </div>
          </div>

          <!-- Inner Node Audio Params -->
          <div
            class="inner-node-audio-params params-container"
            v-if="Node.innerNodeAudioParams"
          >
            <div
              class="inner-node-audio-param param"
              v-for="(
                innerNodeAudioParam, inapIndex
              ) in Node.innerNodeAudioParams"
              :key="innerNodeAudioParam.name"
              :class="[
                getCssNodeName(Node.name + ' ' + innerNodeAudioParam.name),
                getCssNodeName(innerNodeAudioParam.name),
              ]"
            >
              <div class="param-name connectable">
                {{ innerNodeAudioParam.displayName }}
              </div>

              <div
                class="knob-wrapper"
                @click="knobClicked(Node.name + '-' + innerNodeAudioParam.name)"
              >
                <Knob
                  :ref="Node.name + '-' + innerNodeAudioParam.name"
                  :unit="innerNodeAudioParam.unit"
                  :minVal="innerNodeAudioParam.minValue"
                  :maxVal="innerNodeAudioParam.maxValue"
                  :initVal="innerNodeAudioParam.value"
                  @knobTurned="setInnerNodeAudioParam(inapIndex, $event)"
                />
              </div>
            </div>
          </div>

          <!-- Custom Params -->
          <div class="custom-params params-container" v-if="Node.customParams">
            <div
              class="custom-param param"
              v-for="(customParam, cpIndex) in Node.customParams"
              :key="customParam.name"
              :class="[getCssNodeName(Node.name + ' ' + customParam.name)]"
            >
              <div class="param-name">
                {{ customParam.displayName }}
              </div>

              <div
                class="knob-wrapper"
                @click="knobClicked(Node.name + '-' + customParam.name)"
              >
                <div class="knob-wrapper">
                  <Knob
                    :ref="Node.name + '-' + customParam.name"
                    :unit="customParam.unit"
                    :minVal="customParam.minValue"
                    :maxVal="customParam.maxValue"
                    :initVal="customParam.value"
                    @knobTurned="setCustomParam(cpIndex, $event, customParam)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- /node-body-inner -->
      </div>
      <!-- /node-body -->

      <!-- Start/Stop -->
      <div
        class="start-stop"
        v-if="Node.nodeType === 'Carrier' || Node.nodeType === 'ADSROscillator'"
      >
        <div class="start" @click="startOsc()" v-if="Node.status === 'STOPPED'">
          START
        </div>
        <div class="stop" v-else @click="stopOsc()">STOP</div>
      </div>

      <div class="node-footer">
        <!-- Connections -->
        <div class="connections" v-if="Node.nodeType === 'Modulator'">
          <div class="outputs" v-if="Node.outputs.length > 0">
            <h5>Outputs</h5>
            <div
              class="output"
              @click="disconnect(output)"
              v-for="output in Node.outputs"
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

        <!-- Octave/Transpose -->
        <div class="octave-transpose" v-if="Node.octave || Node.transpose">
          <div class="octave" v-if="Node.octave">
            Octave: <span class="value">{{ Node.octave }}</span>
          </div>
          <div class="transpose" v-if="Node.transpose != undefined">
            Transp.: <span class="value"> {{ Node.transpose }}</span>
          </div>
        </div>

        <!-- Dry/Wet -->
        <div
          class="dry-wet"
          v-if="Node.dryWet"
          :class="getCssNodeName(Node.name + ' dry-wet')"
        >
          <div class="param-name connectable">dry/wet</div>
          <div
            class="knob-wrapper"
            @click="knobClicked(Node.name + '-dry-wet')"
          >
            <Knob
              :ref="Node.name + '-dry-wet'"
              :initVal="Node.dryWet.defaultValue"
              :minVal="Node.dryWet.minValue"
              :maxVal="Node.dryWet.maxValue"
              @knobTurned="setDryWet($event)"
            />
          </div>
        </div>

        <!-- Level -->
        <div
          class="level"
          @click="levelClicked"
          :class="getCssNodeName(Node.name + ' Level')"
        >
          <div class="param-name connectable">Level</div>
          <div class="knob-wrapper" @click="knobClicked(Node.name + '-level')">
            <Knob
              :ref="Node.name + '-level'"
              :initVal="Node.gain"
              :minVal="Node.minGain"
              :maxVal="Node.maxGain"
              @knobTurned="setNodeGain($event)"
            />
          </div>
        </div>
      </div>
      <!-- /node-footer -->

      <!-- Track Gain controls -->
      <div class="node-controls" v-if="Node.name === 'Track Gain'">
        <div class="rec-enabled-disabled" @click="toggleRecEnabled">
          <div v-if="recEnabled" class="rec-btn rec-enabled">Rec enabled</div>
          <div v-else class="rec-btn rec-disabled">Rec disabled</div>
        </div>
        <div class="mute-unmute" @click="toggleMute">
          <div class="unmute" v-if="Node.muted">M</div>
          <div class="mute" v-else>M</div>
        </div>
      </div>
    </div>
    <!-- /node -->

    <div class="analyser-wrapper" v-if="analyser">
      <AnalyserRender :analyser="analyser" :parent="Node.name" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";

import Knob from "./Knob";
import AnalyserRender from "./AnalyserRender";
import DelayBody from "./specifig-nodes/DelayBody";
import EQ3Body from "./specifig-nodes/EQ3Body.vue";
import LooperBody from "./specifig-nodes/LooperBody.vue";
import DuetteBody from "./specifig-nodes/DuetteBody.vue";
import FemodBody from "./specifig-nodes/FemodBody.vue";
import SamplerBody from './specifig-nodes/SamplerBody.vue';
export default {
  data() {
    return {
      loopStatus: "CLEARED",
      folded: false,
      muted: false,
    };
  },

  props: ["Node", "analyser", "recEnabled", "instrumentEnabled"],

  computed: {
    ...mapGetters(["context", "appConnecting", "originNode"]),
  },

  mounted() {
    console.log("NodeRender mounted", this.Node);
  },

  methods: {
    ...mapMutations(["setAppConnecting", "setOriginNode"]),

    toggleRecEnabled() {
      this.$emit("toggleRecEnabled");
    },

    toggleFold() {
      this.folded = !this.folded;
    },

    setType(e) {
      this.Node.setType(e.target.value);
      e.target.blur();
      if (this.Node.nodeType === "Carrier") return;
      if (this.Node.audioParams)
        this.setParamsConstraints(this.Node.audioParams);
    },

    setParamsConstraints(params) {
      params.forEach((p) => {
        const refName = this.Node.name + "-" + p.name;
        const ref = this.$refs[refName];
        if (ref)
          if (ref[0])
            ref[0].setParamContraints(p.minValue, p.maxValue, p.defaultValue);
      });
    },

    deleteNode() {
      this.$emit("deleteNode");
    },

    toggleMute() {
      this.muted = !this.muted;
      this.Node.toggleMute();
    },

    toggleInstrumentEnabled() {
      this.$emit("toggleInstrumentEnabled");
    },

    setAudioParam(apIndex, value) {
      this.Node.setAudioParam(apIndex, value);
    },

    setInnerNodeAudioParam(inapIndex, value) {
      this.Node.setInnerNodeAudioParam(inapIndex, value);
    },

    setInnerNodeAudioParamFromChild({ inapIndex, value }) {
      this.setInnerNodeAudioParam(inapIndex, value);
    },

    setCustomParam(cpIndex, value) {
      this.Node.setCustomParam(cpIndex, value);
    },

    setCustomParamFromChild({ cpIndex, value }) {
      this.setCustomParam(cpIndex, value);
    },

    // CONNECTIONS

    startConnect() {
      this.setAppConnecting(true);
      this.setOriginNode(this.Node);
      this.$refs[this.Node.name].classList.add("current-node");
      console.log("Connecting...");
    },

    nodeClicked() {
      console.log("nodeclicked", this.Node);
      if (this.Node.nodeType !== "Modulator") return this.toggleFold();
      if (!this.appConnecting) return this.startConnect();

      if (this.Node.name === this.originNode.name)
        return this.stopConnect("Cancel connect");
    },

    audioParamClicked(audioParam) {
      if (!this.appConnecting) return;

      if (this.Node.name === this.originNode.name)
        return this.stopConnect("Cannot connect to itself");

      this.originNode.connectAudioParam(this.Node, audioParam);
      this.stopConnect("Connected");
    },

    levelClicked() {
      if (!this.appConnecting) return;
      if (this.Node.name === this.originNode.name)
        return this.stopConnect("Cannot connect to itself");

      this.originNode.connectLevel(this.Node);
      this.stopConnect("Connected");
    },

    stopConnect(msg) {
      this.setAppConnecting(false);
      this.$refs[this.Node.name].classList.remove("current-node");
      console.log(msg);
    },

    setDryWet(value) {
      this.Node.setDryWet(parseFloat(value));
    },

    //level

    setNodeGain(value) {
      // this.Node.setGain(value);
      this.Node.outputNode.gain.value = value;
    },

    knobClicked(knobName) {},

    startOsc() {
      this.Node.start(0);
    },

    stopOsc() {
      this.Node.stop(0);
    },

    //outputs

    disconnect(output) {
      if (this.appConnecting) return;
      this.Node.disconnectOutput(output);
      this.onMouseLeaveOutput(output);
    },

    onMouseEnterOutput(output) {
      var el = document.querySelector("." + this.getCssNodeName(output.name));
      el.classList.add("is-connection-destination");
    },

    onMouseLeaveOutput(output) {
      var el = document.querySelector("." + this.getCssNodeName(output.name));
      el.classList.remove("is-connection-destination");
    },

    getCssNodeName(name) {
      return name.replace(new RegExp(" ", "g"), "-");
    },
  },

  components: {
    Knob,
    EQ3Body,
    DelayBody,
    LooperBody,
    DuetteBody,
    FemodBody,
    AnalyserRender,
    SamplerBody,
  },
};
</script>

<style lang="scss">
.container {
  display: flex;
  align-items: flex-end;
}

.node {
  border: 2px solid transparent;
  padding-bottom: 0.1em;
  background: #333;
  color: #f3f3f3;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.2s ease-out;
  gap: 0em;
  .node-name {
    font-size: 1rem;
    text-align: left;
    padding: 0.5em 0;
    display: inline-block;
    user-select: none;
    text-align: center;
    margin-bottom: 0.2em;
    cursor: pointer;
    position: relative;
  }
}

.node.folded {
  width: 34px;
  max-height: 340px;
  overflow: hidden;
  .node-header {
    display: none;
  }
  .backdrop {
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 1;
    cursor: pointer;
    .folded-name {
      transform: rotate(-90deg) translateX(-100%);
      position: inherit;
      bottom: 50%;
      width: 100%;
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      letter-spacing: 1px;
    }
  }
  .delete,
  .fold-unfold {
    display: none;
  }
}

.Modulator .node-name {
  cursor: pointer;
}

.node.Track-Gain {
  padding: 1em;
  border: 1px solid rgb(150, 255, 255);
  min-height: 257px;
}

.top-bar {
  position: absolute;
  width: 100%;
  height: 20px;
  display: flex;
  justify-content: space-between;
}

.instrument-enabler {
  cursor: pointer;
  // position: relative;
  z-index: 1;
  .instrument-enabler-inner {
    width: 15px;
    height: 15px;
    background: red;
    transition: background-color 0.2s ease-out;
  }
  .instrument-enabler-inner.enabled {
    background: green;
  }
}

.delete {
  cursor: pointer;
  background: #444;
  padding: 0 0.2em;
  z-index: 1;
}

.node-header {
  text-align: center;
}
.types {
  margin-bottom: 0.2em;
}

// PARAMS

.params-container {
  // padding-bottom: 0.2em;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  background: #272727;
}

.param {
  min-width: 65px;
  padding: 0.2em;
  cursor: default;
  border: 2px solid transparent;
  transition: border-color 0.2s ease-out, background-color 0.2s ease-out;
  font-size: 0.95rem;
}

.level {
  transition: border-color 0.2s ease-out, background-color 0.2s ease-out;
}

.param-name {
  padding: 0.3em 0.2em 0.5em;
  user-select: none;
  font-size: 0.9rem;
}

// Specific Node Styles:

.Femod {
  width: 205px;
}

.Duette {
  width: 350px;
  // padding: 0 .2em;
}

.Carrier,
.Modulator,
.WhiteNoise,
.Drumkit {
  width: 160px;
}

.BufferSource {
  width: 100px;
}

.EQ3 {
  width: 210px;
}

.Delay {
  width: 160px;
  .param {
    min-width: 78px;
  }
}

.Looper {
  width: 140px;
}

.Compressor {
  width: 200px;
}

.Gain {
  width: 80px;
}

.BiquadFilter {
  width: 140px;
}

.Track-Gain {
  width: 135px;
  .node-name {
    font-size: 1.1rem;
    padding: 0;
    text-align: center;
  }
}

.node-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 0.5em;
}

.connections {
  cursor: default;
}

.octave-transpose {
  text-align: right;
  font-size: 0.9rem;
  margin-right: 0.5em;
  .value {
    color: var(--color-2);
  }
}

.start,
.stop {
  cursor: pointer;
  border: 1px solid var(--color-1);
  padding: 0.2em 0 0.1em;
  font-weight: bold;
}

.stop {
  border: 1px solid red;
}

.outputs {
  text-align: left;
  margin-top: 0.5em;
}

.output {
  cursor: pointer;
  padding: 0.2em;
  font-size: 0.9rem;
  color: var(--color-1);
  margin-bottom: 0.4em;
}

.output:hover {
  color: var(--color-2);
}

.param.is-connection-destination,
.level.is-connection-destination {
  border: 2px solid white;
  background: var(--color-2);
}

// Track gain
.rec-enabled-disabled {
  cursor: pointer;
  margin-bottom: 1em;
}
.rec-btn {
  user-select: none;
}
.rec-enabled {
  color: red;
}
.rec-disabled {
  color: gray;
}

.mute-unmute {
  cursor: pointer;
  .mute,
  .unmute {
    width: 30px;
    padding: 0.2em;
    margin: 0 auto;
    text-align: center;
  }
  .mute {
    background: #111;
  }
  .unmute {
    background: red;
  }
}
</style>