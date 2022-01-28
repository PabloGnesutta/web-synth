<template>
  <div class="home-wrapper">
    <div v-if="inited" class="home-inner">
      <!-- Top Section -->
      <div class="top-section">
        <Header
          :ref="'header'"
          @onRec="onRec"
          @onPlay="onPlay"
          @onStop="onStopBtn"
          @loadSave="loadSave"
          @downloadExport="downloadExport"
          @toggleMapping="toggleMapping"
          @toggleFollowing="toggleFollowing"
          :octave="octave"
          :transpose="transpose"
          :tracks="tracks"
          :playing="playing"
          :recording="recording"
          :following="followCursor"
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
                <div
                  class="track-inner-left no-scrollbar"
                  :style="{
                    width: trackProps.innerLefttWidth + 'px',
                    marginRight: trackProps.innerLefttMargin + 'px',
                  }"
                >
                  <div @click="deleteTrack(t)" class="pointer">[X]</div>
                  <div class="select-none" @click="selectTrack(t)">{{ track.name }}</div>
                  <div class="select-none" @click="selectTrack(t)">
                    {{ track.instrument.name }}
                  </div>
                </div>

                <!-- Rec Canvas -->
                <div
                  class="rec-canvas-container"
                  :ref="`rec-canvas-container-${track.id}`"
                  @click="onCanvasClick($event, track.id)"
                >
                  <canvas :ref="`rec-canvas-${track.id}`" :height="timeline.height"></canvas>
                </div>

                <!-- Track Gain and Controls -->
                <GainBody
                  :Node="track.trackGain"
                  :analyser="track.trackGainAnalyser"
                  :recEnabled="track.recEnabled"
                  :selected="currentTrackIndex === t"
                  :width="trackProps.gainBodyWidth"
                  @toggleRecEnabled="toggleRecEnabled(track)"
                  @knobClicked="knobClicked"
                />
              </div>

              <div class="canvas-overlay">
                <canvas ref="canvas-overlay" :width="timeline.width"></canvas>
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
      recordingTracks: [],
      tracksProcessed: 0,

      // define tracClips
      trackClips: {
        /*
        trackId0: [
          {
            clipId: int,
            blob,
            buffer,
            bars,
            duration,
            barCount,
            barDuration,
            xPos,
            playing: bool,
            source: audioBufferSource (temporary)
          },
          {
            clipId: int,
            (...)
          }
        ],
        trackId1: [...]
        
      */
      },

      //Rendering
      followCursor: false,
      timeline: {
        barWidth: 1,
        timeOffset: 10,
        bgColor: '#e5979750',
        selectedColor: '#1a7cc150',
        carretMovementAmount: 50,
        height: 64,
        width: undefined,
      },
      trackProps: {
        width: undefined,
        gainBodyWidth: 247,
        innerLefttWidth: 180,
        innerLefttMargin: 8,
      },
      globalX: 0,
      cursorX: 0,
      whenPlayCursorX: 0,
      recordingRaf: null,
      playbackRaf: null,

      //play
      playing: false,

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
    window.removeEventListener('resize', this.reflow);
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

    toggleRecEnabled(track) {
      track.recEnabled = !track.recEnabled;
      if (this.recording && track.recEnabled) {
        this.recordingTracks.push(track);
        this.startRecSingleTrack(track);
        this.renderDataObjects.push(this.generateRenderDataObject(track));
      }
    },

    init() {
      document.querySelector('.home-wrapper').removeEventListener('click', this.init);
      this.setContext(new (window.AudioContext || window.webkitAudioContext)());
      Node.context = this.context;

      this.createMasterGain();

      this.inited = true;

      this.$nextTick(() => {
        const canvasOverlayContainer = document.querySelector('.canvas-overlay');
        canvasOverlayContainer.style.left =
          this.trackProps.innerLefttWidth + this.trackProps.innerLefttMargin + 'px';

        this.canvasOverlay = this.$refs['canvas-overlay'];
        this.canvasOverlayCtx = this.canvasOverlay.getContext('2d');
        this.computeTimelineWidth();

        this.createTrack(createInstrument('Drumkit'));
        this.createTrack(createInstrument('Femod'));
        this.createAndInsertEffect('BiquadFilter');
      });

      window.addEventListener('keyup', this.onKeyup);
      window.addEventListener('keydown', this.onKeydown);
      window.addEventListener('resize', this.reflow);
    },

    computeTimelineWidth() {
      const trackList = document.querySelector('.track-list');
      this.timeline.width =
        trackList.offsetWidth -
        (this.trackProps.innerLefttWidth + this.trackProps.innerLefttMargin + this.trackProps.gainBodyWidth);

      this.timeline.carretSkip = ~~(this.timeline.width / 3) * -1;
      this.canvasOverlay.width = this.timeline.width;
      this.canvasOverlay.height = trackList.offsetHeight;
    },

    reflow() {
      this.computeTimelineWidth();
    },

    // RECORDING

    onRec() {
      if (this.recording) {
        this.stopRec();
      } else {
        this.startRec();
      }
    },
    startRec() {
      this.recordingIdCount++;
      this.recording = true;
      this.playing = true;
      this.startRecAllTracks();
    },
    startRecAllTracks() {
      this.tracksProcessed = 0;
      this.tracks
        .filter(track => track.recEnabled)
        .forEach(track => {
          this.startRecSingleTrack(track);
        });

      // this.recordingTracks.forEach(track => {
      // });

      this.setupCaptureBars(this.recordingTracks);
    },

    startRecSingleTrack(track) {
      this.recordingTracks.push(track);
      let chunks = [];
      let mediaStreamDestination = this.context.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);

      this.mediaRecorders.push(mediaRecorder);
      track.trackGain.connectNativeNode(mediaStreamDestination);

      //init trackClip
      this.trackClips[track.id].push({
        id: this.trackClips[track.id].length,
        xPos: this.cursorX,
        playing: true,
      });

      const clip = this.trackClips[track.id][this.trackClips[track.id].length - 1];

      mediaRecorder.ondataavailable = ({ data }) => chunks.push(data);
      // When recording's finished, process data chunk
      // into a Blob, and save it for future use
      mediaRecorder.onstop = () => {
        const blobFileReader = new FileReader();
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });

        blobFileReader.onloadend = () => {
          const arrayBuffer = blobFileReader.result;
          this.context.decodeAudioData(arrayBuffer, audioBuffer => {
            clip.blob = blob;
            clip.buffer = audioBuffer;

            this.tracksProcessed++;
            if (this.tracksProcessed >= this.recordingTracks.length) {
              this.onRecFinish();
            }
          });
        };

        blobFileReader.readAsArrayBuffer(blob);
        mediaStreamDestination = null;
        chunks = null;
      };

      mediaRecorder.start();
    },

    // Stop Rec
    stopRec() {
      this.stopRecAllTracks();
      this.recording = false;
      this.playing = false;
    },
    stopRecAllTracks() {
      this.mediaRecorders.forEach(mediaRecorder => {
        mediaRecorder.stop();
      });
      this.mediaRecorders = [];

      window.cancelAnimationFrame(this.recordingRaf);
      this.recordingRaf = null;
    },

    onRecFinish() {
      this.recordingTracks.forEach(track => {
        const clips = this.trackClips[track.id];
        const currentClip = clips[clips.length - 1];

        currentClip.duration = currentClip.buffer.duration;
        currentClip.barCount = currentClip.bars.length;
        currentClip.barDuration = currentClip.buffer.duration / currentClip.barCount;
        currentClip.playing = false;
      });

      this.recordingTracks = [];
      this.moveCursor(-1);
    },

    // PLAYBACK

    onPlay() {
      console.log('onplay');
      if (this.recording) return;
      if (this.playing) {
        this.onStopBtn();
        this.cursorX = this.whenPlayCursorX;
      }
      this.whenPlayCursorX = this.cursorX;
      this.playing = true;
      this.playAllTracks();
    },

    playAllTracks() {
      this.moveTimielineWithPlayback(performance.now() / this.timeline.timeOffset);
    },

    onStopBtn() {
      console.log('on stop');
      if (this.playing) {
        window.cancelAnimationFrame(this.playbackRaf);
        this.playing = false;
        this.stopAllTracks();
      } else {
        this.cursorX = 0;
        this.renderCursor();
      }
      if (this.recording) {
        this.stopRec();
      }
    },

    stopAllTracks() {
      for (const trackId in this.trackClips) {
        this.trackClips[trackId].forEach(clip => {
          if (clip.source) {
            clip.source.stop(0);
          }
        });
      }
    },

    // RENDERING

    setupCaptureBars(tracks) {
      this.renderDataObjects = [];

      tracks.forEach(track => {
        this.renderDataObjects.push(this.generateRenderDataObject(track));
      });

      this.captureBarsLoop(performance.now() / this.timeline.timeOffset);
    },

    generateRenderDataObject(track) {
      const analyser = track.trackGainAnalyser;
      const canvasContainer = document.querySelector('.rec-canvas-container');
      const canvas = this.$refs[`rec-canvas-${track.id}`][0];
      canvas.width = canvasContainer.offsetWidth;

      this.timeline.width = canvas.width; // todo: ver otra manera de obtener este dato

      this.trackClips[track.id][this.trackClips[track.id].length - 1].bars = [];

      const dataObj = {
        canvas,
        analyser,
        frequencyArray: new Float32Array(analyser.fftSize),
        bars: this.trackClips[track.id][this.trackClips[track.id].length - 1].bars,
        now: performance.now() / this.timeline.timeOffset,
      };

      return dataObj;
    },

    captureBarsLoop(now) {
      if (performance.now() / this.timeline.timeOffset > now) {
        this.renderDataObjects.forEach(renderDataObject => {
          let { analyser, frequencyArray, bars } = renderDataObject;

          now = performance.now() / this.timeline.timeOffset;
          analyser.getFloatTimeDomainData(frequencyArray);

          let sumOfSquares = 0;
          for (let i = 0; i < frequencyArray.length; i++) {
            sumOfSquares += frequencyArray[i] ** 2;
          }
          const avgPower = sumOfSquares / frequencyArray.length;
          const barHeight = avgPower.map(0, 1, 2, this.timeline.height);

          bars.push(barHeight);
        });

        if (this.followCursor) this.moveCarret();
      }

      this.renderCanvas();
      this.moveCursor(1);

      this.recordingRaf = requestAnimationFrame(this.captureBarsLoop.bind(null, now));
    },

    moveTimielineWithPlayback(now) {
      if (performance.now() / this.timeline.timeOffset > now) {
        now = performance.now() / this.timeline.timeOffset;
        this.moveCursor(1);
        this.renderCanvas(); // todo: this is overhead cause rendering bars when not needed, is just for detecting which clips should play

        if (this.followCursor) this.moveCarret();
      }

      this.playbackRaf = requestAnimationFrame(this.moveTimielineWithPlayback.bind(null, now));
    },

    moveCarret() {
      if (this.cursorX - this.globalX > this.timeline.width) {
        this.moveCanvas(this.timeline.carretSkip);
      }
    },

    renderCanvas() {
      for (const trackId in this.trackClips) {
        const clips = this.trackClips[trackId];
        const canvas = this.$refs[`rec-canvas-${trackId}`][0];
        const ctx = canvas.getContext('2d');
        const barWidth = this.timeline.barWidth;
        const timelineHeight = this.timeline.height;

        ctx.clearRect(0, 0, canvas.width, timelineHeight);

        clips.forEach(clip => {
          const bars = clip.bars;
          const clipXpos = clip.xPos;

          for (let x = clipXpos; x < bars.length + clipXpos; x++) {
            // render bars
            const bar = bars[x - clipXpos];

            ctx.fillStyle = clip.selected ? this.timeline.selectedColor : this.timeline.bgColor;
            ctx.fillRect((x - this.globalX) * barWidth, 0, barWidth, timelineHeight);

            ctx.fillStyle = '#000';
            ctx.fillRect((x - this.globalX) * barWidth, timelineHeight / 2 - bar / 2, barWidth, bar);

            // // play if corresponds
            if (this.playing) {
              if (!clip.playing) {
                if (
                  this.cursorX >= clipXpos &&
                  this.cursorX < clipXpos + clip.barCount - this.timeline.timeOffset
                ) {
                  this.playClip(trackId, clip);
                }
              }
            }
          }
        });
      }
    },

    moveCanvas(amount) {
      if (this.globalX - amount >= 0) this.globalX -= amount;
      this.renderCanvas();
    },

    playClip(trackId, clip) {
      const offset = (this.cursorX - clip.xPos) * clip.barDuration;
      clip.source = this.context.createBufferSource();
      clip.source.buffer = clip.buffer;

      const track = this.tracks.find(track => track.id == trackId);
      clip.source.connect(track.trackGain.inputNode);

      clip.source.start(0, offset, clip.duration);
      clip.playing = true;

      clip.source.onended = () => {
        clip.playing = false;
        clip.source.disconnect;
        clip.source = null;
        delete clip.source;
      };
    },

    moveCursor(amount) {
      this.cursorX += amount;
      this.renderCursor();
    },
    onCanvasClick(e, trackId) {
      const xPos = (e.clientX - e.target.getBoundingClientRect().x + this.globalX) / this.timeline.barWidth;
      this.positionCursor(xPos);
      // select tracks
      // const clips = this.trackClips[trackId];
      // for (var i = 0; i < clips.length; i++) {
      //   const clip = clips[i];
      //   if (xPos >= clip.xPos && xPos <= clip.xPos + clip.barCount) {
      //     clip.selected = true;
      //   } else {
      //     clip.selected = false;
      //   }
      //   this.renderCanvas();
      // }
    },
    positionCursor(xPos) {
      if (this.recording) return;
      this.cursorX = xPos;
      this.renderCursor();
      if (this.playing) {
        this.onStopBtn();
      }
    },
    renderCursor() {
      this.canvasOverlayCtx.clearRect(0, 0, this.timeline.width, this.canvasOverlay.height);
      this.canvasOverlayCtx.fillRect(
        (this.cursorX - this.globalX) * this.timeline.barWidth,
        0,
        2,
        this.canvasOverlay.height
      );
    },

    onTrackContainerWheel(event) {
      let amount = this.timeline.carretMovementAmount;
      let delta = 0.5;
      if (event.wheelDelta < 0) {
        delta = -0.5;
      }
      if (event.shiftKey) {
        amount = 0;
        this.timeline.barWidth += 1 * delta;
        if (this.timeline.barWidth < 0.5) {
          this.timeline.barWidth = 0.5;
        } else if (this.timeline.barWidth > 3) {
          this.timeline.barWidth = 3;
        }
      }

      if (this.globalX - amount * delta >= 0) {
        this.moveCanvas(amount * delta);
        this.renderCursor();
      }
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

      this.trackClips[this.trackIdCount] = [];
      this.canvasOverlay.height = this.timeline.height * this.tracks.length;
      this.renderCursor();

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
      // scroll
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
          case 13: //enter - rec/stop
            this.onRec();
            break;
          case 32: //space bar - play/pause
            if (this.playing) {
              this.onStopBtn();
            } else {
              this.onPlay();
            }
            break;
          case 37: //arrow left - move cursor
            if (!this.recording && !this.playing) this.moveCursor(-20);
            break;
          case 39: //arrow right - move cursor
            if (!this.recording && !this.playing) this.moveCursor(20);
            break;

          case 46: //delete - delete current track
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
            console.log(e.keyCode);
            break;
        }
      }
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

    // stopRecExport() {
    //   this.masterGain.disconnect(this.exportDestination);
    //   this.exportDestination = null;
    //   this.exportMediaRecorder.stop();
    //   this.exportMediaRecorder = null;
    // },
    // startRecExport() {
    //   let exportChunks = [];
    //   this.exportDestination = this.context.createMediaStreamDestination();
    //   this.masterGain.connect(this.exportDestination);
    //   this.exportMediaRecorder = new MediaRecorder(this.exportDestination.stream);
    //   this.exportMediaRecorder.ondataavailable = evt => {
    //     exportChunks.push(evt.data);
    //   };
    //   this.exportMediaRecorder.onstop = () => {
    //     const blob = new Blob(exportChunks, {
    //       type: 'audio/ogg; codecs=opus',
    //     });
    //     const exportFileReader = new FileReader();
    //     exportFileReader.onloadend = () => {
    //       const arrayBuffer = exportFileReader.result;

    //       this.context.decodeAudioData(arrayBuffer, audioBuffer => {
    //         this.exports.push({ id: this.recordingIdCount, audioBuffer, blob });
    //       });
    //     };
    //     exportFileReader.readAsArrayBuffer(blob);
    //     exportChunks = null;
    //   };
    //   this.exportMediaRecorder.start();
    // },

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

    toggleFollowing() {
      this.followCursor = !this.followCursor;
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

.track-list {
  position: relative;
}

.track {
  display: flex;
  align-items: center;
  justify-content: space-between;

  background: #111;
}
.track.selected {
  background: #333;
}
.track-inner-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  overflow: auto;
  white-space: nowrap;
  padding-right: 2rem;
}

.rec-canvas-container {
  position: relative;
  background: transparent;
  z-index: 1;
  flex: 1;
  height: 64px;
}

canvas {
  height: 100%;
  width: 100%;
}

.canvas-overlay {
  position: absolute;
  z-index: 0;
  top: 0;
  background: white;
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
