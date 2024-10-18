const Node = require("../class/Node");
const { clearArray } = require("../lib/array");
const { state, tracklist, cliplist, trackClips } = require("../state/vueInstance");
const { renderDataObjects } = require("./rendering");


var mediaRecorders = {};
var totalProcessingTracks = 0;

function startRecord() {
  totalProcessingTracks = 0;
  state.instance.recording = true;

  for (const track of tracklist) {
    if (track.recEnabled) {
      startRecordSingleTrack(track);
    }
  }

  let cursorStep = 1;
  if (state.instance.playing) {
    cursorStep = 0;
  }

  state.instance.playing = true;
  state.instance.captureBarsLoop(cursorStep);
}

function startRecordSingleTrack(track) {
  totalProcessingTracks++;

  let chunks = [];
  let mediaStreamDestination = Node.context.createMediaStreamDestination();
  const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);

  mediaRecorders[track.id] = mediaRecorder;
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
  cliplist.push(clip);
  trackClips[track.id].push(clip);

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
        totalProcessingTracks--;
        if (totalProcessingTracks <= 0) {
          state.instance.logInfo();
        }
      });
    };

    blobReader.readAsArrayBuffer(blob);
    mediaStreamDestination = null;
    chunks = null;
  };

  mediaRecorder.start();

  renderDataObjects.push(state.instance.generateRenderDataObject(track));
}

function stopRecord() {
  state.instance.recording = false;
  state.instance.playing = false;

  for (const trackId in mediaRecorders) {
    mediaRecorders[trackId].stop();
    delete mediaRecorders[trackId];
  }

  mediaRecorders = {};

  cancelAnimationFrame(state.instance.recordingRaf);
  cancelAnimationFrame(state.instance.playbackRaf);
  state.instance.recordingRaf = null;
  state.instance.playbackRaf = null;

  clearArray(renderDataObjects);
}

function stopRecordSingleTrack(track) {
  mediaRecorders[track.id].stop();
  delete mediaRecorders[track.id];
  const index = renderDataObjects.findIndex(o => o.trackId == track.id);
  renderDataObjects.splice(index, 1);
}


module.exports = {
  startRecord,
  startRecordSingleTrack,
  stopRecord,
  stopRecordSingleTrack,
};
