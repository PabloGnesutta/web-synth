const { state, tracklist, trackState, appState } = require("../state/vueInstance");
const { keypressListeners } = require("./keyboard");
const { startRecordSingleTrack, stopRecordSingleTrack } = require("./recording");


function selectTrack(t) {
  if (trackState.currentTrackIndex === t) {
    return;
  }

  trackState.currentTrack = null;
  trackState.currentTrackIndex = t;
  state.instance.$nextTick(() => trackState.currentTrack = tracklist[trackState.currentTrackIndex]);
}

function toggleInstrumentEnabled() {
  trackState.instrumentEnabled = !trackState.instrumentEnabled;

  if (trackState.instrumentEnabled) {
    keypressListeners.push({
      instrument: trackState.instrument,
      trackName: trackState.name,
    });
    if (trackState.instrument.name === 'Mic') {
      trackState.instrument.setMute(false);
    }
  } else {
    const i = keypressListeners.findIndex(kpl => kpl.trackName === trackState.name);
    keypressListeners.splice(i, 1);
    if (trackState.instrument.name === 'Mic') {
      trackState.instrument.setMute(true);
    }
  }
}

function toggleRecEnabled(track) {
  track.recEnabled = !track.recEnabled;
  if (!appState.recording) {
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
