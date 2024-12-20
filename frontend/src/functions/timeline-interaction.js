const { $ } = require("../dom-utils/DomUtils");
const { state, timelineState, cliplist, trackClips, appState } = require("../state/vueInstance");
const { onStopBtnClick } = require("./playback");


const minSampleWidth = 1;
const carretMovementAmount = 50;

const clipHandle = {
  height: 20,
  hookWidth: 10,
  color: '#10ff7050',
  selectedColor: '#ff652d96',
};

const trackProps = {
  // todo: get from css
  rightCtrlsWidth: 247,
  leftCtrlsWidth: 180,
};

var selectedClips = [];


/* Selection */

function unselectClips() {
  if (!selectedClips.length) {
    return;
  }

  selectedClips.forEach(clip => {
    clip.selected = false;
    state.instance.renderTrack(clip.trackId);
  });
  selectedClips = [];
}

function selectOneClip(clip) {
  const trackIds = new Set([clip.trackId]);

  selectedClips.forEach(_clip => {
    _clip.selected = false;
    trackIds.add(_clip.trackId);
  });
  clip.selected = true;
  selectedClips = [clip];
  trackIds.forEach(trackId => state.instance.renderTrack(trackId));
}

function unselectOneCLip(clip) {
  clip.selected = false;
  const index = selectedClips.findIndex(selectedClip => selectedClip.id === clip.id);
  selectedClips.splice(index, 1);
  const trackId = clip.trackId;
  state.instance.renderTrack(trackId);
}

// onCanvasMouseDown
// TODO: Rename this function
function selectClipOnHandleClick(e, trackId) {
  const xPos =
    (e.clientX - e.target.getBoundingClientRect().x + state.instance.globalStart) / timelineState.sampleWidth;
  const yPos = e.clientY - e.target.getBoundingClientRect().y;

  let anyClipSelected = false;
  let anyHandleClicked = false;
  if (yPos <= clipHandle.height) {
    const clips = trackClips[trackId];
    for (var i = 0; i < clips.length; i++) {
      const clip = clips[i];
      if (xPos >= clip.xPos && xPos + clip.startSample <= clip.xPos + clip.endSample) {
        // has clicked on a clip handle
        anyHandleClicked = true;
        if (e.ctrlKey) {
          if (!clip.selected) {
            clip.selected = true;
            selectedClips.push(clip);
            anyClipSelected = true;
          } else {
            unselectOneCLip(clip);
          }
        } else {
          if (!clip.selected) {
            selectOneClip(clip);
          }
        }
        break;
      }
    }
  }

  if (anyHandleClicked) {
    if (anyClipSelected) {
      state.instance.renderTrack(trackId);
    }
  } else {
    unselectClips();
    positionCursor(xPos);
  }

  const timelines = $('.timeline');
  for (var i = 0; i < timelines.length; i++) {
    timelines[i].removeEventListener('mousemove', setIfClipWillResize);
  }
  window.addEventListener('mousemove', resizeOrMoveClips);
  window.addEventListener('mouseup', onTimelineMouseUp);
}

function positionCursor(xPos) {
  if (appState.recording) {
    return;
  }
  state.instance.cursorX = xPos;
  state.instance.renderCursor();
  if (appState.playing) {
    onStopBtnClick();
  }
}

// onWindowMousemove
function resizeOrMoveClips(e) {
  // TODO: Moving multiple clips work, resizing multiple clips don't
  for (var i = 0; i < selectedClips.length; i++) {
    const clip = selectedClips[i];
    if (clip.selected) {
      if (clip.willResize) {
        if (clip.willResize === 'start') {
          // resize from start
          if (clip.startSample + e.movementX >= 0) {
            if (clip.startSample + e.movementX < clip.endSample - 13) {
              // prevent reducing the clip to 0
              clip.startSample += e.movementX;
              clip.xPos += e.movementX;
            }
          } else {
            clip.startSample = 0;
          }
        } else {
          // resize from end
          if (clip.endSample + e.movementX <= clip.numSamples) {
            if (clip.endSample + e.movementX > clip.startSample + 13) {
              // prevent reducing the clip to 0
              clip.endSample += e.movementX;
            }
          } else {
            clip.endSample = clip.numSamples;
          }
        }
      } else {
        clip.xPos += e.movementX;
      }
    }

    if (clip.xPos + clip.endSample > timelineState.lastSample) {
      timelineState.lastSample = clip.xPos + clip.endSample;
    }

    state.instance.renderTrack(clip.trackId);
  }
}

// onCanvasMouseMove
function setIfClipWillResize(e) {
  const xPos =
    (e.clientX - e.target.getBoundingClientRect().x + state.instance.globalStart) / timelineState.sampleWidth;
  const yPos = e.clientY - e.target.getBoundingClientRect().y;

  let anyHandleHovered = false;
  const trackId = e.target.id;
  if (yPos <= clipHandle.height) {
    const clips = trackClips[trackId];
    for (var i = 0; i < clips.length; i++) {
      const clip = clips[i];
      if (xPos + clip.startSample >= clip.xPos && xPos + clip.startSample <= clip.xPos + clip.endSample) {
        // has hovered over a clip handle
        anyHandleHovered = true;
        if (xPos > clip.xPos - 10 && xPos < clip.xPos + clipHandle.hookWidth) {
          e.target.classList.add('e-resize');
          clip.willResize = 'start';
        } else if (
          xPos + clip.startSample > clip.xPos + clip.endSample - clipHandle.hookWidth &&
          xPos + clip.startSample < clip.xPos + clip.endSample + clipHandle.hookWidth
        ) {
          e.target.classList.add('e-resize');
          clip.willResize = 'end';
        } else {
          e.target.classList.remove('e-resize');
          clip.willResize = null;
        }
      }
    }
  }

  if (!anyHandleHovered) {
    e.target.classList.remove('e-resize');
  }
}

//onCanvasContainerWheel
function scrollOrZoomTimeline(e) {
  e.preventDefault();
  let amount = carretMovementAmount;
  let delta = minSampleWidth;
  if (e.wheelDelta < 0) {
    delta = -minSampleWidth;
  }
  if (e.shiftKey) {
    amount = 0;
    timelineState.sampleWidth += 1 * delta;
    if (timelineState.sampleWidth < minSampleWidth) {
      timelineState.sampleWidth = minSampleWidth;
    } else if (timelineState.sampleWidth > 3) {
      timelineState.sampleWidth = 3;
    }
  }

  if (state.instance.globalStart - amount * delta >= 0) {
    state.instance.moveCanvas(amount * delta);
    state.instance.renderCursor();
  }
}

/** 
 * Techically this is on WINDOW mouse up, 
 * but knob uses mouse up on window to. 
 * This name is for diferentiation.
 */
function onTimelineMouseUp(e) {
  const timelines = $('.timeline');
  for (var i = 0; i < timelines.length; i++) {
    timelines[i].addEventListener('mousemove', setIfClipWillResize);
  }
  window.removeEventListener('mousemove', resizeOrMoveClips);
  window.removeEventListener('mouseup', onTimelineMouseUp);
}

function duplicateClips() {
  selectedClips.forEach(clip => {
    const newClip = { ...clip };
    clip.xPos = clip.xPos + clip.endSample - clip.startSample;
    newClip.selected = false;
    cliplist.push(newClip);
    trackClips[clip.trackId].push(newClip);
    state.instance.renderTrack(clip.trackId);
  });
}


module.exports = {
  clipHandle,
  trackProps,
  selectClipOnHandleClick,
  resizeOrMoveClips,
  setIfClipWillResize,
  scrollOrZoomTimeline,
  onTimelineMouseUp,
  duplicateClips,
};
