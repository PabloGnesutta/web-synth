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

:root {
  --color-1: teal;
  --color-2: coral;
  --header-height: 50px;
}

body {
  background: #222;
  color: #f3f3f3;
}

select {
  background: #272727;
  color: #f3f3f3;
  user-select: none;
}

select:focus {
  outline: none;
}

canvas {
  display: block;
}

.select-none {
  user-select: none;
}

.cursor-default {
  cursor: default;
}

.pointer {
  cursor: pointer;
}

.invisible {
  visibility: hidden;
}

.set-default-value {
  color: lightgreen;
  background: rgba(0, 128, 128, 0.05);
}

.custom-scrollbar::-webkit-scrollbar {
  height: 10px;
  width: 12px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  box-shadow: inset 0 0 2px #fff;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(228, 173, 154);
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  width: 100vw;
  overflow-x: hidden;
}
</style>
