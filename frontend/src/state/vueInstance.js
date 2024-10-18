// TODo: rename to instances
const state = {
  // TODO: rename to home
  instance: null,
};

const tracklist = [];
const cliplist = [];
const trackClips = {};

const appState = {
  isNew: true,
  unsaved: true,
  playing: false,
  recording: false,
  exporting: false,
  exportProgress: 0,
  followCursor: true,
  focusing: 'tracks',
  octave: 3,
  transpose: 0,
};

const trackState = {
  trackIdCount: 0,
  clipIdCount: 0,
  currentTrack: null,
  currentTrackIndex: 0,
};

const exportState = {
  name: undefined,
  mediaRecorder: null,
  blob: null,
  buffer: null,
  canceled: false,
  clipDestination: null,
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

const keyboardState = {
  m_pressed: false,
};


module.exports = {
  state,
  tracklist,
  cliplist,
  trackClips,
  appState,
  trackState,
  timelineState,
  exportState,
  midiState,
  keyboardState,
};