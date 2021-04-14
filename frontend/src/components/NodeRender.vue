<template>
  <div class="container">
    <div
      class="node"
      :class="[Node.nodeType, getCssNodeName(Node.name)]"
      :ref="Node.name"
    >
      <div
        class="delete"
        @click="deleteNode()"
        v-if="Node.name !== 'Track Gain'"
      >
        X
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
              v-for="type in Node.types"
              :key="type"
              :selected="type === Node.type"
            >
              {{ type }}
            </option>
          </select>
        </div>
      </div>
      <!-- /node-header -->

      <div class="node-params">
        <div class="params-wrapper">
          <div
            class="audio-params params-container"
            v-if="Node.audioParams.length > 0"
          >
            <!-- Audio Params -->
            <div
              class="audio-param param"
              v-for="(audioParam, apIndex) in Node.audioParams"
              :key="audioParam.name"
              :class="[getCssNodeName(Node.name + ' ' + audioParam.name)]"
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
                  :initVal="audioParam.defaultValue"
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
                  :minVal="innerNodeAudioParam.minValue"
                  :maxVal="innerNodeAudioParam.maxValue"
                  :initVal="innerNodeAudioParam.defaultValue"
                  :unit="innerNodeAudioParam.unit"
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
                    :minVal="customParam.minValue"
                    :maxVal="customParam.maxValue"
                    :initVal="customParam.defaultValue"
                    :unit="customParam.unit"
                    @knobTurned="setCustomParam(cpIndex, $event)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Modulation Params -->
          <div
            class="modulation-params params-container"
            v-if="Node.modulationParams"
          >
            <div
              class="modulation-param param"
              v-for="(motulationParam, mpIndex) in Node.modulationParams"
              :key="motulationParam.name"
              :class="[getCssNodeName(Node.name + ' ' + motulationParam.name)]"
            >
              <div class="param-name">
                {{ motulationParam.displayName }}
              </div>

              <div
                class="knob-wrapper"
                @click="knobClicked(Node.name + '-' + motulationParam.name)"
              >
                <div
                  class="knob-wrapper"
                  v-if="motulationParam.name !== 'type'"
                >
                  <Knob
                    :ref="Node.name + '-' + motulationParam.name"
                    :minVal="motulationParam.minValue"
                    :maxVal="motulationParam.maxValue"
                    :initVal="motulationParam.defaultValue"
                    :unit="motulationParam.unit"
                    @knobTurned="setModulationParam(mpIndex, $event)"
                  />
                </div>
                <div class="select-wrapper" v-else>
                  <select @input="setModType(mpIndex, $event)">
                    <option
                      v-for="type in motulationParam.types"
                      :key="type"
                      :selected="type === motulationParam.type"
                    >
                      {{ type }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Loop Controls -->
          <div
            class="loop-controls params-container"
            v-if="Node.nodeType === 'Looper'"
          >
            <div
              class="control-btn start-rec"
              v-if="Node.status === 'CLEARED'"
              @click="startRecording"
            >
              REC
            </div>
            <div
              class="control-btn stop-rec"
              v-if="Node.status === 'RECORDING'"
              @click="stopRecording"
            >
              LOOP
            </div>
            <div
              class="control-btn pause-loop"
              v-if="Node.status === 'PLAYING'"
              @click="stopLoop"
            >
              STOP
            </div>
            <div
              class="control-btn play-loop"
              v-if="Node.status === 'STOPPED'"
              @click="playLoop"
            >
              PLAY
            </div>
            <div
              class="control-btn clear-loop"
              v-if="Node.loopAvailable"
              @click="clearLoop"
            >
              CLEAR
            </div>
          </div>
        </div>
      </div>
      <!-- /node-params -->
      <div class="node-footer">
        <!-- Start/Stop -->
        <div
          class="start-stop"
          v-if="
            Node.nodeType === 'Carrier' || Node.nodeType === 'ADSROscillator'
          "
        >
          <div
            class="start"
            v-if="Node.status === 'STOPPED'"
            @click="startOsc()"
          >
            START
          </div>
          <div class="stop" v-else @click="stopOsc()">STOP</div>
        </div>
        <!-- Connections -->
        <div class="connections" v-if="Node.nodeType === 'Modulator'">
          <div class="outputs" v-if="Node.outputs.length > 0">
            <h5>Outputs</h5>
            <div
              class="output"
              v-for="output in Node.outputs"
              @click="disconnect(output)"
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
          @click="levelClicked"
          v-if="Node.level"
          :class="getCssNodeName(Node.name + ' Level')"
        >
          <div class="param-name">Level</div>
          <div class="knob-wrapper" @click="knobClicked(Node.name + '-level')">
            <Knob
              :ref="Node.name + '-level'"
              :minVal="Node.minGain"
              :maxVal="Node.maxGain"
              :initVal="Node.gain"
              @knobTurned="setNodeGain($event)"
            />
          </div>
        </div>
      </div>
      <!-- /node-footer -->
      <!-- Track Gain controls -->
      <div class="node-controls" v-if="recEnabled !== undefined">
        <div class="rec-enabled-disabled" @click="toggleRecEnabled">
          <div v-if="recEnabled" class="rec-enabled">Rec enabled</div>
          <div v-if="!recEnabled" class="rec-disabled">Rec disabled</div>
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
export default {
  data() {
    return {
      loopStatus: "CLEARED",
    };
  },

  props: ["Node", "analyser", "recEnabled"],

  computed: {
    ...mapGetters(["appConnecting", "originNode"]),
  },

  mounted() {
    if (this.Node.nodeType === "Looper") {
      window.addEventListener("keyup", this.processLoopKeyup);
    }
  },

  methods: {
    ...mapMutations(["setAppConnecting", "setOriginNode"]),

    toggleRecEnabled() {
      this.$emit("toggleRecEnabled");
    },

    setType(e) {
      this.Node.setType(e.target.value);
      e.target.blur();
      if (this.Node.audioParams.length > 0)
        this.setParamsConstraints(this.Node.audioParams);
      // if (this.Node.customParams) //no seteo los custom params para no cambiar el ADSR
      //   this.setParamsConstraints(this.Node.customParams);
    },

    setParamsConstraints(params) {
      params.forEach((p) => {
        const refName = this.Node.name + "-" + p.name;
        const ref = this.$refs[refName][0];
        ref.setParamContraints(p.minValue, p.maxValue, p.defaultValue);
      });
    },

    deleteNode() {
      this.$emit("deleteNode");
    },

    setAudioParam(apIndex, value) {
      this.Node.setAudioParam(apIndex, value);
    },

    setInnerNodeAudioParam(inapIndex, value) {
      this.Node.setInnerNodeAudioParam(inapIndex, value);
    },

    setCustomParam(cpIndex, value) {
      this.Node.setCustomParam(cpIndex, value);
    },

    setModulationParam(mpIndex, value) {
      this.Node.setModulationParam(mpIndex, value);
    },

    setModType(mpIndex, e) {
      e.target.blur();
      this.Node.setModulationParam(mpIndex, e.target.value);
    },

    //Looper
    startRecording() {
      this.Node.startRecording();
    },
    stopRecording() {
      this.Node.stopRecording();
    },
    stopLoop() {
      this.Node.stopLoop();
    },
    playLoop() {
      this.Node.playLoop();
    },
    clearLoop() {
      this.Node.clearLoop();
    },

    processLoopKeyup(e) {
      if (e.key != 0) return;
      console.log("yey", this.Node.status);
      switch (this.Node.status) {
        case "CLEARED":
          this.startRecording();
          break;
        case "RECORDING":
          this.stopRecording();
          break;
        case "PLAYING":
          this.stopLoop();
          break;
        case "STOPPED":
          this.clearLoop();
          break;
      }
    },

    // CONNECTIONS

    startConnect() {
      this.setAppConnecting(true);
      this.setOriginNode(this.Node);
      this.$refs[this.Node.name].classList.add("current-node");
      console.log("Connecting...");
    },

    nodeClicked() {
      if (this.Node.nodeType !== "Modulator") return;
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

    //level

    setNodeGain(value) {
      this.Node.setGain(value);
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
      const el = document.querySelector("." + this.getCssNodeName(output.name));
      el.classList.add("is-connection-destination");
    },

    onMouseLeaveOutput(output) {
      const el = document.querySelector("." + this.getCssNodeName(output.name));
      el.classList.remove("is-connection-destination");
    },

    getCssNodeName(name) {
      return name.replace(new RegExp(" ", "g"), "-");
    },
  },

  components: {
    Knob,
    AnalyserRender,
  },
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  align-items: flex-end;
}

.node {
  border: 2px solid transparent;
  padding-bottom: 0.5em;
  background: #333;
  color: #f3f3f3;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.2s ease-out;
  gap: 0.5em;
  .node-name {
    font-size: 1rem;
    text-align: left;
    padding: 0.5em;
    cursor: default;
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

.delete {
  cursor: pointer;
  position: absolute;
  top: 0;
  right: 0;
  background: #444;
}

.types {
  margin-bottom: 0.2em;
}

.Justinton,
.Modulator,
.Carrier,
.Femod,
.Delay {
  .node-header {
    display: flex;
    align-items: center;
  }
}

// PARAMS

.params-wrapper {
  width: 100%;
}

.params-container {
  padding-bottom: 0.2em;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  background: #0000003b;
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
}

// Specific Node Styles:

.Justinton,
.Femod {
  width: 205px;
}

.Carrier,
.Modulator {
  min-width: 160px;
}

.BufferSource {
  width: 100px;
}

.Delay {
  width: 160px;
  .param {
    min-width: 78px;
  }
}

.Compressor {
  width: 200px;
}

.Gain {
  width: 80px;
}

.BiquadFilter {
  width: 90px;
}

.Looper {
  min-width: 140px;
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

.rec-enabled-disabled {
  cursor: pointer;
}
.rec-enabled {
  color: red;
}
.rec-disabled {
  color: gray;
}

.control-btn {
  padding: 0.4em;
  min-width: 60px;
}
</style>