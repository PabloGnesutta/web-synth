const Node = require("../class/Node");
const { clearObj } = require("../lib/array");
const { state, exportState, appState } = require("../state/vueInstance");
const { playAllTracks, onStopBtnClick } = require("./playback");


function triggerExport() {
    const exportName = prompt('File name?', 'web-synth-export');
    if (!exportName) {
        return;
    }
    onStopBtnClick();
    onStopBtnClick(); // call twice to jump to the start of the timeline
    clearObj(exportState);
    exportState.name = exportName;
    appState.exporting = true;
    startExport();
    exportState.clipDestination = state.instance.masterInput;
    playAllTracks();
}

function startExport() {
    let chunks = [];
    let mediaStreamDestination = Node.context.createMediaStreamDestination();
    exportState.mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);

    state.instance.masterOutput.connect(mediaStreamDestination);

    exportState.mediaRecorder.ondataavailable = ({ data }) => chunks.push(data);
    // When recording's finished, process data chunk
    // into a Blob, and save it for future use
    exportState.mediaRecorder.onstop = () => {
        const blobReader = new FileReader();
        const blob = new Blob(chunks, { type: 'audio/ogg' });

        blobReader.onloadend = () => {
            const arrayBuffer = blobReader.result;
            Node.context.decodeAudioData(arrayBuffer, audioBuffer => {
                exportState.blob = blob;
                exportState.buffer = audioBuffer;
                onRecordExportFinish();
            });
        };

        blobReader.readAsArrayBuffer(blob);
        mediaStreamDestination = null;
        chunks = null;
    };

    exportState.mediaRecorder.start();
}

function onRecordExportFinish() {
    exportState.mediaRecorder = null;
    exportState.clipDestination = null;

    if (!exportState.canceled) {
        downloadBlob(exportState.blob, exportState.name);
        exportState.name = null;
    }
}

function downloadBlob(blob, fileName) {
    const a = document.createElement('a');
    a.setAttribute('href', URL.createObjectURL(blob));
    a.setAttribute('download', fileName);
    a.click();
}

function finishRecExport() {
    exportState.mediaRecorder.stop();
    appState.exporting = false;
    onStopBtnClick();
}

function cancelExport() {
    exportState.canceled = true;
    finishRecExport();
}


module.exports = {
    triggerExport,
    startExport,
    finishRecExport,
    cancelExport,
};
