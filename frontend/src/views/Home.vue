<template>
  <div class="home-wrapper">
    <div v-if="inited" class="home-inner">
      <!-- Top Section -->
      <div class="top-section">
        <Header
          :ref="'header'"
          @onNew="hardReset(true)"
          @onFollow="onFollow"
          :playing="playing"
          :recording="recording"
          :exporting="exporting"
          :following="followCursor"
          :octave="octave"
          :transpose="transpose"
          :projects="projects"
          :projectName="projectName"
          :projectId="projectId"
          :lastSample="timeline.lastSample"
          :unsaved="unsaved"
          :isNew="isNew"
        />
      </div>

      <!-- Mid Section -->
      <div class="mid-section">
        <Sidebar
          class="left-col"
          @createInstrument="createInstrument"
          @createEffect="createAndInsertEffect"
          @loadPreset="loadPreset"
          @onFocus="setFocus"
          :instrument-is-loaded="!!currentTrack"
          :focused="focusing === 'sidebar'"
        />

        <div class="right-col" :class="{ focused: focusing === 'tracks' }" @click="setFocus('tracks')">
          <div class="top-controls">
            <!-- Click -->
            <Click ref="click" />
            <!-- Info -->
            <div class="info-wrapper select-none">
              <div
                class="info-container no-scrollbar"
                :style="{ width: timeline.viewportWidth + 'px' }"
                @click="logInfo"
              >
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
              <div
                v-for="(track, t) in tracks"
                :key="track.id"
                class="track"
                :class="{ selected: currentTrackIndex === t, connecting: appConnecting }"
                @click.self="selectTrack(t)"
              >
                <div class="left-controls no-scrollbar" @click="selectTrack(t)">
                  <div class="left-ctrls-inner">
                    <div @click.stop="deleteTrack(t)" class="pointer">[X]</div>
                    <div>{{ track.name }}</div>
                    <div>{{ track.instrument.name }}</div>
                  </div>
                </div>

                <!-- Track Timeline -->
                <div
                  class="timeline"
                  :ref="`timeline-${track.id}`"
                  @mousedown="onCanvasMouseDown($event, track.id)"
                  @mousewheel="onCanvasContainerWheel"
                >
                  <canvas
                    :ref="`track-canvas-${track.id}`"
                    :id="track.id"
                    :height="timeline.trackHeight"
                  ></canvas>
                </div>

                <!-- Right Controls -->
                <div class="right-controls-wrapper">
                  <RightControls
                    :Node="track.trackGain"
                    :analyser="track.trackGainAnalyser"
                    :recEnabled="track.recEnabled"
                    :selected="currentTrackIndex === t"
                    @toggleRecEnabled="toggleRecEnabled(track)"
                    @knobClicked="knobClicked"
                    @selectTrack="selectTrack(t)"
                  />
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
                <Knob
                  :ref="'MasterGain'"
                  minVal="0"
                  maxVal="1"
                  :initVal="masterOutputKnob"
                  @knobTurned="setMasterGainValue"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom section: Current Track detail -->
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
import { mapGetters } from 'vuex';
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
import { playSingleClip } from '../functions/playback.js';
import { finishRecExport, cancelExport } from '../functions/exports.js';
import { createInstrument, createEffect } from '../factory/NodeFactory';
import { stopRecordSingleTrack } from '../functions/recording';
import {
  clipHandle,
  onTimelineMouseUp,
  resizeOrMoveClips,
  scrollOrZoomTimeline,
  selectClipOnHandleClick,
  trackProps,
} from '../functions/timeline-interaction.js';
import { renderDataObjects } from '../functions/rendering.js';
import {
  keypressListeners,
  mainKeyDownHandler,
  mainKeyupHandler,
  numpadListeners,
  xyPadListeners,
} from '../functions/keyboard.js';
import { clearArray, clearObj } from '../lib/array.js';
import { selectTrack, toggleRecEnabled } from '../functions/track-interaction.js';
import { knobClicked, requestMidiAccess } from '../functions/midi.js';

const Node = require('../class/Node');
const Gain = require('../class/Effects/Gain');

const fftSize = 1024;
const sampleErrorMargin = 10;

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

      unsaved: true,
      octave: 3,
      transpose: 0,
      m_pressed: false,
      focusing: 'tracks',

      tracks: tracklist,
      trackIdCount: 0,
      currentTrack: null,
      currentTrackIndex: 0,

      masterOutput: null,
      masterInput: null,
      masterOutputKnob: 0.5,

      //REC
      recording: false,
      selectedClips: [],
      clipIdCount: 0,
      mediaRecorders: {},
      totalProcessingTracks: 0,

      //Rendering
      followCursor: true,
      timeline: timelineState,
      globalStart: 0,
      globalEnd: 0,
      cursorX: 0,
      lastCursorPos: 0,
      recordingRaf: null,
      playbackRaf: null,

      //Play/Export
      playing: false,
      exporting: false,
      exportProgress: 0,
      clipDestination: null,
    };
  },

  computed: {
    ...mapGetters(['appConnecting']),
  },

  created() {
    this.addConfirmLeaveHandler();
    requestMidiAccess();
  },

  mounted() {
    $('.home-wrapper').addEventListener('click', this.init);
  },

  beforeDestroy() {
    window.removeEventListener('keyup', mainKeyupHandler);
    window.removeEventListener('keydown', mainKeyDownHandler);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mouseup', onTimelineMouseUp);
    window.removeEventListener('mousemove', resizeOrMoveClips);
  },

  methods: {
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
        canvasOverlayContainer.style.left = trackProps.leftCtrlsWidth + 'px';

        this.canvasOverlay = this.$refs['canvas-overlay'];
        this.canvasOverlayCtx = this.canvasOverlay.getContext('2d');
        this.computeTimelineDimensions();

        this.createTrack(createInstrument('Drumkit'));
        this.createTrack(createInstrument('Femod'));
        this.createAndInsertEffect('BiquadFilter');
      });

      window.addEventListener('keyup', mainKeyupHandler);
      window.addEventListener('keydown', mainKeyDownHandler);
      window.addEventListener('resize', this.onResize);

      state.instance = this;
    },

    cancelExport: cancelExport,

    selectTrack: selectTrack,
    toggleRecEnabled: toggleRecEnabled,

    onCanvasMouseDown: selectClipOnHandleClick,
    onCanvasContainerWheel: scrollOrZoomTimeline,

    knobClicked: knobClicked,

    setFocus(target) {
      this.focusing = target;
    },

    computeTimelineDimensions() {
      const trackList = $('.tracklist');
      timelineState.viewportWidth =
        trackList.offsetWidth - trackProps.leftCtrlsWidth - trackProps.rightCtrlsWidth;

      timelineState.carretSkip = ~~(timelineState.viewportWidth / 3) * -1;
      this.canvasOverlay.width = timelineState.viewportWidth;
      this.canvasOverlay.height = trackList.offsetHeight;

      this.globalEnd = this.globalStart + timelineState.viewportWidth;
    },

    onResize() {
      this.computeTimelineDimensions();
      tracklist.forEach(track => (track.canvas.width = timelineState.viewportWidth));
      this.moveCanvas(0);
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

    onFollow() {
      this.followCursor = !this.followCursor;
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
        numpadListeners.push({
          instrument,
          trackName: track.name, // todo: should be track id
        });
      } else {
        // TODO? Insted of using an object, using a tuple could improve performance?
        keypressListeners.push({
          instrument,
          trackName: track.name, // todo: should be track id
        });
        xyPadListeners.push({
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

      const track = tracklist[trackIndex];

      if (this.recording && track.recEnabled) {
        stopRecordSingleTrack(track);
      }

      delete trackClips[track.id];

      //TODO: eliminate clips from cliplist

      // delete from listeners
      let index = keypressListeners.findIndex(listener => listener.trackName === track.name);
      if (index !== -1) {
        keypressListeners.splice(index, 1);
      }

      index = numpadListeners.findIndex(listener => listener.trackName === track.name);
      if (index !== -1) {
        numpadListeners.splice(index, 1);
      }

      index = xyPadListeners.findIndex(listener => listener.trackName === track.name);
      if (index !== -1) {
        xyPadListeners.splice(index, 1);
      }

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

      // track = null;
      this.currentTrackIndex = null;
      this.currentTrack = null;
      tracklist.splice(trackIndex, 1);

      let futureTrackIndex = trackIndex;
      if (futureTrackIndex > tracklist.length - 1) {
        futureTrackIndex--;
        if (futureTrackIndex >= 0) {
          selectTrack(futureTrackIndex);
        }
      } else {
        selectTrack(futureTrackIndex);
      }

      this.$nextTick(() => (this.canvasOverlay.height = timelineState.trackHeight * tracklist.length));
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

    // Touch controls
    onPadTouchStart(currentIndex) {
      const noteKeyIndex = currentIndex;
      let noteIndex = noteKeyIndex + 12 * this.octave + this.transpose;
      xyPadListeners.forEach(scaleInterface => scaleInterface.instrument.playNote(noteIndex));
    },
    onPadTouchEnd(currentIndex) {
      const noteKeyIndex = currentIndex;
      let noteIndex = noteKeyIndex + 12 * this.octave + this.transpose;
      xyPadListeners.forEach(scaleInterface => scaleInterface.instrument.stopNote(noteIndex));
    },
    onPadTouchCancel(e) {},
    onPadTouchMove(e) {},

    // LOAD/SAVE

    hardReset(generateSomeNodes) {
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

    // todo: move to load-save
    onLoadFinish(_trackClips) {
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
