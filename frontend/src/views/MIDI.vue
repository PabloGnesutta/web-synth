<template>
  <div>
    <h1>MIDI</h1>
  </div>
</template>

<script>
export default {
  data() {
    return {
      inputs: null,
      outputs: null,
    };
  },
  mounted() {
    navigator.requestMIDIAccess().then(this.onMIDISuccess, this.onMIDIFailure);
  },

  methods: {
    onMIDISuccess(midiAccess) {
      console.log("MIDI Access:", midiAccess);
      this.inputs = midiAccess.inputs;
      this.outputs = midiAccess.outputs;

      for (var input of this.inputs.values()) {
        input.onmidimessage = this.getMIDIMessage;
      }
    },

    getMIDIMessage({ data }) {
      const cmd = data[0];
      const note = data[1];
      const value = data[2];
      console.log("-------------------------");
      console.log("cmd", cmd);
      console.log("note", note);
      console.log("value", value);
    },

    onMIDIFailure() {
      console.log("Could not access your MIDI devices.");
    },
  },
};
</script>

<style>
</style>