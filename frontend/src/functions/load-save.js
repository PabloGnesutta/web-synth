const indexedDB = require('../db/index');
const Node = require("../class/Node");
const { state, tracklist, timelineState, cliplist, trackClips } = require('../state/vueInstance');


function saveProject(newProjectName) {
  if (state.instance.isNew || newProjectName) {
    // new project
    console.log('isnew', state.instance.isNew);
    const newId = state.instance.projectIdCount + 1;
    const projectsObj = { ...state.instance.projects };
    projectsObj[newId] = { id: newId, name: newProjectName };
    indexedDB.updateProjectsList({ projects: projectsObj, idCount: newId }, () => {
      state.instance.projectId = newId;
      state.instance.projectName = newProjectName;
      state.instance.projectIdCount = newId;
      state.instance.isNew = false;
      state.instance.projects[newId] = projectsObj;
      saveData();
      console.log('projects updated');
    });
  } else {
    saveData();
  }
}

function saveData() {
  indexedDB.save(
    state.instance.projectId,
    'project_data',
    {
      globalStart: state.instance.globalStart,
      cursorX: state.instance.cursorX,
      tempo: state.instance.tempo,
      octave: state.instance.octave,
      transpose: state.instance.transpose,
      masterOutputKnob: state.instance.masterOutputKnob,
      followCursor: state.instance.followCursor,
    },
    () => console.log('project_data saved')
  );

  const tracks = tracklist.map(track => ({
    id: track.id,
    instrument: JSON.parse(track.instrument.saveString()),
    effects: track.effects.map(effect => JSON.parse(effect.saveString())),
  }));

  indexedDB.save(state.instance.projectId, 'tracks', tracks, () => console.log('tracks saved'));

  const track_clips = {};
  for (const trackId in trackClips) {
    const clips = trackClips[trackId];
    track_clips[trackId] = clips.map(clip => {
      const saveClip = { ...clip };
      delete saveClip.buffer;
      delete saveClip.selected;
      return saveClip;
    });
  }
  indexedDB.save(state.instance.projectId, 'track_clips', track_clips, () => {
    console.log('track_clips saved');
    state.instance.unsaved = false;
  });
}

function loadProject({ projectId, projectName }) {
  // TODO: Set some flag on for a loading modal or smth
  state.instance.hardReset();
  state.instance.projectId = parseInt(projectId);
  state.instance.projectName = projectName;

  indexedDB.get(state.instance.projectId, 'project_data', projectData => {
    state.instance.globalStart = projectData.globalStart;
    state.instance.cursorX = projectData.cursorX;
    state.instance.masterOutputKnob = projectData.masterOutputKnob;
    state.instance.followCursor = projectData.followCursor;
    state.instance.octave = projectData.octave;
    state.instance.transpose = projectData.transpose;
    // todo: load click values

    indexedDB.get(parseInt(state.instance.projectId), 'tracks', tracks => {
      console.log('load tracks', tracks);
      tracks.forEach(track => {
        state.instance.loadInstrument(track.instrument, track.id);
        track.effects.forEach(effect => state.instance.loadEffect(effect));
      });

      indexedDB.get(state.instance.projectId, 'track_clips', track_clips => {
        console.log('load track_clips', track_clips);
        loadTrackClips(track_clips);
      });

      state.instance.unsaved = false;
      state.instance.isNew = false;
      // TODO: Set said flag back off
    });
  });
}

function loadTrackClips(trackClips) {
  let clipsProcessed = 0;
  let numClips = 0;
  for (const trackId in trackClips) {
    const clips = trackClips[trackId];
    numClips += clips.length;
    // if there are no clips, onLoadFinish never triggers
    clips.forEach(clip => {
      const blobReader = new FileReader();
      blobReader.onloadend = () => {
        const arrayBuffer = blobReader.result;
        Node.context.decodeAudioData(arrayBuffer, audioBuffer => {
          clip.buffer = audioBuffer;
          clip.duration = clip.buffer.duration;
          clip.numSamples = clip.bars.length;
          clip.sampleDuration = clip.buffer.duration / clip.numSamples;
          clip.sampleRate = Math.round(clip.buffer.length / clip.numSamples);
          clip.playing = false;
          cliplist.push(clip);

          // determine total timeleine width
          const lastSample = clip.xPos + clip.numSamples;
          if (lastSample > timelineState.lastSample) {
            timelineState.lastSample = lastSample;
          }
          // might fail because of race condition?
          if (++clipsProcessed >= numClips) {
            state.instance.onLoadFinish(trackClips);
          }
        });
      };
      blobReader.readAsArrayBuffer(clip.blob);
    });
  }
}

module.exports = {
  saveProject,
  loadProject,
};
