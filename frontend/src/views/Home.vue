<template>
  <div class="Home">
    <div class="welcome-msg" v-if="!inited">
      <p>Welcome to web-synth</p>
      <p>Click anywhere to Start!</p>
    </div>

    <div class="inited" v-if="inited">
      <div class="top-section">
        <div class="header-wrapper">
          <Header
            @createInstrument="createInstrument"
            @createModulator="createModulator"
            @createEffect="createEffect"
            @createMic="createMic"
            @startRec="startRec"
            @stopRec="stopRec"
            @playExport="playExport"
            @downloadExport="downloadExport"
            @stopPlayingExport="stopPlayingExport"
            @loadSave="loadSave"
            :tracks="tracks"
            :playing="playing"
            :recording="recording"
            :recordingsAvailable="recordingsAvailable"
          />
        </div>
        <div class="click-wrapper">
          <Click ref="click" />
        </div>
      </div>
      <!-- TRACKS -->
      <div class="tracks" :class="{ mapping: mapping }">
        <div
          class="track"
          :key="track.name"
          v-for="(track, t) in tracks"
          :class="{
            selected: currentTrackIndex === t,
            connecting: appConnecting,
          }"
          @click="trackClicked(t)"
        >
          <!-- Modulators -->
          <div class="track-inner" :class="'track-inner_' + t">
            <div class="track-modulators">
              <NodeRender
                v-for="(Mod, m) in track.modulators"
                :Node="Mod"
                :key="m"
                @deleteNode="deleteModulator(t, m)"
              />
            </div>

            <!-- Instrument -->
            <div class="track-instrument">
              <NodeRender
                :Node="track.instrument"
                :analyser="track.instrumentAnalyser"
                :instrumentEnabled="track.instrumentEnabled"
                @deleteNode="deleteTrack(t)"
                @toggleInstrumentEnabled="toggleInstrumentEnabled(t)"
              />
            </div>

            <!-- Effects -->
            <div class="track-effects">
              <NodeRender
                v-for="(Node, n) in track.effects"
                :Node="Node"
                :analyser="Node.analyser"
                :key="n"
                :ref="'Node-' + n"
                @deleteNode="deleteEffect(t, n)"
                @levelClicked="levelClicked(Node)"
              />
              <div class="track-right-placeholder"></div>
            </div>
          </div>
          <!-- Track Gain -->
          <div class="track-gain">
            <NodeRender
              :Node="track.trackGain"
              :analyser="track.trackGainAnalyser"
              :recEnabled="track.recEnabled"
              @toggleRecEnabled="toggleRecEnabled(t)"
            />
          </div>
        </div>
      </div>

      <!-- Main Gain -->
      <div class="section-inner Main-Gain">
        <h3>Main Gain</h3>
        <div class="knob-wrapper" @click="knobClicked('MainGain')">
          <Knob
            :ref="'MainGain'"
            minVal="0"
            maxVal="1"
            :initVal="mainGainKnob"
            @knobTurned="onMainGainKnobInput"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const noteKeys = require("../data/noteKeys");

const Node = require("../class/Node");
const EQ3 = require("../class/Effects/EQ3");
const Gain = require("../class/Effects/Gain");
const Delay = require("../class/Effects/Delay");
const Reverb = require("../class/Effects/Reverb");
const Looper = require("../class/Effects/Looper");
const Compressor = require("../class/Effects/Compressor");
const BiquadFilter = require("../class/Effects/BiquadFilter");

const Mic = require("../class/Instruments/Mic");
const Femod = require("../class/Instruments/Femod");
const Duette = require("../class/Instruments/Duette");
const Carrier = require("../class/Instruments/Carrier");
const Drumkit = require("../class/Instruments/Drumkit");
const Sampler = require("../class/Instruments/Sampler");
const WhiteNoise = require("../class/Instruments/WhiteNoise");

const Modulator = require("../class/Oscillator/Modulator");

const instrumentsDict = new Map([
  ["Mic", Mic],
  ["Femod", Femod],
  ["Carrier", Carrier],
  ["Drumkit", Drumkit],
  ["Sampler", Sampler],
  ["Duette", Duette],
  ["WhiteNoise", WhiteNoise],
]);

const effectsDict = new Map([
  ["Gain", Gain],
  ["EQ3", EQ3],
  ["Delay", Delay],
  ["Reverb", Reverb],
  ["Looper", Looper],
  ["Compressor", Compressor],
  ["BiquadFilter", BiquadFilter],
]);

import { mapMutations, mapGetters } from "vuex";
import NodeRender from "../components/NodeRender";
import Header from "../components/Header";
import Click from "../components/Click";
import Knob from "../components/Knob";

export default {
  name: "Home",
  data() {
    return {
      inited: false,

      tracks: [],
      trackCount: 0,
      currentTrackIndex: 0,

      mainGain: null,
      mixerGain: null,
      mainGainKnob: 0.5,

      keyEnabled: [],
      keypressListeners: [],
      numpadListeners: [],

      //MIDI
      maps: [],
      inputs: [],
      outputs: [],
      mapping: false,
      refBeignMapped: null,

      //REC
      recordingCount: 0,
      recordings: [],
      scene: [],
      mediaRecorders: [],
      recording: false,
      blobs: [],
      exportDestination: null,
      exportBlobs: [],
      exports: [],
      chunks: [],

      //canvas
      showRecordWaveforms: false,
      renderFinished: false,

      //play
      playing: false,
      playingBuffers: [],
      recordingsAvailable: false,

      //keys
      m_pressed: false,
      ctrl_pressed: false,
    };
  },

  computed: {
    ...mapGetters(["context", "appIsMapping", "appConnecting"]),
  },

  mounted() {
    this.keyEnabled = Array(222).fill(true);
    if (navigator.requestMIDIAccess) {
      navigator
        .requestMIDIAccess()
        .then(this.onMIDISuccess, this.onMIDIFailure);
    }

    document.querySelector(".Home").addEventListener("click", this.init);
  },

  methods: {
    ...mapMutations(["setAppIsMapping", "setContext"]),
    toggleRecEnabled(t) {
      this.tracks[t].recEnabled = !this.tracks[t].recEnabled;
    },

    init() {
      this.addConfirmLeaveHandler();
      document.querySelector(".Home").removeEventListener("click", this.init);
      this.setContext(new (window.AudioContext || window.webkitAudioContext)());
      Node.context = this.context;

      this.createMainGain();
      this.createTrack(new Sampler());

      window.addEventListener("keyup", this.onKeyup);
      window.addEventListener("keydown", this.onKeydown);

      this.inited = true;
    },

    //REC

    startRec() {
      const recordingTracks = this.tracks.filter((t) => t.recEnabled);
      const total = recordingTracks.length;
      let c = 0;

      this.recordingCount++;
      this.recording = true;
      this.renderFinished = false;

      // record entire mix

      this.chunks = [];
      this.exportDestination = this.context.createMediaStreamDestination();
      this.mainGain.connect(this.exportDestination);

      this.exportMediaRecorder = new MediaRecorder(
        this.exportDestination.stream
      );

      this.exportMediaRecorder.ondataavailable = (evt) => {
        this.chunks.push(evt.data);
      };

      this.exportMediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: "audio/ogg; codecs=opus",
        });

        this.exportBlobs.push(blob);

        const exportFileReader = new FileReader();

        exportFileReader.onloadend = () => {
          const arrayBuffer = exportFileReader.result;

          this.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
            this.exports.push({ id: this.recordingCount, audioBuffer });
          });
        };

        exportFileReader.readAsArrayBuffer(blob);
      };

      this.exportMediaRecorder.start();
      console.log("rec start");

      //record each track

      recordingTracks.forEach((t, i) => {
        let chunks = [];
        let dest = this.context.createMediaStreamDestination();
        t.trackGain.connectNativeNode(dest);

        let mediaRecorder = new MediaRecorder(dest.stream);
        this.mediaRecorders.push(mediaRecorder);

        mediaRecorder.ondataavailable = (evt) => {
          chunks.push(evt.data);
        };

        mediaRecorder.onstop = (evt) => {
          const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
          chunks = null;

          const fileReader = new FileReader();

          fileReader.onloadend = () => {
            const arrayBuffer = fileReader.result;

            this.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
              this.scene.push({ audioBuffer, blob, trackId: t.id });
              // t.trackGain.disconnectNativeNode(dest)
              dest = null;
              if (++c === total) this.recordingsReady();
            });
          };

          fileReader.readAsArrayBuffer(blob);
        };

        mediaRecorder.start();
      });
    },

    stopRec() {
      this.mainGain.disconnect(this.exportDestination);
      this.exportDestination = null;
      this.exportMediaRecorder.stop();
      this.exportMediaRecorder = null;
      this.mediaRecorders.forEach((mr) => {
        mr.stop();
      });
      this.mediaRecorders = [];
      this.recording = false;
    },

    recordingsReady() {
      const name = prompt(
        "Recording Name",
        "Recording Nº " + this.recordingCount
      );
      this.recordings.push({
        id: this.recordingCount,
        name,
        scene: this.scene,
      });
      this.recordingsAvailable = true;
      this.scene = [];
    },

    downloadExport() {
      const length = this.recordings.length;
      let index = prompt(
        "Which recording do you want to download? Choose number: 1 to " +
          length,
        1
      );
      index = parseInt(index);

      if (!index) return alert("Only numers from 1 to " + length);

      if (index > length || index < 1)
        return alert("There is no such recording!");

      let fileName =
        "websynth_export_" +
        index +
        " - " +
        new Date().toLocaleDateString("es-AR");
      fileName = prompt("Export name: ", fileName);
      if (!fileName) return;

      index--;

      this.downloadBlob(this.exportBlobs[index], fileName);
    },

    playExport() {
      let index = prompt(
        "Which recording do you want to play? Choose number: 1 to " +
          this.recordings.length,
        1
      );
      index = parseInt(index);

      if (!index)
        return alert("Only numers from 1 to " + this.recordings.length);

      if (index > this.recordings.length || index < 1)
        return alert("There is no such recording!");

      index--;

      this.exportSource = this.context.createBufferSource();
      this.exportSource.buffer = this.exports[index].audioBuffer;

      this.exportSource.connect(this.context.destination);
      this.exportSource.start();
      this.playing = true;

      this.exportSource.onended = () => {
        this.playing = false;
      };

      this.playAllTracks(index);
    },

    playAllTracks(index) {
      this.recordings[index].scene.forEach((s) => {
        // const source = this.context.createBufferSource();
        // source.buffer = s.audioBuffer;
        // source.connect(this.mainGain);
        // source.start();
        console.log(
          "trackId: " +
            s.trackId +
            " - download URL: " +
            URL.createObjectURL(s.blob)
        );
      });
    },

    stopPlayingExport() {
      this.exportSource.stop(0);
      this.playing = false;
    },

    downloadBlob(blob, fileName) {
      const a = document.createElement("a");
      a.setAttribute("href", URL.createObjectURL(blob));
      a.setAttribute("download", fileName);
      a.click();
    },

    createTrack(instrument) {
      //track gain
      const trackGain = new Gain("Track Gain");
      trackGain.connectNativeNode(this.mixerGain, "Mixer Gain");

      const trackGainAnalyser = this.context.createAnalyser();
      trackGain.connectNativeNode(trackGainAnalyser, "Analyser");

      //instrument
      instrument.connect(trackGain);

      //track
      this.tracks.push({
        id: ++this.trackCount,
        name: "Track " + this.trackCount,
        displayName: "Track " + this.trackCount,
        instrument,
        modulators: [],
        effects: [],
        trackGain,
        trackGainAnalyser,
        recEnabled: true,
        instrumentEnabled: true,
      });

      this.currentTrackIndex = this.tracks.length - 1;
      this.currentTrack = this.tracks[this.currentTrackIndex];

      this.keypressListeners.push({
        instrument,
        trackName: this.currentTrack.name,
      });

      if (instrument.nodeType === "Drumkit")
        this.numpadListeners.push({
          instrument,
          trackName: this.currentTrack.name,
        });

      this.$nextTick(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
    },

    deleteTrack(t) {
      let track = this.tracks[t];

      //remove from keypressListeners
      let index = this.keypressListeners.findIndex(
        (listener) => listener.trackName === track.name
      );
      if (index !== -1) this.keypressListeners.splice(index, 1);
      //remove from numpadListeners
      index = this.numpadListeners.findIndex(
        (listener) => listener.trackName === track.name
      );
      if (index !== -1) this.numpadListeners.splice(index, 1);

      //remove track
      track.instrument.destroy();
      track.trackGain.destroy();
      track.effects.forEach((e) => {
        e.destroy();
      });
      track.modulators.forEach((m) => {
        m.destroy();
      });
      track = null;
      this.tracks.splice(t, 1);
    },

    toggleInstrumentEnabled(t) {
      const track = this.tracks[t];
      track.instrumentEnabled = !this.tracks[t].instrumentEnabled;

      if (track.instrumentEnabled) {
        this.keypressListeners.push({
          instrument: track.instrument,
          trackName: track.name,
        });
        if (track.instrument.name === "Mic") track.instrument.setMute(false);
      } else {
        const i = this.keypressListeners.findIndex(
          (kpl) => kpl.trackName === track.name
        );
        this.keypressListeners.splice(i, 1);
        if (track.instrument.name === "Mic") track.instrument.setMute(true);
      }
    },

    insertEffect(Node) {
      const track = this.tracks[this.currentTrackIndex];
      const effects = track.effects;
      const prev = effects[effects.length - 1] || track.instrument;
      const next = track.trackGain;

      prev.disconnect().connect(Node).connect(next);
      effects.push(Node);
      this.$nextTick(() => {
        const trackInnerClass = ".track-inner_" + this.currentTrackIndex;
        const trackInner = document.querySelector(trackInnerClass);
        trackInner.scrollTo(trackInner.offsetWidth, 0);
      });
    },

    deleteEffect(t, n) {
      const track = this.tracks[t];
      const effects = track.effects;

      const prev = effects[n - 1] || track.instrument;
      const next = effects[n + 1] || track.trackGain;

      prev.disconnect().connect(next);

      effects[n].destroy();
      effects.splice(n, 1);
    },

    deleteModulator(t, m) {
      const trackModulators = this.tracks[t].modulators;
      trackModulators[m].destroy();
      trackModulators.splice(m, 1);
    },

    // CREATE NODES
    createInstrument(className) {
      const Node = new (instrumentsDict.get(className))();
      this.createTrack(Node);
      return Node;
    },
    createEffect(className) {
      const Node = new (effectsDict.get(className))();
      this.insertEffect(Node);
      return Node;
    },
    createModulator() {
      const track = this.tracks[this.currentTrackIndex];
      track.modulators.push(new Modulator("sawtooth"));
    },

    createMic() {
      const that = this;
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then(function (stream) {
          that.createTrack(new Mic(stream));
        })
        .catch(function (err) {
          console.log("err", err);
          alert(
            "Couldn't get user media, continuing without mic input. Error: " +
              err
          );
        });
    },

    trackClicked(t) {
      this.currentTrackIndex = t;
      this.currentTrack = this.tracks[this.currentTrackIndex];
    },

    createMainGain() {
      this.mainGain = this.context.createGain();
      this.mainGain.gain.value = this.mainGainKnob;
      this.mainGain.connect(this.context.destination);

      this.mixerGain = this.context.createGain();
      this.mixerComp = this.context.createDynamicsCompressor();

      this.mixerGain.connect(this.mainGain);
      // this.mixerComp.connect(this.mainGain);
    },

    onMainGainKnobInput(val) {
      this.mainGain.gain.setValueAtTime(val, 0);
    },

    onKeydown(e) {
      if (!this.keyEnabled[e.keyCode]) return;
      this.keyEnabled[e.keyCode] = false;

      const noteKeyIndex = noteKeys.findIndex((nk) => e.key === nk[0]);
      if (noteKeyIndex !== -1) {
        this.keypressListeners.forEach((scaleInterface) => {
          scaleInterface.instrument.playNote(noteKeyIndex);
        });
      } else {
        this.onOtherDown(e);
      }
    },

    onKeyup(e) {
      this.keyEnabled[e.keyCode] = true;
      const noteKeyIndex = noteKeys.findIndex((nk) => e.key === nk[0]);

      if (noteKeyIndex !== -1) {
        this.keypressListeners.forEach((scaleInterface) => {
          scaleInterface.instrument.stopNote(noteKeyIndex);
        });
      } else {
        this.onOtherKeyup(e);
      }
    },

    onOtherDown({ key, keyCode }) {
      if (keyCode === 77) this.m_pressed = true;
      if (keyCode === 17) this.ctrl_pressed = true;

      //1 a 9 numpad
      if (keyCode >= 97 && keyCode <= 105) {
        this.numpadListeners.forEach((scaleInterface) => {
          scaleInterface.instrument.playNote(parseInt(key));
        });
      }
    },

    onOtherKeyup({ key, keyCode }) {
      // console.log(keyCode, key);
      //1 a 9
      if (keyCode >= 49 && keyCode <= 57)
        if (this.m_pressed) this.tracks[+key - 1].trackGain.toggleMute();

      //m
      if (keyCode === 77) {
        this.m_pressed = false;
        if (this.ctrl_pressed) this.currentTrack.trackGain.toggleMute();
      }

      //q
      if (keyCode === 81)
        if (this.ctrl_pressed) this.deleteTrack(this.currentTrackIndex);

      //ctrl
      if (keyCode === 17) this.ctrl_pressed = false;

      this.keypressListeners.forEach((scaleInterface) => {
        scaleInterface.instrument.onOtherKeyup(key);
      });
    },

    // MIDI
    toggleMapping() {
      if (this.refBeignMapped) {
        this.refBeignMapped.stopMapping();
        this.refBeignMapped = null;
      }
      this.mapping = !this.mapping;
      this.setAppIsMapping(this.mapping);
      console.log(this.appIsMapping);
    },

    knobClicked(refName) {
      if (!this.mapping) return;
      if (this.refBeignMapped) {
        this.refBeignMapped.stopMapping();
        this.refBeignMapped = null;
      }

      const knob = this.$refs[refName][0] || this.$refs[refName];
      this.refBeignMapped = knob;
      knob.startMapping();
    },

    getMIDIMessage({ data }) {
      const cmd = data[0];
      const note = data[1];
      const value = data[2];

      if (this.mapping) {
        let refName = this.refBeignMapped.$vnode.data.ref;
        const existingMap = this.maps.find((m) => m.refName === refName);
        if (!existingMap) {
          this.maps.push({
            refName,
            cmd,
            note,
          });
        } else {
          existingMap.cmd = cmd;
          existingMap.note = note;
        }
        const knob = this.$refs[refName][0] || this.$refs[refName];
        knob.assignMap(cmd, note);
        return;
      } else {
        const mappedItem = this.maps.find(
          (m) => m.cmd === cmd && m.note === note
        );
        if (!mappedItem) return;
        const knob =
          this.$refs[mappedItem.refName][0] || this.$refs[mappedItem.refName];
        knob.receiveMidi(value);
      }
    },

    onMIDISuccess(midiAccess) {
      // console.log("MIDI Access:", midiAccess);
      this.inputs = midiAccess.inputs;
      this.outputs = midiAccess.outputs;

      for (var input of this.inputs.values()) {
        input.onmidimessage = this.getMIDIMessage;
      }
    },

    onMIDIFailure() {
      console.log("Could not access your MIDI devices.");
    },

    //Waveforms:

    renderWaveforms() {
      for (let i = 0; i < this.recordings.length; i++)
        this.renderWaveform(this.recordings[i]);
      this.renderFinished = true;
      console.log("finished rendering");
    },

    renderWaveform({ audioBuffer, track }) {
      console.log("rendering waveform", track);
      let canvas = document.createElement("canvas");
      canvas.width = audioBuffer.duration * 100;

      const canvasWidth = canvas.width;
      const canvasHeight = 150;
      const context = canvas.getContext("2d");
      var leftChannel = audioBuffer.getChannelData(0); // Float32Array describing left channel

      context.save();
      context.fillStyle = "#222";
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      context.strokeStyle = "#122";
      context.globalCompositeOperation = "lighter";
      context.translate(0, canvasHeight / 2);
      context.globalAlpha = 0.06; // lineOpacity ;
      for (var i = 0; i < leftChannel.length; i++) {
        var x = Math.floor((canvasWidth * i) / leftChannel.length);
        var y = (leftChannel[i] * canvasHeight) / 2 - 2;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x + 1, y);
        context.stroke();
      }
      context.restore();
      console.log("done");
      document.querySelector(".canvases").appendChild(canvas);
    },

    loadSave(tracks) {
      tracks.forEach((t) => {
        const instrument = new (instrumentsDict.get(t.instrument.nodeType))();
        instrument.setGain(t.instrument.gain);

        if (t.instrument.octave) instrument.octave = t.instrument.octave;
        if (t.instrument.transpose)
          instrument.transpose = t.instrument.transpose;

        this.createTrack(instrument);

        //seting instruments

        if (t.instrument.audioParams)
          t.instrument.audioParams.forEach((ins_ap, i) => {
            instrument.setAudioParam(i, ins_ap.value);
          });

        if (t.instrument.innerNodeAudioParams)
          t.instrument.innerNodeAudioParams.forEach((ins_inap, i) => {
            instrument.setInnerNodeAudioParam(i, ins_inap.value);
          });

        if (t.instrument.customParams)
          t.instrument.customParams.forEach((ins_cp, i) => {
            instrument.setCustomParam(i, ins_cp.value);
          });

        if (t.instrument.modulationParams)
          t.instrument.modulationParams.forEach((ins_mp, i) => {
            instrument.setModulationParam(i, ins_mp.value);
          });

        if (t.instrument.duetteParams) {
          for (let o = 0; o < t.instrument.oscillatorsPerNote; o++) {
            const state = t.instrument.oscillatorsState[o];
            instrument.setDuetteParam(o, 0, state.A);
            instrument.setDuetteParam(o, 1, state.D);
            instrument.setDuetteParam(o, 2, state.S);
            instrument.setDuetteParam(o, 3, state.R);
            instrument.setDuetteParam(o, 4, state.detune);
            instrument.setDuetteParam(o, 5, state.gain);
            instrument.setType(o, state.type);
            // t.instrument.setDuetteParam(o, p)
          }
        }

        // return;

        //setting effects

        t.effects.forEach((ef) => {
          const effect = new (effectsDict.get(ef.nodeType))();
          effect.setGain(ef.gain);

          if (ef.audioParams)
            ef.audioParams.forEach((ef_ap, i) => {
              effect.setAudioParam(i, ef_ap.value);
            });

          if (ef.innerNodeAudioParams)
            ef.innerNodeAudioParams.forEach((ef_inap, i) => {
              effect.setInnerNodeAudioParam(i, ef_inap.value);
            });

          if (ef.customParams)
            ef.customParams.forEach((ef_cp, i) => {
              effect.setCustomParam(i, ef_cp.value);
            });

          //set dry/wet

          this.insertEffect(effect);
        });
      });
    },

    getCssNodeName(name) {
      return name.replace(new RegExp(" ", "g"), "-");
    },

    addConfirmLeaveHandler() {
      window.onbeforeunload = function (e) {
        e = e || window.event;
        if (e) e.returnValue = "Sure?";
        return "Sure?";
      };
    },
  },

  beforeDestroy() {
    console.log("beforedestroy");
    this.setContext(null);
    window.removeEventListener("keyup", this.onKeyup);
    window.removeEventListener("keydown", this.onKeydown);
  },

  components: {
    Knob,
    Click,
    Header,
    NodeRender,
  },
};
</script>

<style lang="scss">
.Home {
  min-height: 90vh;
}

.top-section {
  position: fixed;
  top: 2px;
  width: 100%;
  z-index: 1;
}

.header-wrapper {
  position: relative;
  top: 0;
  z-index: 1;
}

.click-wrapper {
  width: 100%;
  border-bottom: 1px solid rgb(161, 161, 161);
  border-top: 1px solid rgb(161, 161, 161);
}

.tracks {
  margin: 6em 0 1em;
  border: 3px solid transparent;
}

.tracks.mapping {
  border: 3px solid var(--color-1);
}

.track {
  margin: 0 auto 0.5em;
  // overflow-x: auto;
  background: #111;
  padding: 0.3em 0.5em;

  display: flex;
  // align-items: center;
  // align-items: flex-end;
  gap: 0.5em;
  border: 2px solid transparent;
  transition: border-color 0.2s ease-out;
}

.track-inner {
  background: transparent;
  display: flex;
  // align-items: center;
  // align-items: flex-end;
  gap: 1em;
  overflow-x: auto;
  padding-bottom: 0.3em;
  flex: 1;
}

.track-right-placeholder {
  // width: 10px;
}

.node {
  height: 100%;
}

.track-instrument .container {
  height: 100%;
}
.track-instrument .node .node-name {
  color: var(--color-1);
  font-size: 1.1rem;
}

.track.selected {
  border: 2px solid #ff857c;
}

.track-modulators {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.track-effects {
  display: flex;
  // align-items: center;
  gap: 0.5em;
}

.track-gain {
  align-self: flex-end;
}

// IF CONNECTING
.connecting {
  .node.current-node {
    border: 2px solid yellow;
  }

  .node:not(.current-node):not(.Track-Gain):not(.Delay):not(.Femod) {
    border-color: green;
    .node-name {
      color: var(--color-2);
    }
    .param-name.connectable {
      color: yellow;
      cursor: pointer;
    }
    .param-name:not(.connectable) {
      color: gray;
    }
  }

  .output {
    cursor: default;
    color: gray;
  }
}

.Main-Gain {
  margin: 1em auto 0;
  color: #f3f3f3;
  max-width: 300px;
  transition: border-color 0.2s ease-out;
}

.level {
  cursor: default;
  transition: border-color 0.2s ease-out;
}

.Main-Gain:not(.is-connection-destination),
.level:not(.is-connection-destination) {
  border: 2px solid transparent;
}

.welcome-msg {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
}

// Scoll Pane
$spWidth: 200px;
$spHeight: 200px;
$scrollBarThickness: 17px;
//@scroll
$xMaxVal: 1000px; //e.srcElement.scrollLeft;
$yMaxVal: 60px; //e.srcElement.scrollTop;
.scroll-pane {
  display: none;
  height: $spHeight + $scrollBarThickness;
  width: $spWidth + $scrollBarThickness;
  background: black;
  overflow: auto;
  padding: 0;
}

.scroll-pane-inner {
  height: $spHeight + $yMaxVal;
  width: $spWidth + $xMaxVal;
}

.exporting-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba($color: #000000, $alpha: 0.9);
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  .exporting-modal-content {
    font-size: 2rem;
  }
}

canvas {
  display: block;
}
</style>
