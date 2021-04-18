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
  data() {
    return {
      inputs: null,
      outputs: null,
    };
  },
  mounted() {},

  methods: {},
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
}

body {
  background: #222;
  color: #f3f3f3;
}

select {
  background: gray;
  color: #f3f3f3;
}

select:focus {
  outline: none;
  border: none;
}

.track-inner::-webkit-scrollbar {
  height: 8px;
}

.track-inner::-webkit-scrollbar-track {
  box-shadow: inset 0 0 3px grey;
}

.track-inner::-webkit-scrollbar-thumb {
  background: var(--color-2);
  // background: #113e3e;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

.pointer {
  cursor: pointer;
}

.set-default-value {
  color: green;
  background: rgba(0, 128, 128, 0.05);
}
</style>
