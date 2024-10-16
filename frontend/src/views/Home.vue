<template>
  <div class="home-wrapper">
    <div v-if="inited" class="home-inner">
      <!-- Top Section -->
      <div class="top-section">
        <Header :ref="'header'" @onRec="onRec" @onPlay="onPlay" @onStop="onStopBtn" @onNew="hardReset(true)"
          @onSave="onSave" @onLoad="onLoad" @onExport="onExport" @onFollow="onFollow" @onMidiMap="onMidiMap"
          :playing="playing" :recording="recording" :exporting="exporting" :following="followCursor" :mapping="mapping"
          :octave="octave" :transpose="transpose" :projects="projects" :projectName="projectName" :projectId="projectId"
          :lastSample="timeline.lastSample" :unsaved="unsaved" :isNew="isNew" />
      </div>

      <!-- Mid Section -->
      <div class="mid-section">
        <Sidebar class="left-col" @createInstrument="createInstrument" @createEffect="createAndInsertEffect"
          @loadPreset="loadPreset" @onFocus="setFocus" :instrument-is-loaded="!!currentTrack"
          :focused="focusing === 'sidebar'" />

        <div class="right-col" :class="{ focused: focusing === 'tracks' }" @click="setFocus('tracks')">
          <div class="top-controls">
            <!-- Click -->
            <Click ref="click" />
            <!-- Info -->
            <div class="info-wrapper select-none">
              <div class="info-container no-scrollbar" :style="{ width: timeline.viewportWidth + 'px' }"
                @click="logInfo">
                <div class="info-item">{{ globalStart }}</div>
                <!-- <div class="info-item">vpW: {{ timeline.viewportWidth }}</div> -->
                <div class="info-item">curr: {{ cursorX }}</div>
                <div class="info-item">last: {{ timeline.lastSample }}</div>
                <!-- <div class="info-item">zoom: {{ timeline.sampleWidth }}</div> -->
                <div class="info-item">{{ focusing }}</div>
                <div class="info-item last">{{ globalEnd }}</div>
              </div>
            </div>
          </div>

          <!-- Tracks -->
          <div class="tracklist-wrapper custom-scrollbar">
            <div class="tracklist">
              <div v-for="(track, t) in tracks" :key="track.id" class="track"
                :class="{ selected: currentTrackIndex === t, connecting: appConnecting }" @click.self="selectTrack(t)">
                <div class="left-controls no-scrollbar" @click="selectTrack(t)">
                  <div class="left-ctrls-inner">
                    <div @click.stop="deleteTrack(t)" class="pointer">[X]</div>
                    <div>{{ track.name }}</div>
                    <div>{{ track.instrument.name }}</div>
                  </div>
                </div>

                <!-- Track Timeline -->
                <div class="timeline" :ref="`timeline-${track.id}`" @mousedown="onCanvasMouseDown($event, track.id)"
                  @mousewheel="onCanvasContainerWheel">
                  <canvas :ref="`track-canvas-${track.id}`" :id="track.id" :height="timeline.trackHeight"></canvas>
                </div>

                <!-- Right Controls -->
                <div class="right-controls-wrapper">
                  <RightControls :Node="track.trackGain" :analyser="track.trackGainAnalyser"
                    :recEnabled="track.recEnabled" :selected="currentTrackIndex === t"
                    @toggleRecEnabled="toggleRecEnabled(track)" @knobClicked="knobClicked"
                    @selectTrack="selectTrack(t)" />
                </div>
              </div>

              <div class="canvas-overlay">
                <canvas ref="canvas-overlay" :width="timeline.viewportWidth"></canvas>
              </div>
            </div>

            <!-- Master -->
            <div class="track master">
              <div class="left-controls">Master</div>
              <div class="master-knob-wrapper" @click="knobClicked('MasterGain')">
                <Knob :ref="'MasterGain'" minVal="0" maxVal="1" :initVal="masterOutputKnob"
                  @knobTurned="setMasterGainValue" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom section: Current Track detail -->
      <div class="bottom-section">
        <div v-if="currentTrack" class="track-detail custom-scrollbar" :class="'track-detail_' + currentTrackIndex">
          <!-- Instrument -->
          <div class="track-instrument">
            <NodeRender :Node="currentTrack.instrument" :analyser="currentTrack.instrumentAnalyser"
              :instrumentEnabled="currentTrack.instrumentEnabled" @deleteNode="deleteTrack"
              @toggleInstrumentEnabled="toggleInstrumentEnabled" @knobClicked="knobClicked" />
          </div>

          <!-- Effects -->
          <div class="track-effects">
            <NodeRender v-for="(Node, effectIndex) in currentTrack.effects" :Node="Node" :analyser="Node.analyser"
              :key="Node.id" :ref="'Node-' + effectIndex" @deleteNode="deleteEffect(effectIndex)"
              @levelClicked="levelClicked(Node)" @knobClicked="knobClicked" />
            <div class="placeholder"></div>
          </div>
          <div class="analyser-render-wrapper">
            <SpectrumWaveshape :analyser="currentTrack.trackGainAnalyser" />
          </div>
        </div>
        <div v-else class="current-track-empty-state select-none">Double click an instrumentto start</div>
      </div>
      <!-- <Pad
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

    <ExportModal v-if="exporting" :exportProgress="exportProgress" @onCancel="cancelExport" />
  </div>
</template>

<script>
const Node = require('../class/Node');
const Gain = require('../class/Effects/Gain');
const noteFrequencies = require('../data/noteFrequencies');
const noteKeys = require('../data/noteKeys');
const numNotes = noteFrequencies.length;

var fftSize = 1024;
const sampleErrorMargin = 10;

import { mapMutations, mapGetters } from 'vuex';
import dbObj from '@/db/index.js';
import NodeRender from '@/components/NodeRender';
import RightControls from '@/components/RightControls';
import SpectrumWaveshape from '@/components/SpectrumWaveshape';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Click from '@/components/Click';
import Knob from '@/components/Knob';
import Pad from '@/components/user-interface/Pad';
import ExportModal from '@/components/modals/ExportModal';

import { $ } from '../dom-utils/DomUtils';
import { cliplist, state, timelineState, trackClips, tracklist } from '../state/vueInstance.js';
import { playSingleClip, stopAllClips } from '../functions/playback.js';
import { loadProject, saveProject } from '../functions/load-save.js';
import { startExport, finishRecExport } from '../functions/exports.js';
import { createInstrument, createEffect } from '../factory/NodeFactory';
import { startRecord, startRecordSingleTrack, stopRecord, stopRecordSingleTrack } from '../functions/recording';
import { clipHandle, duplicateClips, onTimelineMouseUp, resizeOrMoveClips, scrollOrZoomTimeline, selectClipOnHandleClick } from '../functions/timeline-interaction.js';
import { renderDataObjects } from '../functions/rendering.js';
import { clearArray, clearObj } from '../lib/array.js';


export default {
  name: 'Home',
  components: {
    Knob,
    Pad,
    Click,
    Header,
    Sidebar,
    NodeRender,
    SpectrumWaveshape,
    RightControls,
    ExportModal,
  },
  data() {
    return {
      inited: false,
      isNew: true,
      projects: null,
      projectId: undefined,
      projectIdCount: undefined,
      projectName: 'untitled',

      tracks: tracklist,
      trackIdCount: 0,
      currentTrack: null,
      currentTrackIndex: 0,

      masterOutput: null,
      masterInput: null,
      masterOutputKnob: 0.5,

      keyEnabled: [],
      keypressListeners: [],
      numpadListeners: [],
      xyPadListeners: [],

      //REC
      recording: false,
      selectedClips: [],
      clipIdCount: 0,
      mediaRecorders: {},
      totalProcessingTracks: 0,

      //Rendering
      followCursor: true,
      timeline: timelineState,
      trackProps: {
        // todo: get from css
        rightCtrlsWidth: 247,
        leftCtrlsWidth: 180,
      },
      globalStart: 0,
      globalEnd: 0,
      cursorX: 0,
      lastCursorPos: 0,
      recordingRaf: null,
      playbackRaf: null,

      //Play/Export
      playing: false,
      export: {},
      exporting: false,
      exportProgress: 0,
      clipDestination: null,

      //MIDI
      midiMappings: [],
      midiInputs: [],
      midiOutputs: [],
      mapping: false,
      refBeignMapped: null,

      unsaved: true,
      octave: 3,
      transpose: 0,
      m_pressed: false,
      focusing: 'tracks',
    };
  },

  computed: {
    ...mapGetters(['appIsMapping', 'appConnecting']),
  },

  beforeDestroy() {
    this.setContext(null);
    window.removeEventListener('keyup', this.onKeyup);
    window.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mouseup', onTimelineMouseUp);
    window.removeEventListener('mousemove', resizeOrMoveClips);
  },

  created() {
    this.addConfirmLeaveHandler();
    this.keyEnabled = Array(222).fill(true);
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(this.onMIDISuccess, this.onMIDIFailure);
    }
  },

  mounted() {
    $('.home-wrapper').addEventListener('click', this.init);
  },

  methods: {
    ...mapMutations(['setAppIsMapping']),

    init() {
      $('.home-wrapper').removeEventListener('click', this.init);
      Node.context = new (window.AudioContext || window.webkitAudioContext)();
      dbObj.initDb(dbData => {
        console.log('db inited', dbData);
        this.projects = dbData.projects;
        this.projectIdCount = dbData.projectIdCount;
      });

      this.inited = true;
      this.createMasterGain();

      this.$nextTick(() => {
        const canvasOverlayContainer = $('.canvas-overlay');
        canvasOverlayContainer.style.left = this.trackProps.leftCtrlsWidth + 'px';

        this.canvasOverlay = this.$refs['canvas-overlay'];
        this.canvasOverlayCtx = this.canvasOverlay.getContext('2d');
        this.computeTimelineDimensions();

        this.createTrack(createInstrument('Drumkit'));
        this.createTrack(createInstrument('Femod'));
        this.createAndInsertEffect('BiquadFilter');
      });

      window.addEventListener('keyup', this.onKeyup);
      window.addEventListener('keydown', this.onKeydown);
      window.addEventListener('resize', this.onResize);

      state.instance = this;
    },

    setFocus(target) {
      this.focusing = target;
    },

    computeTimelineDimensions() {
      const trackList = $('.tracklist');
      timelineState.viewportWidth =
        trackList.offsetWidth - this.trackProps.leftCtrlsWidth - this.trackProps.rightCtrlsWidth;

      timelineState.carretSkip = ~~(timelineState.viewportWidth / 3) * -1;
      this.canvasOverlay.width = timelineState.viewportWidth;
      this.canvasOverlay.height = trackList.offsetHeight;

      this.globalEnd = this.globalStart + timelineState.viewportWidth;
    },

    onResize() {
      this.computeTimelineDimensions();
      tracklist.forEach(track => track.canvas.width = timelineState.viewportWidth);
      this.moveCanvas(0);
    },

    // RECORDING
    onRec() {
      this.recording ? stopRecord() : startRecord();
    },
    toggleRecEnabled(track) {
      track.recEnabled = !track.recEnabled;
      if (this.recording) {
        if (track.recEnabled) {
          startRecordSingleTrack(track);
        } else {
          stopRecordSingleTrack(track);
        }
      }
    },

    // PLAYBACK
    onPlay() {
      if (this.recording) {
        return;
      }
      if (this.playing) {
        this.onStopBtn();
        this.cursorX = this.lastCursorPos;
      }
      this.lastCursorPos = this.cursorX;
      this.playAllTracks();
    },

    playAllTracks() {
      this.playing = true;
      this.moveTimielineWithPlayback();
    },

    onStopBtn() {
      if (this.playing) {
        this.playing = false;
        stopAllClips();
        cancelAnimationFrame(this.playbackRaf);
        this.playbackRaf = null;
      } else {
        if (this.globalStart !== 0) {
          this.globalStart = 0;
          this.renderCanvas();
        }
        if (this.cursorX !== 0) {
          this.cursorX = 0;
          this.renderCursor();
        }
      }
      if (this.recording) {
        stopRecord();
      }
    },

    // RENDERING
    generateRenderDataObject(track) {
      const analyser = track.trackGainAnalyser;
      const clip = trackClips[track.id][trackClips[track.id].length - 1];
      clip.bars = [];
      return {
        trackId: track.id,
        ctx: track.ctx,
        clip,
        analyser,
        dataArray: new Float32Array(analyser.fftSize),
      };
    },
    captureBarsLoop(cursorStep = 1) {
      this.recordingRaf = requestAnimationFrame(this.captureBarsLoop.bind(null, cursorStep));
      for (var r = 0; r < renderDataObjects.length; r++) {
        const renderDataObject = renderDataObjects[r];
        let { analyser, dataArray, clip, ctx } = renderDataObject;

        analyser.getFloatTimeDomainData(dataArray);

        let sumOfSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sumOfSquares += dataArray[i] ** 2;
        }
        const avgPower = sumOfSquares / dataArray.length;
        const barHeight = avgPower.map(0, 1, 1, timelineState.trackHeight);

        clip.bars.push(barHeight);
        this.renderClipBar(clip, ctx, clip.numSamples);
        clip.numSamples++;
        clip.endSample = clip.numSamples;

        // determine total timeleine width
        if (r === 0) {
          if (clip.xPos + clip.numSamples > timelineState.lastSample) {
            timelineState.lastSample = clip.xPos + clip.numSamples;
          }
        }
      }

      this.moveCursor(cursorStep);
      if (this.followCursor) {
        this.moveCarret();
      }
    },
    renderClipBar(clip, ctx, x) {
      const bar = clip.bars[x];

      ctx.fillStyle = clipHandle.color;
      ctx.fillRect(
        (this.cursorX - this.globalStart) * timelineState.sampleWidth,
        clipHandle.height,
        timelineState.sampleWidth,
        -clipHandle.height
      );

      ctx.fillStyle = '#000';
      ctx.fillRect(
        (this.cursorX - this.globalStart) * timelineState.sampleWidth,
        timelineState.trackHeight / 2 - bar / 2,
        timelineState.sampleWidth,
        bar
      );
    },

    moveTimielineWithPlayback() {
      this.playbackRaf = requestAnimationFrame(this.moveTimielineWithPlayback.bind(null));
      this.moveCursor(1);
      if (this.followCursor) {
        this.moveCarret();
      }
      if (this.exporting) {
        this.exportProgress = ~~((this.cursorX * 100) / timelineState.lastSample);
      }
    },

    moveCursor(amount) {
      this.cursorX += amount;
      this.renderCursor();

      if (this.recording || !this.playing) {
        return;
      }
      if (this.exporting && this.cursorX > timelineState.lastSample) {
        return finishRecExport();
      }

      // play clip if corresponds
      for (let c = 0; c < cliplist.length; c++) {
        const clip = cliplist[c];
        if (clip.playing) {
          continue;
        }
        if (
          this.cursorX >= clip.xPos &&
          this.cursorX < clip.xPos + clip.endSample - clip.startSample - sampleErrorMargin
        ) {
          playSingleClip(clip);
        }
      }
    },

    moveCarret() {
      if ((this.cursorX - this.globalStart) * timelineState.sampleWidth > timelineState.viewportWidth) {
        this.moveCanvas(timelineState.carretSkip);
      } else if (this.cursorX * timelineState.sampleWidth < this.globalStart) {
        this.moveCanvas(-timelineState.carretSkip);
      }
    },

    moveCanvas(amount) {
      if (this.globalStart - amount >= 0) {
        this.globalStart -= amount;
        this.globalEnd = this.globalStart + timelineState.viewportWidth;
        this.renderCanvas();
      }
    },
    renderCanvas() {
      for (const trackId in trackClips) {
        this.renderTrack(trackId);
      }
    },
    renderTrack(trackId) {
      const clips = trackClips[trackId];
      const canvas = this.$refs[`track-canvas-${trackId}`][0];
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, timelineState.trackHeight);
      for (var c = 0; c < clips.length; c++) {
        this.renderClip(clips[c], ctx);
      }
    },
    renderClip(clip, ctx) {
      const clipXPos = clip.xPos;
      const clipEnd = clipXPos + clip.endSample;
      // only if in viewport
      if (clipEnd >= this.globalStart && clipXPos <= this.globalEnd) {
        const first = clipXPos <= this.globalStart ? this.globalStart : clipXPos;
        const last =
          clipEnd - clip.startSample >= this.globalEnd ? this.globalEnd : clipEnd - clip.startSample;

        // only visible part
        for (var x = first; x < last; x++) {
          ctx.fillStyle = clip.selected ? clipHandle.selectedColor : clipHandle.color;
          ctx.fillRect(
            (x - this.globalStart) * timelineState.sampleWidth,
            clipHandle.height,
            timelineState.sampleWidth,
            -clipHandle.height
          );

          const bar = clip.bars[x - clipXPos + clip.startSample];
          ctx.fillStyle = '#000';
          ctx.fillRect(
            (x - this.globalStart) * timelineState.sampleWidth,
            timelineState.trackHeight / 2 - bar / 2,
            timelineState.sampleWidth,
            bar
          );
        }
      }
    },

    renderCursor() {
      this.canvasOverlayCtx.clearRect(0, 0, timelineState.viewportWidth, this.canvasOverlay.height);
      this.canvasOverlayCtx.fillRect(
        (this.cursorX - this.globalStart) * timelineState.sampleWidth,
        0,
        2,
        this.canvasOverlay.height
      );
    },

    // Timeline Interactions
    onCanvasMouseDown: selectClipOnHandleClick,
    onCanvasContainerWheel: scrollOrZoomTimeline,
    onFollow() {
      this.followCursor = !this.followCursor;
    },
    selectTrack(t) {
      if (this.currentTrackIndex === t) {
        return;
      }

      this.currentTrackIndex = t;
      this.currentTrack = null;
      this.$nextTick(() => this.currentTrack = tracklist[this.currentTrackIndex]);
    },


    // Tracks, Instruments & Effects

    // TODO: Rename to createAndInsertInstrument
    createInstrument(className) {
      this.createTrack(createInstrument(className));
    },

    createTrack(instrument, trackId) {
      const trackGain = new Gain('Track Gain');
      const trackGainAnalyser = Node.context.createAnalyser();
      trackGainAnalyser.fftSize = fftSize;

      instrument.connect(trackGain);
      trackGain.connectNativeNode(trackGainAnalyser, 'Analyser');
      trackGain.connectNativeNode(this.masterInput, 'Mixer Gain');

      this.trackIdCount++;
      const _trackId = trackId || this.trackIdCount;
      const track = {
        id: _trackId,
        name: 'Track ' + _trackId,
        displayName: 'Track ' + _trackId,
        instrument,
        effects: [],
        trackGain,
        trackGainAnalyser,
        recEnabled: true,
        instrumentEnabled: true,
      };

      tracklist.push(track);

      trackClips[_trackId] = [];
      this.canvasOverlay.height = timelineState.trackHeight * tracklist.length;
      this.renderCursor();

      this.$nextTick(() => {
        const canvasContainer = this.$refs[`timeline-${track.id}`][0];
        const canvas = this.$refs[`track-canvas-${track.id}`][0];
        canvas.width = canvasContainer.offsetWidth;
        track.canvas = canvas;
        track.ctx = canvas.getContext('2d');

        timelineState.viewportWidth = canvas.width;
      });

      this.currentTrack = track;
      this.currentTrackIndex = tracklist.length - 1;

      // key/touch listeners
      if (instrument.nodeType === 'Drumkit') {
        this.numpadListeners.push({
          instrument,
          trackName: track.name, // todo: should be track id
        });
      } else {
        this.keypressListeners.push({
          instrument,
          trackName: track.name, // todo: should be track id
        });
        this.xyPadListeners.push({
          instrument,
          trackName: track.name, // todo: should be track id
        });
      }

      if (this.recording) {
        if (track.recEnabled) {
          this.$nextTick(() => this.startRecSingleTrack(track));
        }
      }
      // scroll
    },

    deleteTrack(trackIndex) {
      if (typeof trackIndex !== 'number') {
        return;
      }

      let track = tracklist[trackIndex];

      // clips
      if (this.recording && track.recEnabled) {
        stopRecordSingleTrack(track);
      }

      delete trackClips[track.id];
      //todo: eliminate clips from cliplist

      // delete from listeners
      let index = this.keypressListeners.findIndex(listener => listener.trackName === track.name);
      if (index !== -1) this.keypressListeners.splice(index, 1);
      index = this.numpadListeners.findIndex(listener => listener.trackName === track.name);
      if (index !== -1) this.numpadListeners.splice(index, 1);
      index = this.xyPadListeners.findIndex(listener => listener.trackName === track.name);
      if (index !== -1) this.xyPadListeners.splice(index, 1);

      track.instrument.destroy();
      track.instrument = null;

      track.trackGain.disconnectNativeNode(this.masterInput);
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
      tracklist.splice(trackIndex, 1);

      let futureTrackIndex = trackIndex;
      if (futureTrackIndex > tracklist.length - 1) {
        futureTrackIndex--;
        if (futureTrackIndex >= 0) {
          this.selectTrack(futureTrackIndex);
        }
      } else {
        this.selectTrack(futureTrackIndex);
      }

      this.$nextTick(() => this.canvasOverlay.height = timelineState.trackHeight * tracklist.length);
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
        const trackInner = $(trackInnerClass);
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
      this.masterOutput = Node.context.createGain();
      this.masterOutput.gain.value = this.masterOutputKnob;

      this.masterInput = Node.context.createGain();
      this.masterInput.connect(this.masterOutput);
      this.masterOutput.connect(Node.context.destination);
    },

    setMasterGainValue(val) {
      this.masterOutput.gain.setValueAtTime(val, 0);
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
      this.xyPadListeners.forEach(scaleInterface => scaleInterface.instrument.playNote(noteIndex));
    },
    onPadTouchEnd(currentIndex) {
      const noteKeyIndex = currentIndex;
      let noteIndex = noteKeyIndex + 12 * this.octave + this.transpose;
      this.xyPadListeners.forEach(scaleInterface => scaleInterface.instrument.stopNote(noteIndex));
    },
    onPadTouchCancel(e) { },
    onPadTouchMove(e) { },

    // Keyboard
    onKeydown(e) {
      if (!this.keyEnabled[e.keyCode]) return;
      this.keyEnabled[e.keyCode] = false;
      const noteKeyIndex = noteKeys.findIndex(noteKey => e.key === noteKey);

      if (noteKeyIndex !== -1) {
        let noteIndex = noteKeyIndex + 12 * this.octave + this.transpose;
        if (noteIndex < 0) noteIndex = 0;
        if (noteIndex > numNotes - 1) noteIndex = numNotes - 1;

        this.keypressListeners.forEach(scaleInterface => scaleInterface.instrument.playNote(noteIndex));
      } else {
        this.onOtherKeydown(e);
      }
    },
    onKeyup(e) {
      this.keyEnabled[e.keyCode] = true;
      const noteKeyIndex = noteKeys.findIndex(noteKey => e.key === noteKey);

      if (noteKeyIndex !== -1) {
        const noteIndex = noteKeyIndex + 12 * this.octave + this.transpose;
        this.keypressListeners.forEach(scaleInterface => scaleInterface.instrument.stopNote(noteIndex));
      } else {
        this.onOtherKeyup(e);
      }
    },
    onOtherKeydown(e) {
      if (e.keyCode >= 97 && e.keyCode <= 105) {
        //1-9:
        this.numpadListeners.forEach(scaleInterface => scaleInterface.instrument.playNote(+e.key));
      } else {
        switch (e.keyCode) {
          case 38: //arrow   up - select track
            if (this.focusing !== 'tracks') return;
            var futureTrackIndex = this.currentTrackIndex - 1;
            if (futureTrackIndex >= 0) this.selectTrack(futureTrackIndex);
            break;
          case 40: //arrow down - select track
            if (this.focusing !== 'tracks') return;
            var futureTrackIndex = this.currentTrackIndex + 1;
            if (futureTrackIndex < tracklist.length) this.selectTrack(futureTrackIndex);
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
          tracklist[+e.key - 1].trackGain.toggleMute();
        }
      } else {
        switch (e.keyCode) {
          case 13: //enter - rec/stop
            if (this.focusing !== 'sidebar') this.onRec();
            break;
          case 27: //esc -
            this.onStopBtn();
            break;
          case 32: //space bar - play/pause
            if (this.playing) this.onStopBtn();
            else this.onPlay();
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
          case 66: //b - duplicate selected clips
            if (e.ctrlKey) duplicateClips();
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

    // LOAD/SAVE

    hardReset(generateSomeNodes) {
      console.log('hardReset');
      this.projects = {};
      this.projectId = undefined;
      this.projectIdCount = undefined;
      this.projectName = 'untitled';
      clearArray(cliplist);
      this.clipIdCount = 0;
      clearObj(trackClips);
      this.trackIdCount = 0;
      this.currentTrack = null;
      this.currentTrackIndex = 0;
      timelineState.lastSample = 0;
      timelineState.viewportWidth = undefined;
      this.globalStart = 0;
      this.globalEnd = 0;
      this.cursorX = 0;
      this.unsaved = true;
      this.computeTimelineDimensions();

      while (tracklist.length) {
        this.deleteTrack(0);
      }
      // todo: reset Nodes' Ids
      if (generateSomeNodes) {
        this.createTrack(createInstrument('Drumkit'));
        this.createTrack(createInstrument('Femod'));
        this.createAndInsertEffect('BiquadFilter');
      }
      this.renderCanvas();
      this.renderCursor();
    },

    onSave: saveProject,
    onLoad: loadProject,

    onLoadFinish(_trackClips) {
      console.log('onLoadFinish');
      clearObj(trackClips);
      Object.assign(trackClips, _trackClips);
      this.$nextTick(() => {
        this.computeTimelineDimensions();
        this.moveCanvas(0);
        this.renderCursor();
      });
    },

    loadInstrument(instSaveString, trackId) {
      const instrument = createInstrument(instSaveString.nodeType, instSaveString);
      this.createTrack(instrument, trackId);
    },

    loadEffect(effectSaveString) {
      const effect = createEffect(effectSaveString.nodeType, effectSaveString);
      this.insertEffect(effect);
    },

    loadPreset(saveString) {
      if (saveString.nodeRol === 'Instrument') {
        this.loadInstrument(saveString);
      } else {
        this.loadEffect(saveString);
      }
    },

    // EXPORT
    onExport() {
      const exportName = prompt('File name?', 'web-synth-export');
      if (!exportName) {
        return;
      }
      this.onStopBtn();
      this.onStopBtn(); // call twice to jump to the start of the timeline
      this.export = { name: exportName };
      this.exporting = true;
      startExport();
      this.clipDestination = this.masterInput;
      this.playAllTracks();
    },
    cancelExport() {
      this.export.canceled = true;
      finishRecExport();
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
    onMidiMap() {
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
    onMIDIFailure() { },

    addConfirmLeaveHandler() {
      window.onbeforeunload = function (e) {
        // TODO: remove if statement to enable
        if (1 == 2) {
          e = e || window.event;
          if (e) e.returnValue = 'Sure?';
          return 'Sure?';
        }
      };
    },

    logInfo() {
      let c = 0;
      let sum = 0;
      let min = 0;
      let max = 0;
      let avg;

      cliplist.forEach(clip => {
        if (clip.sampleRate < min || c === 0) min = clip.sampleRate;
        if (clip.sampleRate > max) max = clip.sampleRate;
        sum += clip.sampleRate;
        avg += clip.sampleDuration;
        c++;
      });
      console.log('sample rate avg:', sum / c);
      console.log('sample duration avg:', avg / c);
    },
  },
};
</script>

<style lang="scss">
canvas {
  height: 100%;
  width: 100%;
}

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
}

.right-col {
  background: black;
  flex: 1;
  border: 1px solid transparent;
  border-bottom: 0;
}

.right-col.focused {
  border-color: rgb(156, 156, 0);
}

// Info
.info-wrapper {
  background: #222;
}

.info-container {
  margin-left: var(--left-controls-width);
  width: calc(100% - var(--left-controls-width) - var(--right-controls-width));
  overflow-x: auto;
  display: flex;
  align-items: center;
  background: teal;

  &:first-child {
    padding-left: 0.25rem;
  }

  &:last-child {
    padding-right: 0.25rem;
  }
}

.info-item {
  padding: 0.25rem 0 0.25rem 0;
  min-width: 95px;
}

.info-item.last {
  flex: 1;
  text-align: right;
}

.tracklist-wrapper {
  height: calc(100vh - var(--top-section-height) - var(--top-controls-height) - var(--bottom-section-height));
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.tracklist {
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

.left-controls {
  width: var(--left-controls-width);
  padding: 1.4rem 0.5rem;
  overflow: auto;
  white-space: nowrap;
  padding-right: 2rem;
  user-select: none;
}

.left-ctrls-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-right: 100px;
}

.timeline {
  position: relative;
  background: transparent;
  z-index: 1;
  flex: 1;
  height: 64px;
}

.right-controls-wrapper {
  width: var(--right-controls-width);
}

.canvas-overlay {
  position: absolute;
  z-index: 0;
  top: 0;
  background: white;
}

.master {
  padding: 0 0.75rem;
  background: rgb(0, 53, 53);
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
  // padding-right: 10rem;
  height: 380px;
}

.node {
  height: 100%;
}

.track-instrument .container {
  height: 100%;
}

.track-effects {
  flex: 1;
  display: flex;
  gap: 0.5em;
}

.analyser-render-wrapper {
  margin-left: 1rem;
  align-self: end;
}

.welcome-msg {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
}
</style>
