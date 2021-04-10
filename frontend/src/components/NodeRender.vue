<template>
  <div class="node" :class="[Node.nodeType, getCssNodeName(Node.name)]">
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

    <div class="node-output">
      <!-- Start/Stop -->
      <div
        class="start-stop"
        v-if="Node.nodeType === 'Carrier' || Node.nodeType === 'ADSROscillator'"
      >
        <div class="start" v-if="Node.status === 'STOPPED'" @click="startOsc()">
          START
        </div>
        <div class="stop" v-else @click="stopOsc()">STOP</div>
      </div>
      <!-- Connections -->
      <div class="connections">
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
        v-if="Node.level"
        :class="getCssNodeName(Node.name + ' Level')"
      >
        <div class="param-name" @click="levelClicked()">Level</div>
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

    <div class="node-params">
      <div class="params-wrapper">
        <div
          class="audio-params params-container"
          v-if="Node.audioParams.length > 0"
        >
          <!-- Audio Params -->
          <p class="group-label">audio params</p>
          <div
            class="audio-param param"
            v-for="(audioParam, apIndex) in Node.audioParams"
            :key="audioParam.name"
            :class="[getCssNodeName(Node.name + ' ' + audioParam.name)]"
          >
            <div class="param-name" @click="audioParamClicked(audioParam)">
              {{ audioParam.name }}
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
          <p class="group-label">inner Node audio</p>
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
            <!-- la concatenaciión acá arriba tendría que eliminarse, y que construya el nombre en base a
                  calcular el nombre del nodo más el nombre del parámetro -->
            <div
              class="param-name"
              @click="
                innerNodeAudioParamClicked(innerNodeAudioParam, inapIndex)
              "
            >
              {{ innerNodeAudioParam.name }}
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
                @knobTurned="setInnerNodeAudioParam(inapIndex, $event)"
              />
            </div>
          </div>
        </div>

        <!-- Custom Params -->
        <div class="custom-params params-container" v-if="Node.customParams">
          <p class="group-label">custom</p>
          <div
            class="custom-param param"
            v-for="(customParam, cpIndex) in Node.customParams"
            :key="customParam.name"
            :class="[getCssNodeName(Node.name + ' ' + customParam.name)]"
          >
            <div
              class="param-name"
              @click="customParamClicked(customParam, cpIndex)"
            >
              {{ customParam.name }}
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
                  @knobTurned="setCustomParam(cpIndex, $event)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DELETE -->
    <div class="delete" @click="deleteNode()" v-if="Node.name !== 'Track Gain'">
      X
    </div>
  </div>
</template>

<script>
import Knob from "./Knob";
export default {
  mounted() {
    console.log(this.Node);
  },
  props: ["Node"],
  methods: {
    nodeClicked() {},
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
    audioParamClicked(audioParam) {},

    setInnerNodeAudioParam(inapIndex, value) {
      this.Node.setInnerNodeAudioParam(inapIndex, value);
    },
    innerNodeAudioParamClicked(innerNodeAudioParam, inapIndex) {},

    setCustomParam(cpIndex, value) {
      this.Node.setCustomParam(cpIndex, value);
    },
    customParamClicked(customParam, cpIndex) {},

    //level
    levelClicked() {
      this.$emit("levelClicked");
    },
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
  },
};
</script>

<style>
</style>