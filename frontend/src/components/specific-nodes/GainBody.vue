<template>
  <div class="gain-body select-none" :class="{ selected }">
    <!-- Mute/Rec enabled -->
    <div class="node-controls">
      <div class="rec-enabled-disabled" @click="toggleRecEnabled">
        <div v-if="recEnabled" class="rec-btn rec-enabled">Rec enabled</div>
        <div v-else class="rec-btn rec-disabled">Rec disabled</div>
      </div>
      <div class="mute-unmute select-none" @click="toggleMute">
        <div v-if="Node.muted" class="unmute">M</div>
        <div v-else class="mute">M</div>
      </div>
    </div>

    <!-- Level -->
    <div class="level">
      <div @click="knobClicked(Node.name + '-level')">
        <Knob
          :ref="Node.name + '-level'"
          :initVal="Node.gain"
          :minVal="Node.minGain"
          :maxVal="Node.maxGain"
          @knobTurned="setNodeGain($event)"
        />
      </div>
    </div>

    <!-- Analyser -->
    <AnalyserRender :analyser="analyser" />
  </div>
</template>

<script>
import Knob from '../Knob';
import AnalyserRender from '../AnalyserRender';

export default {
  name: 'GainBody',
  components: { Knob, AnalyserRender },
  props: ['Node', 'analyser', 'recEnabled', 'selected'],

  data() {
    return {
      muted: false,
    };
  },

  methods: {
    toggleRecEnabled() {
      this.$emit('toggleRecEnabled');
    },

    toggleMute() {
      this.muted = !this.muted;
      this.Node.toggleMute();
    },

    setNodeGain(value) {
      this.Node.setGain(value);
    },

    knobClicked(knobName) {
      const knobRef = this.$refs[knobName][0] || this.$refs[knobName];
      this.$emit('knobClicked', knobRef);
    },
  },
};
</script>

<style lang="scss" scoped>
.gain-body {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0.5rem 0.5rem 1.5rem;
  background: #111;
}
.gain-body.selected {
  background: #333;
}
.node-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.rec-enabled-disabled {
  cursor: pointer;
  width: 94px;
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

.level {
  flex: 1;
}
</style>
