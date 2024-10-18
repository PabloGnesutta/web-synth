const indexedDB = require('../db/index');
const Node = require("../class/Node");
const { state, tracklist, timelineState, cliplist, trackClips, appState } = require('../state/vueInstance');


function initializeIndexedDb() {
  indexedDB.initDb(dbData => {
    console.log('db inited', dbData);
    state.instance.projects = dbData.projects;
    state.instance.projectIdCount = dbData.projectIdCount;
  });
}

function saveProject(newProjectName) {
  if (appState.isNew || newProjectName) {
    // new project
    const newId = state.instance.projectIdCount + 1;
    const projectsObj = { ...state.instance.projects };
    projectsObj[newId] = { id: newId, name: newProjectName };
    indexedDB.updateProjectsList({ projects: projectsObj, idCount: newId }, () => {
      state.instance.projectId = newId;
      state.instance.projectName = newProjectName;
      state.instance.projectIdCount = newId;
      appState.isNew = false;
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
      octave: appState.octave,
      transpose: appState.transpose,
      masterOutputKnob: state.instance.masterOutputKnob,
      followCursor: appState.followCursor,
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
    appState.unsaved = false;
  });
}

function loadProject(projectId, projectName) {
  // TODO: Set some flag on for a loading modal or smth
  state.instance.hardReset();
  state.instance.projectId = parseInt(projectId);
  state.instance.projectName = projectName;

  indexedDB.get(state.instance.projectId, 'project_data', projectData => {
    state.instance.globalStart = projectData.globalStart;
    state.instance.cursorX = projectData.cursorX;
    state.instance.masterOutputKnob = projectData.masterOutputKnob;
    appState.followCursor = projectData.followCursor;
    appState.octave = projectData.octave;
    appState.transpose = projectData.transpose;
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

      appState.unsaved = false;
      appState.isNew = false;
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
  initializeIndexedDb,
  saveProject,
  loadProject,
};
