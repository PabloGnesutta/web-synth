/*
Esto es un POC para exportar sumando buffers en vez de grabar el output en tiempo real

Sumar buffers te crea un nuevo buffer con toda la data... después
hay que ver cómo sincronizar cada clip con sus diferentes start y end positions
*/

const buffers = [];
let maxDuration = 0;
for (const trackId in this.trackClips) {
  const clips = this.trackClips[trackId];
  const clip = clips[0];
  buffers.push(clip.buffer);

  if (clip.duration > maxDuration) maxDuration = clip.duration;
}
const output = Node.context.createBuffer(
  1,
  maxDuration * Node.context.sampleRate,
  Node.context.sampleRate
);
buffers.forEach(buffer => {
  const outputData = output.getChannelData(0);
  const bufferData = buffer.getChannelData(0);
  for (let i = buffer.getChannelData(0).length - 1; i >= 0; i--) {
    outputData[i] += bufferData[i];
  }
  output.getChannelData(0).set(outputData);
});

const exportSource = Node.context.createBufferSource();
exportSource.buffer = output;
exportSource.connect(this.masterInput);
exportSource.start(0);