// TODo: rename to instances
const state = {
  // TODO: rename to home
  instance: null,
};

const tracklist = [];
const cliplist = [];
const trackClips = {};

const exportState = {
  name: undefined,
  mediaRecorder: null,
  blob: null,
  buffer: null,
  canceled: false,
};

const midiState = {
  midiInputs: [],
  midiOutputs: [],
  midiMappings: [],
  mapping: false,
  refBeignMapped: null,
};

const timelineState = {
  trackHeight: 64,
  viewportWidth: undefined,
  sampleWidth: 1,
  lastSample: 0,
  carretSkip: 0,
};


module.exports = {
  state,
  tracklist,
  cliplist,
  trackClips,
  timelineState,
  exportState,
  midiState,
};