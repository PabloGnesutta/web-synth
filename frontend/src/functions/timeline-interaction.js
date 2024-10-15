const { $ } = require("../dom-utils/DomUtils");
const { state } = require("../state/vueInstance");


const clipHandle = {
  height: 20,
  hookWidth: 10,
  color: '#10ff7050',
  selectedColor: '#ff652d96',
};

// Selection
function unselectClips(vueInstance) {
  if (!vueInstance.selectedClips.length) {
    return;
  }

  vueInstance.selectedClips.forEach(clip => {
    clip.selected = false;
    vueInstance.renderTrack(clip.trackId);
  });
  vueInstance.selectedClips = [];
}

function selectOneClip(vueInstance, clip) {
  const trackIds = new Set([clip.trackId]);

  state.instance.selectedClips.forEach(selectedClip => {
    selectedClip.selected = false;
    trackIds.add(selectedClip.trackId);
  });
  clip.selected = true;
  state.instance.selectedClips = [clip];
  trackIds.forEach(trackId => state.instance.renderTrack(trackId));
}

function unselectOneCLip(vueInstance, clip) {
  clip.selected = false;
  const index = vueInstance.selectedClips.findIndex(selectedClip => selectedClip.id === clip.id);
  vueInstance.selectedClips.splice(index, 1);
  const trackId = clip.trackId;
  vueInstance.renderTrack(trackId);
}

function selectClipOnHandleClick(vueInstance, e, trackId) {
  const xPos =
    (e.clientX - e.target.getBoundingClientRect().x + vueInstance.globalStart) / vueInstance.timeline.sampleWidth;
  const yPos = e.clientY - e.target.getBoundingClientRect().y;

  let anyClipSelected = false;
  let anyHandleClicked = false;
  if (yPos <= clipHandle.height) {
    const clips = vueInstance.trackClips[trackId];
    for (var i = 0; i < clips.length; i++) {
      const clip = clips[i];
      if (xPos >= clip.xPos && xPos + clip.startSample <= clip.xPos + clip.endSample) {
        // has clicked on a clip handle
        anyHandleClicked = true;
        if (e.ctrlKey) {
          if (!clip.selected) {
            clip.selected = true;
            vueInstance.selectedClips.push(clip);
            anyClipSelected = true;
          } else {
            unselectOneCLip(vueInstance, clip);
          }
        } else {
          if (!clip.selected) {
            selectOneClip(vueInstance, clip);
          }
        }
        break;
      }
    }
  }

  if (anyHandleClicked) {
    if (anyClipSelected) {
      vueInstance.renderTrack(trackId);
    }
  } else {
    unselectClips(vueInstance);
    vueInstance.positionCursor(xPos);
  }

  const timelines = $('.timeline');
  for (var i = 0; i < timelines.length; i++) {
    timelines[i].removeEventListener('mousemove', vueInstance.onCanvasMouseMove);
  }
  window.addEventListener('mousemove', vueInstance.onWindowMousemove);
  window.addEventListener('mouseup', vueInstance.onMouseUp);
}


module.exports = {
  clipHandle,
  selectClipOnHandleClick,
};
