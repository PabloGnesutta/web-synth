<template>
  <div class="home-wrapper">
    <div v-if="inited" class="home-inner">
      <!-- Top Section -->
      <div class="top-section">
        <Header
          :ref="'header'"
          @startRec="startRec"
          @stopRec="stopRec"
          @playExport="playRecording"
          @downloadExport="downloadExport"
          @stopPlayingExport="stopPlayingExport"
          @loadSave="loadSave"
          @toggleMapping="toggleMapping"
          :octave="octave"
          :transpose="transpose"
          :tracks="tracks"
          :playing="playing"
          :recording="recording"
          :recordingsAvailable="recordingsAvailable"
        />
      </div>

      <!-- Mid Section -->
      <div class="mid-section">
        <Sidebar
          class="left-col"
          @createInstrument="createInstrument"
          @createEffect="createAndInsertEffect"
          @loadPreset="loadPreset"
          :instrument-is-loaded="!!currentTrack"
        />

        <div class="right-col">
          <!-- Click -->
          <div class="click-wrapper"><Click ref="click" /></div>

          <!-- Tracks -->
          <div
            class="tracks-container custom-scrollbar"
            :class="{ mapping: mapping }"
            @mousewheel="moveCanvas"
          >
            <div class="track-list">
              <div
                v-for="(track, t) in tracks"
                :key="track.id"
                class="track"
                :class="{ selected: currentTrackIndex === t, connecting: appConnecting }"
                @click.self="selectTrack(t)"
              >
                <div class="track-inner-left no-scrollbar">
                  <div @click="deleteTrack(t)" class="pointer">[X]</div>
                  <div class="select-none" @click="selectTrack(t)">{{ track.name }}</div>
                  <div class="select-none" @click="selectTrack(t)">
                    {{ track.instrument.name }}
                  </div>
                </div>

                <!-- Rec Canvas -->
                <div class="rec-canvas">
                  <canvas :ref="`rec-canvas-${track.id}`"></canvas>
                </div>

                <!-- Track Gain and Controls -->
                <GainBody
                  :Node="track.trackGain"
                  :analyser="track.trackGainAnalyser"
                  :recEnabled="track.recEnabled"
                  @toggleRecEnabled="toggleRecEnabled(t)"
                  @knobClicked="knobClicked"
                />
              </div>
            </div>

            <!-- Master -->
            <div class="track master">
              <div class="track-inner-left">Master</div>
              <div class="master-knob-wrapper" @click="knobClicked('MasterGain')">
                <Knob
                  :ref="'MasterGain'"
                  minVal="0"
                  maxVal="1"
                  :initVal="masterGainKnob"
                  @knobTurned="setMasterGainValue"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom section: Current Track -->
      <div class="bottom-section">
        <div
          v-if="currentTrack"
          class="track-detail custom-scrollbar"
          :class="'track-detail_' + currentTrackIndex"
        >
          <!-- Instrument -->
          <div class="track-instrument">
            <NodeRender
              :Node="currentTrack.instrument"
              :analyser="currentTrack.instrumentAnalyser"
              :instrumentEnabled="currentTrack.instrumentEnabled"
              @deleteNode="deleteTrack"
              @toggleInstrumentEnabled="toggleInstrumentEnabled"
              @knobClicked="knobClicked"
            />
          </div>

          <!-- Effects -->
          <div class="track-effects">
            <NodeRender
              v-for="(Node, effectIndex) in currentTrack.effects"
              :Node="Node"
              :analyser="Node.analyser"
              :key="Node.id"
              :ref="'Node-' + effectIndex"
              @deleteNode="deleteEffect(effectIndex)"
              @levelClicked="levelClicked(Node)"
              @knobClicked="knobClicked"
            />
            <div class="placeholder"></div>
          </div>
        </div>
        <div v-else class="current-track-empty-state select-none">Double click an instrumentto start</div>
      </div>

      <!-- xyPad -->
      <!-- <Pad
        v-if="false"
        @onPadTouchStart="onPadTouchStart"
        @onPadTouchEnd="onPadTouchEnd"
        @onPadTouchCancel="onPadTouchCancel"
        @onPadTouchMove="onPadTouchMove"
      /> -->
    </div>

    <div v-else class="welcome-msg select-none">
      <p>Welcome to web-synth</p>
      <p>Click anywhere to Start!</p>
    </div>
  </div>
</template>

<script>
import { createInstrument, createEffect } from '../factory/NodeFactory';
const noteFrequencies = require('../data/noteFrequencies');
const totalAmountOfNotes = noteFrequencies.length;
const noteKeys = require('../data/noteKeys');

const Node = require('../class/Node');
const Gain = require('../class/Effects/Gain');

import { mapMutations, mapGetters } from 'vuex';
import NodeRender from '../components/NodeRender';
import GainBody from '../components/specific-nodes/GainBody';
import Pad from '@/components/user-interface/Pad';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Click from '../components/Click';
import Knob from '../components/Knob';

export default {
  name: 'Home',
  components: {
    Knob,
    Pad,
    Click,
    Header,
    Sidebar,
    NodeRender,
    GainBody,
  },
  data() {
    return {
      inited: false,

      tracks: [],
      trackCount: 0,
      currentTrack: null,
      currentTrackIndex: 0,

      masterGain: null,
      preMasterGain: null,
      masterGainKnob: 0.5,

      keyEnabled: [],
      keypressListeners: [],
      numpadListeners: [],
      xyPadListeners: [],

      //MIDI
      midiMappings: [],
      inputs: [],
      outputs: [],
      mapping: false,
      refBeignMapped: null,

      //REC
      recordingCount: 0,
      recordings: [],
      mediaRecorders: [],
      recording: false,
      exportDestination: null,
      exportBlobs: [],
      exports: [],

      //Rendering
      timeOffset: 10,
      renderWaveformLoopFunctions: [],
      recordingBars: [],
      rAFs: [],
      globalX: 0,

      //play
      playing: false,
      playingBuffers: [],
      recordingsAvailable: false,

      octave: 3,
      transpose: 0,

      m_pressed: false,
    };
  },

  computed: {
    ...mapGetters(['context', 'appIsMapping', 'appConnecting']),
  },

  beforeDestroy() {
    this.setContext(null);
    window.removeEventListener('keyup', this.onKeyup);
    window.removeEventListener('keydown', this.onKeydown);
  },

  created() {
    this.addConfirmLeaveHandler();
    this.keyEnabled = Array(222).fill(true);
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(this.onMIDISuccess, this.onMIDIFailure);
    }
  },

  mounted() {
    document.querySelector('.home-wrapper').addEventListener('click', this.init);
  },

  methods: {
    ...mapMutations(['setAppIsMapping', 'setContext']),

    toggleRecEnabled(t) {
      this.tracks[t].recEnabled = !this.tracks[t].recEnabled;
    },

    init() {
      document.querySelector('.home-wrapper').removeEventListener('click', this.init);
      this.setContext(new (window.AudioContext || window.webkitAudioContext)());
      Node.context = this.context;

      this.createMasterGain();

      this.createTrack(createInstrument('Femod'));
      this.createAndInsertEffect('BiquadFilter');
      this.createTrack(createInstrument('Drumkit'));

      window.addEventListener('keyup', this.onKeyup);
      window.addEventListener('keydown', this.onKeydown);

      this.inited = true;
    },

    createInstrument(className) {
      const Node = createInstrument(className);
      this.createTrack(Node);
    },

    createTrack(instrument) {
      const trackGain = new Gain('Track Gain');
      const trackGainAnalyser = this.context.createAnalyser();

      instrument.connect(trackGain);
      trackGain.connectNativeNode(this.preMasterGain, 'Mixer Gain');
      trackGain.connectNativeNode(trackGainAnalyser, 'Analyser');

      this.tracks.push({
        id: ++this.trackCount,
        name: 'Track ' + this.trackCount,
        displayName: 'Track ' + this.trackCount,
        instrument,
        effects: [],
        trackGain,
        trackGainAnalyser,
        recEnabled: true,
        instrumentEnabled: true,
      });

      this.currentTrackIndex = this.tracks.length - 1;
      this.currentTrack = this.tracks[this.currentTrackIndex];

      // Listeners

      if (instrument.nodeType === 'Drumkit') {
        this.numpadListeners.push({
          instrument,
          trackName: this.currentTrack.name,
        });
      } else {
        this.keypressListeners.push({
          instrument,
          trackName: this.currentTrack.name,
        });
        this.xyPadListeners.push({
          instrument,
          trackName: this.currentTrack.name,
        });
      }

      this.$nextTick(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
    },

    deleteTrack(trackIndex) {
      if (trackIndex === undefined) {
        trackIndex = this.currentTrackIndex;
      }

      let track = this.tracks[trackIndex];

      // delete from listeners
      let index = this.keypressListeners.findIndex(listener => listener.trackName === track.name);
      if (index !== -1) this.keypressListeners.splice(index, 1);
      index = this.numpadListeners.findIndex(listener => listener.trackName === track.name);
      if (index !== -1) this.numpadListeners.splice(index, 1);
      index = this.xyPadListeners.findIndex(listener => listener.trackName === track.name);
      if (index !== -1) this.xyPadListeners.splice(index, 1);

      track.instrument.destroy();
      track.instrument = null;

      track.trackGain.disconnectNativeNode(this.preMasterGain);
      track.trackGain.disconnectNativeNode(track.trackGainAnalyser);
      track.trackGain.destroy();
      track.trackGain = null;

      track.effects.forEach(effect => {
        effect.destroy();
        effect = null;
      });
      track = null;

      if (trackIndex === this.currentTrackIndex) {
        this.currentTrackIndex = null;
        this.currentTrack = null;
      }

      this.tracks.splice(trackIndex, 1);

      let futureTrackIndex = trackIndex;
      if (futureTrackIndex > this.tracks.length - 1) {
        futureTrackIndex--;
        if (futureTrackIndex >= 0) {
          this.selectTrack(futureTrackIndex);
        }
      } else {
        this.selectTrack(futureTrackIndex);
      }
    },

    // Effects:
    createAndInsertEffect(className) {
      const Node = createEffect(className);
      this.insertEffect(Node);
    },

    insertEffect(Node) {
      const effects = this.currentTrack.effects;
      const prev = effects[effects.length - 1] || this.currentTrack.instrument;
      const next = this.currentTrack.trackGain;

      prev.disconnect().connect(Node).connect(next);
      effects.push(Node);
      this.$nextTick(() => {
        const trackInnerClass = '.track-detail_' + this.currentTrackIndex;
        const trackInner = document.querySelector(trackInnerClass);
        if (trackInner) {
          trackInner.scrollTo(trackInner.offsetWidth, 0);
        }
      });
    },

    deleteEffect(effectIndex) {
      const effects = this.currentTrack.effects;

      const prev = effects[effectIndex - 1] || this.currentTrack.instrument;
      const next = effects[effectIndex + 1] || this.currentTrack.trackGain;

      prev.disconnect().connect(next);

      effects[effectIndex].destroy();
      effects[effectIndex] = null;
      effects.splice(effectIndex, 1);
    },

    createMasterGain() {
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.masterGainKnob;

      this.preMasterGain = this.context.createGain();
      this.preMasterGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
    },

    setMasterGainValue(val) {
      this.masterGain.gain.setValueAtTime(val, 0);
    },

    selectTrack(t) {
      if (this.currentTrackIndex === t) return;

      this.currentTrackIndex = t;
      this.currentTrack = null;
      this.$nextTick(() => {
        this.currentTrack = this.tracks[this.currentTrackIndex];
      });
    },

    // User Interface (UI):

    toggleInstrumentEnabled() {
      this.currentTrack.instrumentEnabled = !this.currentTrack.instrumentEnabled;

      if (this.currentTrack.instrumentEnabled) {
        this.keypressListeners.push({
          instrument: this.currentTrack.instrument,
          trackName: this.currentTrack.name,
        });
        if (this.currentTrack.instrument.name === 'Mic') this.currentTrack.instrument.setMute(false);
      } else {
        const i = this.keypressListeners.findIndex(kpl => kpl.trackName === this.currentTrack.name);
        this.keypressListeners.splice(i, 1);
        if (this.currentTrack.instrument.name === 'Mic') this.currentTrack.instrument.setMute(true);
      }
    },

    // Touch
    onPadTouchStart(currentIndex) {
      const noteKeyIndex = currentIndex;
      let noteIndex = noteKeyIndex + 12 * this.octave + this.transpose;
      this.xyPadListeners.forEach(scaleInterface => {
        scaleInterface.instrument.playNote(noteIndex);
      });
    },

    onPadTouchEnd(currentIndex) {
      const noteKeyIndex = currentIndex;
      let noteIndex = noteKeyIndex + 12 * this.octave + this.transpose;
      this.xyPadListeners.forEach(scaleInterface => {
        scaleInterface.instrument.stopNote(noteIndex);
      });
    },

    onPadTouchCancel(e) {},
    onPadTouchMove(e) {},

    // Keyboard
    onKeydown(e) {
      if (!this.keyEnabled[e.keyCode]) return;
      this.keyEnabled[e.keyCode] = false;

      const noteKeyIndex = noteKeys.findIndex(noteKey => e.key === noteKey);

      if (noteKeyIndex !== -1) {
        let noteIndex = noteKeyIndex + 12 * this.octave + this.transpose;
        if (noteIndex < 0) noteIndex = 0;
        if (noteIndex > totalAmountOfNotes - 1) noteIndex = totalAmountOfNotes - 1;

        this.keypressListeners.forEach(scaleInterface => {
          scaleInterface.instrument.playNote(noteIndex);
        });
      } else {
        this.onOtherKeydown(e);
      }
    },

    onKeyup(e) {
      this.keyEnabled[e.keyCode] = true;
      const noteKeyIndex = noteKeys.findIndex(noteKey => e.key === noteKey);

      if (noteKeyIndex !== -1) {
        let noteIndex = noteKeyIndex + 12 * this.octave + this.transpose;

        this.keypressListeners.forEach(scaleInterface => {
          scaleInterface.instrument.stopNote(noteIndex);
        });
      } else {
        this.onOtherKeyup(e);
      }
    },

    onOtherKeydown({ key, keyCode }) {
      console.log(keyCode);
      if (keyCode === 77) {
        // m key
        this.m_pressed = true;
      } else if (keyCode === 32) {
        // space bar
        if (this.recording) {
          this.stopRec();
        } else {
          this.startRec();
        }
      } else if (keyCode === 38) {
        // up arrow
        let futureTrackIndex = this.currentTrackIndex - 1;
        if (futureTrackIndex < 0) {
          futureTrackIndex = this.tracks.length - 1;
        }

        if (this.currentTrackIndex !== futureTrackIndex) {
          this.selectTrack(futureTrackIndex);
        }
      } else if (keyCode === 40) {
        // down  arrow
        let futureTrackIndex = this.currentTrackIndex + 1;
        if (futureTrackIndex > this.tracks.length - 1) {
          futureTrackIndex = 0;
        }
        if (this.currentTrackIndex !== futureTrackIndex) {
          this.selectTrack(futureTrackIndex);
        }
      } else if (keyCode === 46) {
        // delete key
        this.deleteTrack(this.currentTrackIndex);
      }
      //1 a 9 numpad:
      else if (keyCode >= 97 && keyCode <= 105) {
        this.numpadListeners.forEach(scaleInterface => {
          scaleInterface.instrument.playNote(parseInt(key));
        });
      }
    },

    onOtherKeyup(e) {
      //1 a 9
      if (e.keyCode >= 49 && e.keyCode <= 57) {
        if (this.m_pressed) {
          this.tracks[+e.key - 1].trackGain.toggleMute();
        }
      } else {
        switch (e.keyCode) {
          case 77: //m
            this.m_pressed = false;
            if (e.ctrlKey) {
              this.currentTrack.trackGain.toggleMute();
            }
            break;
          case 81: //q
            if (e.ctrlKey) {
              this.deleteTrack(this.currentTrackIndex);
            }
            break;
          case 90: //z
            this.octave--;
            break;
          case 88: //x
            this.octave++;
            break;
          case 67: //c
            this.transpose--;
            break;
          case 86: //v
            this.transpose++;
            break;
        }
      }
    },

    // MIDI

    triggerNoteOn(note, channel) {
      this.keypressListeners.forEach(scaleInterface => {
        scaleInterface.instrument.playNote(note);
      });
    },

    triggerNoteOff(note, channel) {
      this.keypressListeners.forEach(scaleInterface => {
        scaleInterface.instrument.stopNote(note);
      });
    },

    toggleMapping() {
      if (this.refBeignMapped) {
        this.refBeignMapped.stopMapping();
        this.refBeignMapped = null;
      }
      this.mapping = !this.mapping;
      this.setAppIsMapping(this.mapping);
    },

    knobClicked(knobRef) {
      if (!this.mapping) return;
      if (this.refBeignMapped) {
        this.refBeignMapped.stopMapping();
        this.refBeignMapped = null;
      }
      this.refBeignMapped = knobRef;
      knobRef.startMapping();
    },

    onMIDIMessage(event) {
      let data = event.data;

      const status = data[0];
      const note = data[1];
      const value = data[2];

      if (this.mapping) {
        let refName = this.refBeignMapped.$vnode.data.ref;
        const existingMap = this.midiMappings.find(m => m.refName === refName);
        if (!existingMap) {
          this.midiMappings.push({
            ref: this.refBeignMapped,
            refName,
            cmd: status,
            note,
          });
        } else {
          existingMap.cmd = status;
          existingMap.note = note;
        }
        const knob = this.refBeignMapped;
        knob.assignMap(status, note);
      } else {
        const binary = status.toString(2);
        const command = binary.substr(0, 4);
        const channel = parseInt(binary.substr(4, 4), 2) + 1;

        //note on / note off / sustain pedal
        if (command === '1001') this.triggerNoteOn(note, channel);
        else if (command === '1000') this.triggerNoteOff(note, channel);
        // else if (command === "1011")
        //   console.log("sustain pedal pressed", value);
        else {
          //turn knob
          const mappedItem = this.midiMappings.find(m => m.cmd === status && m.note === note);
          if (!mappedItem) return;
          const knob = mappedItem.ref;
          knob.receiveMidi(value);
        }
      }
    },

    onMIDISuccess(midiAccess) {
      this.inputs = midiAccess.inputs;
      this.outputs = midiAccess.outputs;

      for (var input of this.inputs.values()) {
        input.onmidimessage = this.onMIDIMessage;
      }
    },

    onMIDIFailure() {
      console.log('Could not access your MIDI devices.');
    },

    // Load / Save

    loadSave(tracks) {
      tracks.forEach(track => {
        this.loadInstrument(t.instrument);

        track.effects.forEach(effectSaveString => {
          this.loadEffect(effectSaveString);
        });
      });
    },

    loadPreset(saveString) {
      if (saveString.nodeRol === 'Instrument') {
        this.loadInstrument(saveString);
      } else {
        this.loadEffect(saveString);
      }
    },

    loadInstrument(instSaveString) {
      const instrument = createInstrument(instSaveString.nodeType, instSaveString);
      this.createTrack(instrument);
    },

    loadEffect(effectSaveString) {
      const effect = createEffect(effectSaveString.nodeType, effectSaveString);
      this.insertEffect(effect);
    },

    // RECORDING

    startRec() {
      this.recordingCount++;
      this.recording = true;
      this.startExportRec();
      this.startTracksRec();
    },

    startExportRec() {
      let exportChunks = [];
      this.exportDestination = this.context.createMediaStreamDestination();
      this.masterGain.connect(this.exportDestination);

      this.exportMediaRecorder = new MediaRecorder(this.exportDestination.stream);

      this.exportMediaRecorder.ondataavailable = evt => {
        exportChunks.push(evt.data);
      };

      this.exportMediaRecorder.onstop = () => {
        const blob = new Blob(exportChunks, {
          type: 'audio/ogg; codecs=opus',
        });

        this.exportBlobs.push(blob);
        exportChunks = null;

        const exportFileReader = new FileReader();

        exportFileReader.onloadend = () => {
          const arrayBuffer = exportFileReader.result;

          this.context.decodeAudioData(arrayBuffer, audioBuffer => {
            this.exports.push({ id: this.recordingCount, audioBuffer });
          });
        };

        exportFileReader.readAsArrayBuffer(blob);
      };

      this.exportMediaRecorder.start();
    },

    startTracksRec() {
      const scenes = [];
      const recordingTracks = this.tracks.filter(t => t.recEnabled);
      const totalRecordingTracks = recordingTracks.length;
      let processedTracks = 0;

      recordingTracks.forEach(track => {
        this.setupWaveformRender(track);

        let chunks = [];
        let mediaStreamDestination = this.context.createMediaStreamDestination();
        track.trackGain.connectNativeNode(mediaStreamDestination);

        const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
        this.mediaRecorders.push(mediaRecorder);

        mediaRecorder.ondataavailable = event => {
          chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
          chunks = null;

          const fileReader = new FileReader();

          fileReader.onloadend = () => {
            const arrayBuffer = fileReader.result;

            this.context.decodeAudioData(arrayBuffer, audioBuffer => {
              scenes.push({ audioBuffer, blob, trackId: track.id });
              mediaStreamDestination = null;
              if (++processedTracks === totalRecordingTracks) {
                this.recordingsReady(scenes);
              }
            });
          };

          fileReader.readAsArrayBuffer(blob);
        };

        mediaRecorder.start();
      });
    },

    stopRec() {
      this.masterGain.disconnect(this.exportDestination);
      this.exportDestination = null;
      this.exportMediaRecorder.stop();
      this.exportMediaRecorder = null;
      this.mediaRecorders.forEach(mediaRecorder => {
        mediaRecorder.stop();
      });
      this.mediaRecorders = [];
      this.recording = false;

      // Cancel animation frames and remove rendering functions
      this.rAFs.forEach(rAF => {
        window.cancelAnimationFrame(rAF);
      });
      this.rAFs = [];
      for (let i = 0; i < this.renderWaveformLoopFunctions.length; i++) {
        delete this[this.renderWaveformLoopFunctions[i]];
      }
      this.renderWaveformLoopFunctions = [];

      console.log(this.recordingBars[0].bars);
    },

    recordingsReady(scenes) {
      const name = prompt('Recording Name', 'Recording Nº ' + this.recordingCount);
      this.recordings.push({
        id: this.recordingCount,
        name,
        scenes,
      });
      this.recordingsAvailable = true;
    },

    playRecording() {
      let index = prompt(
        'Which recording do you want to play? Choose number: 1 to ' + this.recordings.length,
        1
      );
      index = parseInt(index);

      if (!index) return alert('Only numers from 1 to ' + this.recordings.length);
      if (index > this.recordings.length || index < 1) return alert('There is no such recording!');

      index--;

      this.playAllTracks(index);
    },

    playAllTracks(index) {
      this.recordings[index].scenes.forEach(scene => {
        const source = this.context.createBufferSource();
        source.buffer = scene.audioBuffer;
        source.connect(this.masterGain);
        source.start();
        console.log('trackId: ' + scene.trackId + ' - download URL: ' + URL.createObjectURL(scene.blob));
      });
    },

    stopPlayingExport() {
      this.exportSource.stop(0);
      this.playing = false;
    },

    downloadExport() {
      const length = this.recordings.length;
      let index = prompt('Which recording do you want to download? Choose number: 1 to ' + length, 1);
      index = parseInt(index);
      if (!index) return alert('Only numers from 1 to ' + length);
      if (index > length || index < 1) return alert('There is no such recording!');
      let fileName = 'websynth_export_' + index + ' - ' + new Date().toLocaleDateString('es-AR');
      fileName = prompt('Export name: ', fileName);
      if (!fileName) return;
      index--;
      this.downloadBlob(this.exportBlobs[index], fileName);
    },

    downloadBlob(blob, fileName) {
      const a = document.createElement('a');
      a.setAttribute('href', URL.createObjectURL(blob));
      a.setAttribute('download', fileName);
      a.click();
    },

    moveCanvas(e) {
      if (e.wheelDelta > 0) {
        this.globalX -= 10;
      } else {
        this.globalX += 10;
      }

      console.log(this.globalX);

      this.recordingBars.forEach(recordingBar => {
        const canvas = this.$refs[`rec-canvas-${recordingBar.trackId}`][0];
        const ctx = canvas.getContext('2d');
        const bars = recordingBar.bars;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < bars.length; i++) {
          const bar = bars[i + this.globalX] || { y: canvas.height / 2, width: 1, height: 0 };
          ctx.fillRect(i, bar.y, bar.width, bar.height);
        }
      });
    },

    setupWaveformRender(track) {
      const analyser = track.trackGainAnalyser;
      const canvas = this.$refs[`rec-canvas-${track.id}`][0];
      const recordingBarsObject = {
        trackId: track.id,
        bars: [],
      };
      this.recordingBars.push(recordingBarsObject);

      const dataObj = {
        trackId: track.id,
        analyser,
        frequencyArray: new Float32Array(analyser.fftSize),
        canvas,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        ctx: canvas.getContext('2d'),
        now: parseInt(performance.now()) / this.timeOffset,
        bars: recordingBarsObject.bars,
      };

      // function renderWaveformLoop()
      this[`renderWaveformLoop${track.id}`] = dataObj => {
        let { analyser, canvasWidth, canvasHeight, ctx, frequencyArray, bars, now, trackId } = dataObj;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        if (parseInt(performance.now() / this.timeOffset) > now) {
          now = parseInt(performance.now() / this.timeOffset);
          analyser.getFloatTimeDomainData(frequencyArray);

          let sumOfSquares = 0;
          for (let i = 0; i < frequencyArray.length; i++) {
            sumOfSquares += frequencyArray[i] ** 2;
          }
          const avgPower = sumOfSquares / frequencyArray.length;
          const freq = avgPower.map(0, 1, 2, canvasHeight);

          bars.push({
            x: canvasWidth,
            y: canvasHeight / 2 - freq / 2,
            height: freq,
            width: 1,
          });
        }

        this.renderWaveformDraw(ctx, bars);

        this.rAFs[track.id] = requestAnimationFrame(
          this[`renderWaveformLoop${track.id}`].bind(null, dataObj)
        );
      };

      this.renderWaveformLoopFunctions.push(`renderWaveformLoop${track.id}`);

      this[`renderWaveformLoop${track.id}`](dataObj);
    },

    renderWaveformDraw(ctx, bars) {
      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i];
        ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
        bar.x = bar.x - 1;
      }
    },

    addConfirmLeaveHandler() {
      window.onbeforeunload = function (e) {
        // remove if statement to enable
        if (1 == 2) {
          e = e || window.event;
          if (e) e.returnValue = 'Sure?';
          return 'Sure?';
        }
      };
    },
  },
};
</script>

<style lang="scss">
.home-wrapper {
  height: 100vh;
  background: transparent;
}
.home-inner {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-section {
  z-index: 1;
}

// Mid section

.mid-section {
  height: var(--mid-section-height);
  display: flex;
  gap: 0.25rem;
  // .left-col {  }
  .right-col {
    background: black;
    flex: 1;
  }
}

.click-wrapper {
  margin: 0.25rem;
}

.tracks-container {
  height: calc(
    100vh - var(--top-section-height) - var(--click-wrapper-height) - var(--bottom-section-height)
  );
  overflow-y: auto;
  border: 2px solid transparent;
  padding-top: 0.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.tracks-container.mapping {
  border-color: var(--color-1);
}

.track {
  display: flex;
  align-items: center;
  justify-content: space-between;

  background: #111;
  border: 2px solid transparent;
  margin: 0 auto 0.5em;
}
.track:last-child {
  margin: 0;
}
.track.selected {
  background: #333;
  border: 2px solid #ff857c;
}
.track-inner-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  width: 180px;
  overflow: auto;
  white-space: nowrap;
  padding-right: 2rem;
}

.rec-canvas {
  background: white;
  flex: 1;
  height: 60px;
  margin-left: 0.5rem;
}

canvas {
  height: 100%;
  width: 100%;
}

.master {
  padding: 0.75rem 0.5rem;
}
.master-knob-wrapper {
  margin-right: 1rem;
}

// Bottom Section
.bottom-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.25rem 0;
  background: transparent;
  .current-track-empty-state {
    font-size: 1.75rem;
  }
}
.track-detail {
  flex: 1;
  display: flex;
  gap: 1em;
  overflow-x: auto;
  overflow-y: hidden;
  padding-right: 10rem;
  height: 380px;
}

.node {
  height: 100%;
}

.track-instrument .container {
  height: 100%;
}

.track-effects {
  display: flex;
  gap: 0.5em;
}

.welcome-msg {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
}
</style>
