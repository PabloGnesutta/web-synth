<template>
  <div class="LooperBody">
    <div class="sample-controls">
      <!-- Upload -->
      <div class="upload-loop">
        <div class="label">{{ fileName || "Drop Sample" }}</div>
        <input type="file" accept="audio/*" @change="loadBuffer" />
      </div>
    </div>

    <div class="custom-params params-container">
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

    <div class="stop-btn" v-if="Node.playing" @click="stopSample">STOP</div>
    <div class="stop-placeholder" v-else></div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import Knob from "../Knob";
export default {
  data() {
    return {
      fileName: "",
    };
  },

  props: ["Node"],

  computed: {
    ...mapGetters([
      "context",
      // "tempo",
      // "totalBeats",
      // "currentBeat",
      // "nextBeatTime",
      // "secondsPerBeat",
    ]),
  },

  methods: {
    loadBuffer(e) {
      const file = e.target.files[0];
      this.fileName = file.name;

      const fileReader = new FileReader();

      fileReader.onloadend = () => {
        const arrayBuffer = fileReader.result;

        this.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
          this.Node.loadBuffer(audioBuffer);
        });
      };

      fileReader.readAsArrayBuffer(file);
    },

    setCustomParam(index, value) {
      this.Node.setCustomParam(index, value);
    },

    stopSample() {
      this.Node.stopSample();
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit("knobClicked", knobRef);
    },

    getCssNodeName(name) {
      return name.replace(new RegExp(" ", "g"), "-");
    },
  },

  components: {
    Knob,
  },
};
</script>

<style lang="scss" scoped>
.upload-loop {
  width: 100%;
  background: #222;
  position: relative;
  .label {
    padding: 2em 0.3em;
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
  }
}

.upload-loop:hover {
  background: var(--color-1);
}

.stop-btn,
.stop-placeholder {
  height: 20px;
}
.stop-btn {
  cursor: pointer;
}
</style>