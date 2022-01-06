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


<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  color: #ddd;
  background: rgb(2, 29, 29);
  cursor: default;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100vw;
  overflow-x: hidden;
}
</style>
