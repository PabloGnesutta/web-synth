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
        <div v-if="Node.nodeType === 'Delay'" class="delay-wrapper">
          <DelayBody
            :Node="Node"
            @setCustomParam="setCustomParamFromChild"
            @setInnerNodeAudioParam="setInnerNodeAudioParamFromChild"
          />
        </div>
        <div v-else class="node-body-inner">
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
              :key="motulationParam.name"
              v-for="(motulationParam, mpIndex) in Node.modulationParams"
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
                    :unit="motulationParam.unit"
                    :minVal="motulationParam.minValue"
                    :maxVal="motulationParam.maxValue"
                    :initVal="motulationParam.value"
                    @knobTurned="setModulationParam(mpIndex, $event)"
                  />
                </div>
                <div class="select-wrapper" v-else>
                  <select @input="setModType(mpIndex, $event)">
                    <option
                      :key="type"
                      v-for="type in motulationParam.types"
                      :selected="type === motulationParam.value"
                    >
                      {{ type }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <!-- /modulation-params -->

          <!-- Looper -->
          <div class="loop-controls" v-if="Node.nodeType === 'Looper'">
            <div class="control-btns params-container">
              <div
                class="control-btn start-rec"
                @click="scheduleLoopStartRecording"
                v-if="Node.status === 'CLEARED'"
              >
                REC
              </div>
              <div
                class="control-btn stop-rec"
                @click="scheduleLoopStopRecording"
                v-if="Node.status === 'RECORDING'"
              >
                LOOP
              </div>
              <div
                class="control-btn pause-loop"
                @click="stopLoop"
                v-if="Node.status === 'PLAYING'"
              >
                STOP
              </div>
              <div
                class="control-btn play-loop"
                @click="playLoop"
                v-if="Node.loopAvailable && Node.status === 'STOPPED'"
              >
                PLAY
              </div>
              <div class="control-btn" v-if="Node.status === 'STARTING'">
                STARTING
              </div>
              <div
                class="control-btn clear-loop"
                @click="clearLoop"
                v-if="Node.loopAvailable"
              >
                CLEAR
              </div>
            </div>
            <!-- Upload -->

            <div class="upload-loop">
              <div class="label">{{ loopFileName || "Load Loop" }}</div>
              <input type="file" @change="loadLoopBuffer" />
            </div>
            <div class="download-loop">
              <span class="label" v-if="Node.looperBlob" @click="downloadLoop">
                Download
              </span>
            </div>
          </div>
        </div>
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
        <div class="octave-transpose" v-if="Node.nodeRol === 'Instrument'">
          <div class="octave" v-if="Node.octave">Octave: {{ Node.octave }}</div>
          <div class="transpose" v-if="Node.transpose != undefined">
            Transp.: {{ Node.transpose }}
          </div>
        </div>

        <!-- Level -->
        <div
          class="level"
          v-if="Node.level"
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
export default {
  data() {
    return {
      loopStatus: "CLEARED",
      loopFileName: "",
      muted: false,
    };
  },

  props: ["Node", "analyser", "recEnabled", "instrumentEnabled"],

  computed: {
    ...mapGetters([
      "context",
      "totalBeats",
      "currentBeat",
      "nextBeatTime",
      "secondsPerBeat",
      "appConnecting",
      "originNode",
    ]),
  },

  mounted() {
    if (this.Node.nodeType === "Looper") {
      window.addEventListener("keyup", this.processLoopKeyup);
    }
    console.log("NodeRender mounted", this.Node);
    // this.type = this.Node.type;
  },

  methods: {
    ...mapMutations(["setAppConnecting", "setOriginNode"]),

    toggleRecEnabled() {
      this.$emit("toggleRecEnabled");
    },

    setType(e) {
      this.Node.setType(e.target.value);
      e.target.blur();
      if (this.Node.nodeType === "Carrier") return;
      if (this.Node.audioParams.length > 0)
        this.setParamsConstraints(this.Node.audioParams);
      // if (this.Node.customParams) //no seteo los custom params para no cambiar el ADSR seteado
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

    setModulationParam(mpIndex, value) {
      this.Node.setModulationParam(mpIndex, value);
    },

    setModType(mpIndex, e) {
      e.target.blur();
      this.Node.setModulationParam(mpIndex, e.target.value);
    },

    //Looper
    scheduleLoopStartRecording() {
      const beatsRemainingTo1 = this.totalBeats - this.currentBeat;
      const nextBeatTime =
        this.nextBeatTime + beatsRemainingTo1 * this.secondsPerBeat;

      this.Node.startRecording(nextBeatTime);
    },

    scheduleLoopStopRecording() {
      const beatsRemainingTo1 = this.totalBeats - this.currentBeat;
      const nextBeatTime =
        this.nextBeatTime + beatsRemainingTo1 * this.secondsPerBeat;

      // this.Node.nextBeatTime = nextBeatTime;
      this.Node.stopRecording(nextBeatTime);
    },

    playLoop() {
      this.Node.playLoop(this.nextBeatTime);
    },
    stopLoop() {
      this.Node.stopLoop();
    },
    clearLoop() {
      this.Node.clearLoop();
    },

    downloadLoop() {
      const a = document.createElement("a");
      let fileName = "websynth-loop-" + new Date().toLocaleString("es-AR");
      fileName = prompt("Loop name: ", fileName);
      if (!fileName) return;
      a.setAttribute("href", URL.createObjectURL(this.Node.looperBlob));
      a.setAttribute("download", fileName);
      a.click();
    },

    loadLoopBuffer(e) {
      const file = e.target.files[0];
      this.loopFileName = file.name;

      const fileReader = new FileReader();

      fileReader.onloadend = () => {
        const arrayBuffer = fileReader.result;

        this.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
          this.Node.setAudioBuffer(audioBuffer);
        });
      };

      fileReader.readAsArrayBuffer(file);
    },

    processLoopKeyup(e) {
      if (e.keyCode != 48) return; //0 key
      switch (this.Node.status) {
        case "CLEARED":
          this.scheduleLoopStartRecording();
          break;
        case "RECORDING":
          this.scheduleLoopStopRecording();
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
    DelayBody,
    AnalyserRender,
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
    user-select: none;
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

.instrument-enabler {
  cursor: pointer;
  position: absolute;
  top: 0;
  left: 0;
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
    padding: 0.5em 0.5em 0;
  }
}

// PARAMS

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
  user-select: none;
  font-size: 0.9rem;
}

// Specific Node Styles:

.Justinton,
.Femod {
  width: 205px;
}

.Carrier,
.Modulator,
.WhiteNoise {
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

// Looper

.Looper {
  min-width: 140px;
}

.control-btns {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  min-height: 73px;
}
.control-btn {
  padding: 0.4em;
  min-width: 60px;
  cursor: pointer;
  background: var(--color-1);
}
.upload-loop {
  margin-top: 0.5em;
  width: 100%;
  background: #111;
  position: relative;
  .label {
    padding: 0.6em;
    width: 200px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  input {
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    // z-index: 10;
  }
}

.upload-loop:hover {
  background: var(--color-1);
}

.download-loop {
  margin-top: 0.2em;
  .label {
    cursor: default;
    user-select: none;
    color: #bbb;
    padding: 0.2em;
  }
  .label:hover {
    color: var(--color-2);
  }
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
    width: 20px;
    height: 20px;
    margin: 0 auto;
    text-align: center;
  }
  .mute {
    background: green;
  }
  .unmute {
    background: red;
  }
}
</style>