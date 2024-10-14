const Node = require("../class/Node");


function startExport(vueInstance) {
    let chunks = [];
    let mediaStreamDestination = Node.context.createMediaStreamDestination();
    vueInstance.exportMediaRecorder = new MediaRecorder(mediaStreamDestination.stream);

    vueInstance.masterOutput.connect(mediaStreamDestination);

    vueInstance.exportMediaRecorder.ondataavailable = ({ data }) => chunks.push(data);
    // When recording's finished, process data chunk
    // into a Blob, and save it for future use
    vueInstance.exportMediaRecorder.onstop = () => {
        const blobReader = new FileReader();
        const blob = new Blob(chunks, { type: 'audio/ogg' });

        blobReader.onloadend = () => {
            const arrayBuffer = blobReader.result;
            Node.context.decodeAudioData(arrayBuffer, audioBuffer => {
                vueInstance.export.blob = blob;
                vueInstance.export.buffer = audioBuffer;
                onRecordExportFinish(vueInstance);
            });
        };

        blobReader.readAsArrayBuffer(blob);
        mediaStreamDestination = null;
        chunks = null;
    };

    vueInstance.exportMediaRecorder.start();
}

function onRecordExportFinish(vueInstance) {
    vueInstance.exportMediaRecorder = null;
    vueInstance.clipDestination = null;

    if (!vueInstance.export.canceled) {
        downloadBlob(vueInstance.export.blob, vueInstance.export.name);
        vueInstance.export.name = null;
    }
}

function downloadBlob(blob, fileName) {
    const a = document.createElement('a');
    a.setAttribute('href', URL.createObjectURL(blob));
    a.setAttribute('download', fileName);
    a.click();
}

function finishRecExport(vueInstance) {
    vueInstance.exportMediaRecorder.stop();
    vueInstance.exporting = false;
    vueInstance.onStopBtn();
}


module.exports = {
    startExport,
    finishRecExport,
}
