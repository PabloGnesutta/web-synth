const indexedDB = require('../db/index');
const Node = require("../class/Node");
const { state, tracklist, timelineState, cliplist, trackClips, appState, projectsState } = require('../state/vueInstance');


function initializeIndexedDb() {
  indexedDB.initDb(dbData => {
    console.log('db inited', dbData);
    projectsState.projects = dbData.projects;
    projectsState.projectIdCount = dbData.projectIdCount;
  });
}

function saveProject(newProjectName) {
  if (newProjectName) {
    // new project
    const newId = projectsState.projectIdCount + 1;

    projectsState.projects = projectsState.projects || {};
    projectsState.projects[newId] = { id: newId, name: newProjectName };

    indexedDB.updateProjectsList({ projects: projectsState.projects, idCount: newId }, () => {
      projectsState.projectId = newId;
      projectsState.projectName = newProjectName;
      projectsState.projectIdCount = newId;
      appState.isNew = false;
      saveDataForProject();
      console.log('projects updated');
    });
  } else {
    saveDataForProject();
  }
}

function saveDataForProject() {
  indexedDB.save(
    projectsState.projectId,
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
  indexedDB.save(projectsState.projectId, 'tracks', tracks, () => console.log('tracks saved'));

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
  indexedDB.save(projectsState.projectId, 'track_clips', track_clips, () => {
    console.log('track_clips saved');
    appState.unsaved = false;
  });
}

function loadProject(projectId, projectName) {
  // TODO: Set some flag on for a loading modal or smth
  state.instance.hardReset(false);
  projectsState.projectId = parseInt(projectId);
  projectsState.projectName = projectName;

  indexedDB.get(projectsState.projectId, 'project_data', projectData => {
    state.instance.globalStart = projectData.globalStart;
    state.instance.cursorX = projectData.cursorX;
    state.instance.masterOutputKnob = projectData.masterOutputKnob;
    appState.followCursor = projectData.followCursor;
    appState.octave = projectData.octave;
    appState.transpose = projectData.transpose;
    // todo: load click values

    indexedDB.get(parseInt(projectsState.projectId), 'tracks', tracks => {
      console.log('load tracks', tracks);
      tracks.forEach(track => {
        state.instance.loadInstrument(track.instrument, track.id);
        track.effects.forEach(effect => state.instance.loadEffect(effect));
      });

      indexedDB.get(projectsState.projectId, 'track_clips', track_clips => {
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
