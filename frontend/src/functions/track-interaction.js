const { state, tracklist } = require("../state/vueInstance");
const { keypressListeners } = require("./keyboard");
const { startRecordSingleTrack, stopRecordSingleTrack } = require("./recording");

function selectTrack(t) {
  if (state.instance.currentTrackIndex === t) {
    return;
  }

  state.instance.currentTrackIndex = t;
  state.instance.currentTrack = null;
  state.instance.$nextTick(() => state.instance.currentTrack = tracklist[state.instance.currentTrackIndex]);
}

function toggleInstrumentEnabled() {
  state.instance.currentTrack.instrumentEnabled = !state.instance.currentTrack.instrumentEnabled;

  if (state.instance.currentTrack.instrumentEnabled) {
    keypressListeners.push({
      instrument: state.instance.currentTrack.instrument,
      trackName: state.instance.currentTrack.name,
    });
    if (state.instance.currentTrack.instrument.name === 'Mic') {
      state.instance.currentTrack.instrument.setMute(false);
    }
  } else {
    const i = keypressListeners.findIndex(kpl => kpl.trackName === state.instance.currentTrack.name);
    keypressListeners.splice(i, 1);
    if (state.instance.currentTrack.instrument.name === 'Mic') {
      state.instance.currentTrack.instrument.setMute(true);
    }
  }
}

function toggleRecEnabled(track) {
  track.recEnabled = !track.recEnabled;
  if (!state.instance.recording) {
    return;
  }
  if (track.recEnabled) {
    startRecordSingleTrack(track);
  } else {
    stopRecordSingleTrack(track);
  }
}

module.exports = {
  selectTrack,
  toggleInstrumentEnabled,
  toggleRecEnabled,
};
