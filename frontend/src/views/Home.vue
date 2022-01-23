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
          @stopPlayingExport="stopPlaybackAllTracks"
          @loadSave="loadSave"
          @toggleMapping="toggleMapping"
          :octave="octave"
          :transpose="transpose"
          :tracks="tracks"
          :playing="playing"
          :recording="recording"
          :recordingsAvailable="recordings.length"
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
            @mousewheel="onTrackContainerWheel"
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
                  <canvas :ref="`rec-canvas-${track.id}`" height="64"></canvas>
                </div>

                <!-- Track Gain and Controls -->
                <GainBody
                  :Node="track.trackGain"
                  :analyser="track.trackGainAnalyser"
                  :recEnabled="track.recEnabled"
                  :selected="currentTrackIndex === t"
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

const timelineProps = {
  recBarWidth: 1,
  timeOffset: 10,
  backgroundClipColor: '#e59797',
  carretMovementAmount: 50,
  height: 64,
};

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
      trackIdCount: 0,
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
      midiInputs: [],
      midiOutputs: [],
      mapping: false,
      refBeignMapped: null,

      //REC
      recording: false,
      recordings: [],
      recordingIdCount: 0,
      currentRecIndex: 0,
      mediaRecorders: [],
      exportDestination: null,
      exports: [],

      //Rendering

      globalX: 0,
      globalCanvasWidth: 0,
      renderWaveformLoopFunctions: [],
      recordingBars: [],
      recordingAnimationFrameRequest: null,
      playbackAnimationFrameRequest: null,

      //play
      playing: false,
      playingBuffers: [],

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

      this.createTrack(createInstrument('Drumkit'));
      this.createTrack(createInstrument('Femod'));
      this.createAndInsertEffect('BiquadFilter');

      window.addEventListener('keyup', this.onKeyup);
      window.addEventListener('keydown', this.onKeydown);

      this.inited = true;
    },

    // Tracks, Instruments & Effects

    createInstrument(className) {
      const Node = createInstrument(className);
      this.createTrack(Node);
    },

    createTrack(instrument) {
      const trackGain = new Gain('Track Gain');
      const trackGainAnalyser = this.context.createAnalyser();

      instrument.connect(trackGain);
      trackGain.connectNativeNode(trackGainAnalyser, 'Analyser');
      trackGain.connectNativeNode(this.preMasterGain, 'Mixer Gain');

      this.tracks.push({
        id: ++this.trackIdCount,
        name: 'Track ' + this.trackIdCount,
        displayName: 'Track ' + this.trackIdCount,
        instrument,
        effects: [],
        trackGain,
        trackGainAnalyser,
        recEnabled: true,
        instrumentEnabled: true,
      });

      this.currentTrackIndex = this.tracks.length - 1;
      this.currentTrack = this.tracks[this.currentTrackIndex];

      // key/touch listeners
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

      // this.$nextTick(() => { // todo: scroll to bottom of container });
    },

    deleteTrack(trackIndex) {
      if (typeof trackIndex !== 'number') {
        return;
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

      track.trackGainAnalyser = null;

      track.effects.forEach(effect => {
        effect.destroy();
        effect = null;
      });

      this.currentTrackIndex = null;
      this.currentTrack = null;

      track = null;
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

    selectTrack(t) {
      if (this.currentTrackIndex === t) return;

      this.currentTrackIndex = t;
      this.currentTrack = null;
      this.$nextTick(() => {
        this.currentTrack = this.tracks[this.currentTrackIndex];
      });
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

    // CONTROLS

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
    onOtherKeydown(e) {
      if (e.keyCode >= 97 && e.keyCode <= 105) {
        //1-9:
        this.numpadListeners.forEach(scaleInterface => {
          scaleInterface.instrument.playNote(+e.key);
        });
      } else {
        switch (e.keyCode) {
          case 38: //arrow   up - select track
            var futureTrackIndex = this.currentTrackIndex - 1;
            if (futureTrackIndex < 0) {
              futureTrackIndex = this.tracks.length - 1;
            }
            this.selectTrack(futureTrackIndex);
            break;
          case 40: //arrow down - select track
            var futureTrackIndex = this.currentTrackIndex + 1;
            if (futureTrackIndex > this.tracks.length - 1) {
              futureTrackIndex = 0;
            }
            this.selectTrack(futureTrackIndex);
            break;
          case 77: //m
            this.m_pressed = true;
            break;
        }
      }
    },
    onOtherKeyup(e) {
      //1-9
      if (e.keyCode >= 49 && e.keyCode <= 57) {
        if (this.m_pressed) {
          this.tracks[+e.key - 1].trackGain.toggleMute();
        }
      } else {
        switch (e.keyCode) {
          case 32: //space bar - rec/stop
            if (this.recording) this.stopRec();
            else this.startRec();
            break;

          case 46: //delete - delete cuurrent track
            this.deleteTrack(this.currentTrackIndex);
            break;
          case 77: //m - mute current track
            this.m_pressed = false;
            if (e.ctrlKey) this.currentTrack.trackGain.toggleMute();
            break;
          case 90: //z - octave down
            this.octave--;
            break;
          case 88: //x - octave up
            this.octave++;
            break;
          case 67: //c - transpose down
            this.transpose--;
            break;
          case 86: //v - transpose up
            this.transpose++;
            break;
          default:
            // console.llllog(e.keyCode);
            break;
        }
      }
    },

    // RECORDING

    startRec() {
      this.recordingIdCount++;
      this.recording = true;
      this.startRecExport();
      this.startRecAllTracks();
    },
    startRecAllTracks() {
      this.currentRecIndex = this.recordings.length;

      const recordingObject = {
        id: this.recordingIdCount,
        trackClips: [],
      };

      this.recordings.push(recordingObject);

      const recordingTracks = this.tracks.filter(track => track.recEnabled);
      const tracksTotal = recordingTracks.length;
      let tracksProcessed = 0;
      recordingTracks.forEach(track => {
        let chunks = [];
        let mediaStreamDestination = this.context.createMediaStreamDestination();
        track.trackGain.connectNativeNode(mediaStreamDestination);
        const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
        this.mediaRecorders.push(mediaRecorder);

        mediaRecorder.ondataavailable = ({ data }) => chunks.push(data);

        // When recording's finished, process the data chunk
        // into a Blob, and save it for future use
        mediaRecorder.onstop = () => {
          const blobFileReader = new FileReader();
          const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });

          blobFileReader.onloadend = () => {
            const arrayBuffer = blobFileReader.result;
            this.context.decodeAudioData(arrayBuffer, audioBuffer => {
              recordingObject.trackClips.push({ trackId: track.id, audioBuffer, blob, waveformBarCount: 0 });
              tracksProcessed++;
              if (tracksProcessed >= tracksTotal) {
                this.onRecordingFinished();
              }
            });
          };

          blobFileReader.readAsArrayBuffer(blob);
          mediaStreamDestination = null;
          chunks = null;
        };

        mediaRecorder.start();
      });
      this.setupWaveformRender(recordingTracks);
    },
    startRecExport() {
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
        const exportFileReader = new FileReader();
        exportFileReader.onloadend = () => {
          const arrayBuffer = exportFileReader.result;

          this.context.decodeAudioData(arrayBuffer, audioBuffer => {
            this.exports.push({ id: this.recordingIdCount, audioBuffer, blob });
          });
        };
        exportFileReader.readAsArrayBuffer(blob);
        exportChunks = null;
      };
      this.exportMediaRecorder.start();
    },

    stopRec() {
      this.stopRecAllTracks();
      this.stopRecExport();
      this.recording = false;
    },
    stopRecAllTracks() {
      this.mediaRecorders.forEach(mediaRecorder => {
        mediaRecorder.stop();
      });
      this.mediaRecorders = [];

      // Cancel animation frames and remove rendering functions
      window.cancelAnimationFrame(this.recordingAnimationFrameRequest);
      this.recordingAnimationFrameRequest = null;

      for (let i = 0; i < this.renderWaveformLoopFunctions.length; i++) {
        delete this[this.renderWaveformLoopFunctions[i]];
      }
      this.renderWaveformLoopFunctions = [];
    },
    onRecordingFinished() {
      const currentRecording = this.recordings[this.currentRecIndex];
      const duration = currentRecording.trackClips[0].audioBuffer.duration;
      const recordingBarCount = this.recordingBars[this.currentRecIndex].tracksBars[0].bars.length;
      currentRecording.duration = duration;
      currentRecording.recordingBarCount = recordingBarCount;
      currentRecording.barTimeSpan = duration / recordingBarCount;
      currentRecording.startingBar = this.recordings[this.currentRecIndex - 1]
        ? this.recordings[this.currentRecIndex - 1].recordingBarCount + 1
        : 0;
    },
    stopRecExport() {
      this.masterGain.disconnect(this.exportDestination);
      this.exportDestination = null;
      this.exportMediaRecorder.stop();
      this.exportMediaRecorder = null;
    },

    // PLAYBACK

    playRecording() {
      let index = prompt(
        'Which recording do you want to play? Choose number: 1 to ' + this.recordings.length,
        1
      );
      index = parseInt(index);
      if (!index) return alert('Only numers from 1 to ' + this.recordings.length);
      if (index > this.recordings.length || index < 1) return alert('There is no such recording!');
      index--;
      this.currentRecIndex = index;

      this.playAllTracks();
    },

    playAllTracks() {
      const offset = this.recordings[this.currentRecIndex].barTimeSpan * this.globalX;
      if (offset < 0) {
        return;
      }

      this.playing = true;
      this.recordings[this.currentRecIndex].trackClips.forEach(trackClip => {
        trackClip.source = this.context.createBufferSource();
        trackClip.source.buffer = trackClip.audioBuffer;
        trackClip.source.connect(this.masterGain);

        trackClip.source.start(0, offset);

        trackClip.source.onended = () => {
          this.playing = false;
          window.cancelAnimationFrame(this.playbackAnimationFrameRequest);
        };
      });
      this.moveTimielineWithPlayback(performance.now() / timelineProps.timeOffset);
    },

    stopPlaybackAllTracks() {
      this.recordings[this.currentRecIndex].trackClips.forEach(trackClip => {
        trackClip.source.stop(0);
        delete trackClip.source;
      });
      window.cancelAnimationFrame(this.playbackAnimationFrameRequest);
      this.playing = false;
    },

    // RENDERING

    setupWaveformRender(tracks) {
      this.recordingBars.push({ recordingId: 1, tracksBars: [] });
      const dataObject = { barsAdded: 0, renderDataObjects: [] };

      tracks.forEach(track => {
        const analyser = track.trackGainAnalyser;
        const canvasContainer = document.querySelector('.rec-canvas');
        const canvas = this.$refs[`rec-canvas-${track.id}`][0];
        canvas.width = canvasContainer.offsetWidth;

        this.globalCanvasWidth = canvas.width; // todo: ver otra manera de obtener este dato

        const recordingBarsObject = {
          trackId: track.id,
          bars: [],
        };
        this.recordingBars[this.currentRecIndex].tracksBars.push(recordingBarsObject);

        const dataObj = {
          trackId: track.id,
          analyser,
          frequencyArray: new Float32Array(analyser.fftSize),
          canvas,
          now: performance.now() / timelineProps.timeOffset,
          bars: recordingBarsObject.bars,
        };

        dataObject.renderDataObjects.push(dataObj);
      });
      this.renderWaveformLoop(dataObject, performance.now() / timelineProps.timeOffset);
    },

    renderWaveformLoop(dataObject, now) {
      if (performance.now() / timelineProps.timeOffset > now) {
        dataObject.renderDataObjects.forEach(renderDataObject => {
          let { analyser, frequencyArray, bars } = renderDataObject;

          now = performance.now() / timelineProps.timeOffset;
          analyser.getFloatTimeDomainData(frequencyArray);

          let sumOfSquares = 0;
          for (let i = 0; i < frequencyArray.length; i++) {
            sumOfSquares += frequencyArray[i] ** 2;
          }
          const avgPower = sumOfSquares / frequencyArray.length;
          const barHeight = avgPower.map(0, 1, 2, timelineProps.height);

          bars.push({ height: barHeight });
        });

        // Move Carret
        dataObject.barsAdded++;
        if (dataObject.barsAdded >= this.globalCanvasWidth) {
          this.moveCanvas(timelineProps.carretMovementAmount);
          dataObject.barsAdded -= timelineProps.carretMovementAmount;
        }
      }
      this.moveCanvas(0);

      this.recordingAnimationFrameRequest = requestAnimationFrame(
        this.renderWaveformLoop.bind(null, dataObject, now)
      );
    },

    moveCanvas(amount) {
      if (this.globalX + amount >= 0) {
        this.globalX += amount;
      }

      this.recordingBars[this.currentRecIndex].tracksBars.forEach(trackBars => {
        const canvas = this.$refs[`rec-canvas-${trackBars.trackId}`][0];
        const ctx = canvas.getContext('2d');
        const bars = trackBars.bars;
        ctx.clearRect(0, 0, canvas.width, timelineProps.height);
        for (let x = 0; x < bars.length - this.globalX; x++) {
          const bar = bars[x + this.globalX];
          if (bar) {
            ctx.fillStyle = timelineProps.backgroundClipColor;
            ctx.fillRect(x * timelineProps.recBarWidth, 0, timelineProps.recBarWidth, timelineProps.height);
            ctx.fillStyle = '#000';
            ctx.fillRect(
              x * timelineProps.recBarWidth,
              timelineProps.height / 2 - bar.height / 2,
              timelineProps.recBarWidth,
              bar.height
            );
          }
        }
      });
    },

    onTrackContainerWheel(event) {
      let amount = 10;
      let delta = 1;
      if (event.wheelDelta > 0) {
        delta = -1;
      }
      if (event.shiftKey) {
        amount = 0;
        timelineProps.recBarWidth += 1 * delta;
        if (timelineProps.recBarWidth < 1) {
          timelineProps.recBarWidth = 1;
        } else if (timelineProps.recBarWidth > 3) {
          timelineProps.recBarWidth = 3;
        }
      }

      this.moveCanvas(amount * delta);
    },

    moveTimielineWithPlayback(now) {
      if (performance.now() / timelineProps.timeOffset > now) {
        now = performance.now() / timelineProps.timeOffset;
        this.moveCanvas(1);
      }

      this.playbackAnimationFrameRequest = requestAnimationFrame(
        this.moveTimielineWithPlayback.bind(null, now)
      );
    },

    // SAVE/LOAD

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

    // EXPORT

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
      this.downloadBlob(this.exports[index].blob, fileName);
    },

    downloadBlob(blob, fileName) {
      const a = document.createElement('a');
      a.setAttribute('href', URL.createObjectURL(blob));
      a.setAttribute('download', fileName);
      a.click();
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

      // todo: dynamically point to the propper function insted of this if statement
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

        if (command === '1001') {
          // note on
          this.triggerNoteOn(note, channel);
        } else if (command === '1000') {
          // note off
          this.triggerNoteOff(note, channel);
        } else if (command === '1011') {
          // sustain pedal
        } else {
          // knob
          const mappedItem = this.midiMappings.find(m => m.cmd === status && m.note === note);
          if (!mappedItem) return;
          const knob = mappedItem.ref;
          knob.receiveMidi(value);
        }
      }
    },

    onMIDISuccess(midiAccess) {
      this.midiInputs = midiAccess.inputs;
      this.midiOutputs = midiAccess.outputs;

      for (var input of this.midiInputs.values()) {
        input.onmidimessage = this.onMIDIMessage;
      }
    },

    onMIDIFailure() {},

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
  margin-bottom: 1px;
}
.track.selected {
  background: #333;
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
  height: 64px;
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
