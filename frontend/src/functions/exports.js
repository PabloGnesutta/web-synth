const Node = require("../class/Node");
const { state } = require("../state/vueInstance");


function startExport() {
    let chunks = [];
    let mediaStreamDestination = Node.context.createMediaStreamDestination();
    state.instance.exportMediaRecorder = new MediaRecorder(mediaStreamDestination.stream);

    state.instance.masterOutput.connect(mediaStreamDestination);

    state.instance.exportMediaRecorder.ondataavailable = ({ data }) => chunks.push(data);
    // When recording's finished, process data chunk
    // into a Blob, and save it for future use
    state.instance.exportMediaRecorder.onstop = () => {
        const blobReader = new FileReader();
        const blob = new Blob(chunks, { type: 'audio/ogg' });

        blobReader.onloadend = () => {
            const arrayBuffer = blobReader.result;
            Node.context.decodeAudioData(arrayBuffer, audioBuffer => {
                state.instance.export.blob = blob;
                state.instance.export.buffer = audioBuffer;
                onRecordExportFinish();
            });
        };

        blobReader.readAsArrayBuffer(blob);
        mediaStreamDestination = null;
        chunks = null;
    };

    state.instance.exportMediaRecorder.start();
}

function onRecordExportFinish() {
    state.instance.exportMediaRecorder = null;
    state.instance.clipDestination = null;

    if (!state.instance.export.canceled) {
        downloadBlob(state.instance.export.blob, state.instance.export.name);
        state.instance.export.name = null;
    }
}

function downloadBlob(blob, fileName) {
    const a = document.createElement('a');
    a.setAttribute('href', URL.createObjectURL(blob));
    a.setAttribute('download', fileName);
    a.click();
}

function finishRecExport() {
    state.instance.exportMediaRecorder.stop();
    state.instance.exporting = false;
    state.instance.onStopBtn();
}


module.exports = {
    startExport,
    finishRecExport,
};
