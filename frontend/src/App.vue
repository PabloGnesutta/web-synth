<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return ((this - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
};

export default {
  name: 'WebSynth',
  data() {
    return {};
  },
};
</script>


<style lang="scss" scoped>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100vw;
  overflow-x: hidden;
}
</style>
