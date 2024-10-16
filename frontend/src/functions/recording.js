const Node = require("../class/Node");
const { state } = require("../state/vueInstance");


function startRecord() {
  state.instance.totalProcessingTracks = 0;
  state.instance.recording = true;
  state.instance.renderDataObjects = [];
  state.instance.tracks
    .filter(track => track.recEnabled)
    .forEach(track => startRecordSingleTrack(track));

  let cursorStep = 1;
  if (state.instance.playing) {
    cursorStep = 0;
  }

  state.instance.playing = true;
  state.instance.captureBarsLoop(cursorStep);
}

function startRecordSingleTrack(track) {
  state.instance.totalProcessingTracks++;

  let chunks = [];
  let mediaStreamDestination = Node.context.createMediaStreamDestination();
  const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);

  state.instance.mediaRecorders[track.id] = mediaRecorder;
  track.trackGain.connectNativeNode(mediaStreamDestination);

  // init clip
  const clip = {
    trackId: track.id,
    id: ++state.instance.clipIdCount,
    xPos: state.instance.cursorX,
    startSample: 0,
    endSample: 0,
    numSamples: 0,
    sampleRate: 0,
    playing: true,
  };
  state.instance.clips.push(clip);
  state.instance.trackClips[track.id].push(clip);

  mediaRecorder.ondataavailable = ({ data }) => chunks.push(data);
  // When recording's finished, process data chunk
  // into a Blob, and save it for future use
  mediaRecorder.onstop = () => {
    const blobReader = new FileReader();
    const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });

    blobReader.onloadend = () => {
      const arrayBuffer = blobReader.result;
      Node.context.decodeAudioData(arrayBuffer, audioBuffer => {
        clip.blob = blob;
        clip.buffer = audioBuffer;
        clip.duration = clip.buffer.duration;
        clip.numSamples = clip.bars.length;
        clip.endSample = clip.bars.length;
        clip.sampleDuration = clip.buffer.duration / clip.numSamples;
        clip.playing = false;
        clip.sampleRate = Math.round(clip.buffer.length / clip.numSamples);
        state.instance.totalProcessingTracks--;
        if (state.instance.totalProcessingTracks <= 0) {
          state.instance.logInfo();
        }
      });
    };

    blobReader.readAsArrayBuffer(blob);
    mediaStreamDestination = null;
    chunks = null;
  };

  mediaRecorder.start();

  state.instance.renderDataObjects.push(state.instance.generateRenderDataObject(track));
}

function stopRecord() {
  state.instance.recording = false;
  state.instance.playing = false;

  for (const trackId in state.instance.mediaRecorders) {
    state.instance.mediaRecorders[trackId].stop();
    delete state.instance.mediaRecorders[trackId];
  }

  state.instance.mediaRecorders = {};

  cancelAnimationFrame(state.instance.recordingRaf);
  cancelAnimationFrame(state.instance.playbackRaf);
  state.instance.recordingRaf = null;
  state.instance.playbackRaf = null;
}

function stopRecordSingleTrack(track) {
  state.instance.mediaRecorders[track.id].stop();
  delete state.instance.mediaRecorders[track.id];
  let index = state.instance.renderDataObjects.findIndex(o => o.trackId == track.id);
  state.instance.renderDataObjects.splice(index, 1);
}


module.exports = {
  startRecord,
  startRecordSingleTrack,
  stopRecord,
  stopRecordSingleTrack,
};
