const Node = require("../class/Node");
const { state, tracklist, cliplist, exportState, appState } = require("../state/vueInstance");
const { stopRecord, startRecord } = require("./recording");


function playSingleClip(clip) {
  clip.playing = true;
  clip.source = Node.context.createBufferSource();
  clip.source.buffer = clip.buffer;

  const offsetStart = (state.instance.cursorX - clip.xPos + clip.startSample) * clip.sampleDuration;
  const offsetEnd = (clip.xPos + clip.endSample - state.instance.cursorX) * clip.sampleDuration;

  const track = tracklist.find(track => track.id == clip.trackId); // esto es una verga
  clip.source.connect(exportState.clipDestination || track.trackGain.inputNode);
  clip.source.start(0, offsetStart, offsetEnd);

  clip.source.onended = () => {
    clip.playing = false;
    clip.source.disconnect();
    clip.source = null;
    delete clip.source;
  };
}

function stopAllClips() {
  cliplist.forEach(clip => clip.source && clip.source.stop());
}

function toggleRecord() {
  appState.recording ? stopRecord() : startRecord();
}

function togglePlay() {
  if (appState.recording) {
    return;
  }
  if (appState.playing) {
    onStopBtnClick();
    state.instance.cursorX = state.instance.lastCursorPos;
  }
  state.instance.lastCursorPos = state.instance.cursorX;
  playAllTracks();
}

function playAllTracks() {
  appState.playing = true;
  state.instance.moveTimielineWithPlayback();
}

function onStopBtnClick() {
  if (appState.playing) {
    appState.playing = false;
    stopAllClips();
    cancelAnimationFrame(state.instance.playbackRaf);
    state.instance.playbackRaf = null;
  } else {
    if (state.instance.globalStart !== 0) {
      state.instance.globalStart = 0;
      state.instance.renderCanvas();
    }
    if (state.instance.cursorX !== 0) {
      state.instance.cursorX = 0;
      state.instance.renderCursor();
    }
  }
  if (appState.recording) {
    stopRecord();
  }
}


module.exports = {
  playSingleClip,
  stopAllClips,
  toggleRecord,
  togglePlay,
  playAllTracks,
  onStopBtnClick,
};
