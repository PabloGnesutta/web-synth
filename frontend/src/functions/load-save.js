const indexedDB = require('../db/index');


function saveProject(vueInstance, newProjectName) {
  if (vueInstance.isNew || newProjectName) {
    // new project
    console.log('isnew', vueInstance.isNew);
    const newId = vueInstance.projectIdCount + 1;
    const projectsObj = { ...vueInstance.projects };
    projectsObj[newId] = { id: newId, name: newProjectName };
    indexedDB.updateProjectsList({ projects: projectsObj, idCount: newId }, () => {
      vueInstance.projectId = newId;
      vueInstance.projectName = newProjectName;
      vueInstance.projectIdCount = newId;
      vueInstance.isNew = false;
      vueInstance.projects[newId] = projectsObj;
      saveData(vueInstance);
      console.log('projects updated');
    });
  } else {
    saveData(vueInstance);
  }
}

function saveData(vueInstance) {
  indexedDB.save(
    vueInstance.projectId,
    'project_data',
    {
      globalStart: vueInstance.globalStart,
      cursorX: vueInstance.cursorX,
      tempo: vueInstance.tempo,
      octave: vueInstance.octave,
      transpose: vueInstance.transpose,
      masterOutputKnob: vueInstance.masterOutputKnob,
      followCursor: vueInstance.followCursor,
    },
    () => console.log('project_data saved')
  );

  const tracks = vueInstance.tracks.map(track => ({
    id: track.id,
    instrument: JSON.parse(track.instrument.saveString()),
    effects: track.effects.map(effect => JSON.parse(effect.saveString())),
  }));

  indexedDB.save(vueInstance.projectId, 'tracks', tracks, () => console.log('tracks saved'));

  const trackClips = {};
  for (const trackId in vueInstance.trackClips) {
    const clips = vueInstance.trackClips[trackId];
    trackClips[trackId] = clips.map(clip => {
      const saveClip = { ...clip };
      delete saveClip.buffer;
      delete saveClip.selected;
      return saveClip;
    });
  }
  indexedDB.save(vueInstance.projectId, 'track_clips', trackClips, () => {
    console.log('track_clips saved');
    vueInstance.unsaved = false;
  });
}

function loadProject(vueInstance, projectId, projectName) {
  // TODO: Set some flag on for a loading modal or smth
  vueInstance.hardReset();
  vueInstance.projectId = parseInt(projectId);
  vueInstance.projectName = projectName;

  indexedDB.get(vueInstance.projectId, 'project_data', projectData => {
    vueInstance.globalStart = projectData.globalStart;
    vueInstance.cursorX = projectData.cursorX;
    vueInstance.masterOutputKnob = projectData.masterOutputKnob;
    vueInstance.followCursor = projectData.followCursor;
    vueInstance.octave = projectData.octave;
    vueInstance.transpose = projectData.transpose;
    // todo: load click values

    indexedDB.get(parseInt(vueInstance.projectId), 'tracks', tracks => {
      console.log('load tracks', tracks);
      tracks.forEach(track => {
        vueInstance.loadInstrument(track.instrument, track.id);
        track.effects.forEach(effect => vueInstance.loadEffect(effect));
      });

      indexedDB.get(vueInstance.projectId, 'track_clips', trackClips => {
        console.log('load track_clips', trackClips);
        loadTrackClips(vueInstance, trackClips);
      });

      vueInstance.unsaved = false;
      vueInstance.isNew = false;
      // TODO: Set said flag back off
    });
  });
}

function loadTrackClips(vueInstance, trackClips) {
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
          vueInstance.clips.push(clip);

          // determine total timeleine width
          const lastSample = clip.xPos + clip.numSamples;
          if (lastSample > vueInstance.timeline.lastSample) {
            vueInstance.timeline.lastSample = lastSample;
          }
          // might fail because of race condition?
          if (++clipsProcessed >= numClips) {
            vueInstance.onLoadFinish(trackClips);
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
