const Node = require("../class/Node");

function startRecord(vueInstance) {
  vueInstance.totalProcessingTracks = 0;
  vueInstance.recording = true;
  vueInstance.renderDataObjects = [];
  vueInstance.tracks
    .filter(track => track.recEnabled)
    .forEach(track => startRecordSingleTrack(vueInstance, track));

  let cursorStep = 1;
  if (vueInstance.playing) {
    cursorStep = 0;
  }

  vueInstance.playing = true;
  vueInstance.captureBarsLoop(cursorStep);
}

function startRecordSingleTrack(vueInstance, track) {
  vueInstance.totalProcessingTracks++;

  let chunks = [];
  let mediaStreamDestination = Node.context.createMediaStreamDestination();
  const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);

  vueInstance.mediaRecorders[track.id] = mediaRecorder;
  track.trackGain.connectNativeNode(mediaStreamDestination);

  // init clip
  const clip = {
    trackId: track.id,
    id: ++vueInstance.clipIdCount,
    xPos: vueInstance.cursorX,
    startSample: 0,
    endSample: 0,
    numSamples: 0,
    sampleRate: 0,
    playing: true,
  };
  vueInstance.clips.push(clip);
  vueInstance.trackClips[track.id].push(clip);

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
        vueInstance.totalProcessingTracks--;
        if (vueInstance.totalProcessingTracks <= 0) {
          vueInstance.logInfo();
        }
      });
    };

    blobReader.readAsArrayBuffer(blob);
    mediaStreamDestination = null;
    chunks = null;
  };

  mediaRecorder.start();

  vueInstance.renderDataObjects.push(vueInstance.generateRenderDataObject(track));
}

function stopRecord(vueInstance) {
  vueInstance.recording = false;
  vueInstance.playing = false;

  for (const trackId in vueInstance.mediaRecorders) {
    vueInstance.mediaRecorders[trackId].stop();
    delete vueInstance.mediaRecorders[trackId];
  }

  vueInstance.mediaRecorders = {};

  cancelAnimationFrame(vueInstance.recordingRaf);
  cancelAnimationFrame(vueInstance.playbackRaf);
  vueInstance.recordingRaf = null;
  vueInstance.playbackRaf = null;
}

function stopRecordSingleTrack(vueInstance, track) {
  vueInstance.mediaRecorders[track.id].stop();
  delete vueInstance.mediaRecorders[track.id];
  let index = vueInstance.renderDataObjects.findIndex(o => o.trackId == track.id);
  vueInstance.renderDataObjects.splice(index, 1);
}


module.exports = {
  startRecord,
  startRecordSingleTrack,
  stopRecord,
  stopRecordSingleTrack,
};
