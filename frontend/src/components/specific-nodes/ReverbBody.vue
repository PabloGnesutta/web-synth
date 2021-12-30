<template>
  <!-- Types -->
  <div class="types" v-if="Node.types">
    <select @input="setType($event)">
      <option v-for="type in Node.types" :key="type" :selected="type === Node.type">
        {{ type }}
      </option>
    </select>
  </div>
</template>

<script>
export default {
  name: 'ReverbBody',
  props: ['Node'],
  methods: {
    setType(event) {
      this.Node.setType(event.target.value);
      event.target.blur();
    },
  },
};
</script>