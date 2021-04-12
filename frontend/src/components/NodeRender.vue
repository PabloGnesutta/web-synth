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
                <div class="track-gain">
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
        <!-- <div class="connections">
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
        </div> -->

        <!-- Level -->
        <div
          class="level"
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
              @click="levelClicked"
            />
          </div>
        </div>
      </div>
      <!-- /node-footer -->
      <div class="node-controls" v-if="Node.name === 'Track Gain'">asd</div>
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
  props: ["Node", "analyser"],

  computed: {
    ...mapGetters(["appConnecting", "originNode"]),
  },

  mounted() {
    console.log(this.Node);
  },

  methods: {
    ...mapMutations(["setAppConnecting", "setOriginNode"]),

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

    levelClicked() {},

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
    disconnect(output) {},
    onMouseEnterOutput(output) {},
    onMouseLeaveOutput(output) {},

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
    font-size: 1.1rem;
    text-align: left;
    padding: 0.5em;
  }
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

.node-name {
  cursor: default;
}

.Modulator .node-name {
  cursor: pointer;
}

.types {
  margin-bottom: 0.2em;
}

.ScaleInterface,
.Delay {
  .node-header {
    display: flex;
    align-items: center;
  }
}

.params-wrapper {
  width: 100%;
}

.params-container {
  padding-bottom: .2em ;
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
  transition: border-color 0.2s ease-out;
  font-size: 0.95rem;
}

.param-name {
  padding: 0.3em 0.2em 0.5em;
}

.ScaleInterface {
  width: 205px;
}

.Carrier {
  min-width: 150px;
}

.Modulator {
  .params-container {
    display: block;
  }
}

.Delay {
  width: 165px;
  .param {
    min-width: 78px;
  }
}

.node-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 0.5em;
  .connections {
    width: 50%;
  }
}

.connections {
  cursor: default;
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
</style>