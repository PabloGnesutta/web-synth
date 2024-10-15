const Node = require("../class/Node");


function playSingleClip(vueInstance, clip) {
  clip.playing = true;
  clip.source = Node.context.createBufferSource();
  clip.source.buffer = clip.buffer;

  const offsetStart = (vueInstance.cursorX - clip.xPos + clip.startSample) * clip.sampleDuration;
  const offsetEnd = (clip.xPos + clip.endSample - vueInstance.cursorX) * clip.sampleDuration;

  const track = vueInstance.tracks.find(track => track.id == clip.trackId); // esto es una verga
  clip.source.connect(vueInstance.clipDestination || track.trackGain.inputNode);
  clip.source.start(0, offsetStart, offsetEnd);

  clip.source.onended = () => {
    clip.playing = false;
    clip.source.disconnect();
    clip.source = null;
    delete clip.source;
  };
}


module.exports = {
  playSingleClip,
};
