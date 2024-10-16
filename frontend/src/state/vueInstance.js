const state = {
  instance: null,
};

const tracklist = [];

const timelineState = {
  trackHeight: 64,
  viewportWidth: undefined,
  sampleWidth: 1,
  lastSample: 0,
};


module.exports = {
  state,
  tracklist,
  timelineState,
};