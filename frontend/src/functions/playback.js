const Node = require("../class/Node");
const { state, tracklist, cliplist } = require("../state/vueInstance");


function playSingleClip(clip) {
  clip.playing = true;
  clip.source = Node.context.createBufferSource();
  clip.source.buffer = clip.buffer;

  const offsetStart = (state.instance.cursorX - clip.xPos + clip.startSample) * clip.sampleDuration;
  const offsetEnd = (clip.xPos + clip.endSample - state.instance.cursorX) * clip.sampleDuration;

  const track = tracklist.find(track => track.id == clip.trackId); // esto es una verga
  clip.source.connect(state.instance.clipDestination || track.trackGain.inputNode);
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


module.exports = {
  playSingleClip,
  stopAllClips,
};
