const noteKeys = require("../data/noteKeys");
const noteFrequencies = require("../data/noteFrequencies");
const { state, tracklist, trackState, keyboardState, appState } = require("../state/vueInstance");
const { onStopBtnClick, togglePlay, toggleRecord } = require("./playback");


const keyEnabled = Array(222).fill(true);
const keypressListeners = [];
const numpadListeners = [];
const xyPadListeners = [];

const numNotes = noteFrequencies.length;

function mainKeyDownHandler(e) {
  if (!keyEnabled[e.keyCode]) {
    return;
  }
  keyEnabled[e.keyCode] = false;
  const noteKeyIndex = noteKeys.findIndex(noteKey => e.key === noteKey);

  if (noteKeyIndex !== -1) {
    let noteIndex = noteKeyIndex + 12 * appState.octave + appState.transpose;
    if (noteIndex < 0) {
      noteIndex = 0;
    }
    else if (noteIndex > numNotes - 1) {
      noteIndex = numNotes - 1;
    }

    keypressListeners.forEach(scaleInterface => scaleInterface.instrument.playNote(noteIndex));
  } else {
    onOtherKeydown(e);
  }
}

function mainKeyupHandler(e) {
  keyEnabled[e.keyCode] = true;
  const noteKeyIndex = noteKeys.findIndex(noteKey => e.key === noteKey);

  if (noteKeyIndex !== -1) {
    const noteIndex = noteKeyIndex + 12 * appState.octave + appState.transpose;
    keypressListeners.forEach(scaleInterface => scaleInterface.instrument.stopNote(noteIndex));
  } else {
    onOtherKeyup(e);
  }
}

function onOtherKeydown(e) {
  if (e.keyCode >= 97 && e.keyCode <= 105) {
    //numpad
    numpadListeners.forEach(scaleInterface => scaleInterface.instrument.playNote(+e.key));
  } else {
    let futureTrackIndex;
    switch (e.keyCode) {
      case 38: //arrow   up - select track
        if (appState.focusing !== 'tracks') {
          return;
        }
        futureTrackIndex = trackState.currentTrackIndex - 1;
        if (futureTrackIndex >= 0) {
          state.instance.selectTrack(futureTrackIndex);
        }
        break;
      case 40: //arrow down - select track
        if (appState.focusing !== 'tracks') {
          return;
        }
        futureTrackIndex = trackState.currentTrackIndex + 1;
        if (futureTrackIndex < tracklist.length) {
          state.instance.selectTrack(futureTrackIndex);
        }
        break;
      case 77: //m
        keyboardState.m_pressed = true;
        break;
    }
  }
}

function onOtherKeyup(e) {
  if (e.keyCode >= 49 && e.keyCode <= 57) {
    //1-9
    if (keyboardState.m_pressed) {
      tracklist[+e.key - 1].trackGain.toggleMute();
    }
  } else {
    switch (e.keyCode) {
      case 13: //enter - rec/stop
        if (appState.focusing !== 'sidebar') {
          toggleRecord();
        }
        break;
      case 27: //esc -
        onStopBtnClick();
        break;
      case 32: //space bar - play/pause
        if (appState.playing) {
          onStopBtnClick();
        } else {
          togglePlay();
        }
        break;
      case 37: //arrow left - move cursor
        if (!appState.recording && !appState.playing) {
          state.instance.moveCursor(-20);
        }
        break;
      case 39: //arrow right - move cursor
        if (!appState.recording && !appState.playing) {
          state.instance.moveCursor(20);
        }
        break;

      case 46: //delete - delete current track
        state.instance.deleteTrack(trackState.currentTrackIndex);
        break;
      case 66: //b - duplicate selected clips
        if (e.ctrlKey) {
          duplicateClips();
        }
        break;
      case 77: //m - mute current track
        keyboardState.m_pressed = false;
        if (e.ctrlKey) {
          trackState.currentTrack.trackGain.toggleMute();
        }
        break;
      case 90: //z - octave down
        appState.octave--;
        break;
      case 88: //x - octave up
        appState.octave++;
        break;
      case 67: //c - transpose down
        appState.transpose--;
        break;
      case 86: //v - transpose up
        appState.transpose++;
        break;
      default:
        console.log('key', e.keyCode);
        break;
    }
  }
}


module.exports = {
  keyEnabled,
  keypressListeners,
  numpadListeners,
  xyPadListeners,
  mainKeyDownHandler,
  mainKeyupHandler
};
