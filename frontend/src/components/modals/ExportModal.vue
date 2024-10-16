<template>
  <div class="backdrop">
    <div class="content">
      <h3>Processing audio for export</h3>
      <div class="progress-container">
        <div class="progress" :style="{ width: exportProgress + '%' }"></div>
      </div>
      <div class="progress-indicator">{{ exportProgress }}%</div>
      <div class="btn" @click="$emit('onCancel')">Cancel</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExportModal',
  props: {
    exportProgress: { type: Number, default: 50 },
  },
};
</script>

<style lang="scss" scoped>
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.content {
  background: white;
  color: #222;
  padding: 2rem;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

h3 {
  margin-bottom: 1rem;
  user-select: none;
}

.progress-container {
  background: #333;
  width: 100%;
  height: 26px;
  // margin-bottom: 1rem;
  border-radius: 10px;
}

.progress {
  background: teal;
  height: 100%;
  transition: width 200ms ease-out;
  border-radius: 10px;
}

.progress-indicator {
  user-select: none;
  font-weight: bold;
  color: white;
  letter-spacing: 2px;
  transform: translateY(-20px);
}

.btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-weight: bold;
  font-size: 1.25rem;
  cursor: pointer;
  user-select: none;
}

.btn:hover {
  color: coral;
}
</style>