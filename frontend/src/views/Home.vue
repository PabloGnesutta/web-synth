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
          @onNew="hardReset(true)"
          @onSave="onSave"
          @onLoad="onLoad"
          @onExport="onExport"
          @onFollow="onFollow"
          @onMidiMap="onMidiMap"
          :playing="playing"
          :recording="recording"
          :exporting="exporting"
          :following="followCursor"
          :mapping="mapping"
          :octave="octave"
          :transpose="transpose"
          :projects="projects"
          :projectName="projectName"
          :projectId="projectId"
          :lastSample="timeline.lastSample"
          :unsaved="unsaved"
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

const minSampleWidth = 1;
const carretMovementAmount = 50;
const clipHandle = {
  height: 20,
  hookWidth: 10,
  color: '#10ff7050',
  selectedColor: '#ff652d96',
};
const sampleErrorMargin = 10;

import db from '@/db/index.js';
import { createInstrument, createEffect } from '../factory/NodeFactory';
import { mapMutations, mapGetters } from 'vuex';
import { $ } from '../dom-utils/DomUtils';
import NodeRender from '../components/NodeRender';
import RightControls from '../components/RightControls';
import SpectrumWaveshape from '../components/SpectrumWaveshape';
import Pad from '@/components/user-interface/Pad';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Click from '../components/Click';
import Knob from '../components/Knob';
import ExportModal from '@/components/modals/ExportModal';
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
      projectId: undefined,
      projectName: 'untitled',
      projects: null,

      tracks: [],
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
      clips: [],
      trackClips: {},
      selectedClips: [],
      clipIdCount: 0,
      mediaRecorders: {},
      totalProcessingTracks: 0,

      //Rendering
      renderDataObjects: [],
      followCursor: true,
      timeline: {
        trackHeight: 64,
        viewportWidth: undefined,
        sampleWidth: 1,
        lastSample: 0,
      },
      trackProps: {
        // todo: get from css
        rightCtrlsWidth: 247,
        leftCtrlsWidth: 180,
      },
      globalStart: 0,
      globalEnd: 0,
      cursorX: 0,
      lastPlayCursorPos: 0,
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
    ...mapGetters(['context', 'appIsMapping', 'appConnecting']),
  },

  beforeDestroy() {
    this.setContext(null);
    window.removeEventListener('keyup', this.onKeyup);
    window.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onWindowMousemove);
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
    ...mapMutations(['setAppIsMapping', 'setContext']),

    init() {
      $('.home-wrapper').removeEventListener('click', this.init);
      Node.context = new (window.AudioContext || window.webkitAudioContext)();
      this.setContext(Node.context);
      db.init(projects => {
        this.projects = projects;
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

      setTimeout(() => {
        this.test();
      }, 500);
    },

    test() {
      // this.onRec();
      // setTimeout(() => {
      //   this.onRec();
      // }, 2000);
      // const startInterval = 1000;
      // let duration = 10000;
      // let c = 0;
      // setInterval(() => {
      //   this.onRec();
      //   setTimeout(() => {
      //     this.onRec();
      //   }, duration);
      // }, startInterval + duration);
    },

    setFocus(target) {
      this.focusing = target;
    },
    computeTimelineDimensions() {
      const trackList = $('.tracklist');
      this.timeline.viewportWidth =
        trackList.offsetWidth - this.trackProps.leftCtrlsWidth - this.trackProps.rightCtrlsWidth;

      this.timeline.carretSkip = ~~(this.timeline.viewportWidth / 3) * -1;
      this.canvasOverlay.width = this.timeline.viewportWidth;
      this.canvasOverlay.height = trackList.offsetHeight;

      this.globalEnd = this.globalStart + this.timeline.viewportWidth;
    },

    onResize() {
      this.computeTimelineDimensions();
      this.tracks.forEach(track => {
        track.canvas.width = this.timeline.viewportWidth;
      });
      this.moveCanvas(0);
    },

    // RECORDING
    toggleRecEnabled(track) {
      track.recEnabled = !track.recEnabled;
      if (this.recording) {
        if (track.recEnabled) {
          this.startRecSingleTrack(track);
        } else {
          this.stopRecSingleTrack(track);
        }
      }
    },
    onRec() {
      this.recording ? this.stopRec() : this.startRec();
    },
    startRec() {
      this.totalProcessingTracks = 0;
      this.recording = true;
      this.renderDataObjects = [];
      this.tracks
        .filter(track => track.recEnabled)
        .forEach(track => {
          this.startRecSingleTrack(track);
        });

      let cursorStep = 1;
      if (this.playing) cursorStep = 0;

      this.playing = true;
      this.captureBarsLoop(cursorStep);
    },

    startRecSingleTrack(track) {
      this.totalProcessingTracks++;

      let chunks = [];
      let mediaStreamDestination = this.context.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);

      this.mediaRecorders[track.id] = mediaRecorder;
      track.trackGain.connectNativeNode(mediaStreamDestination);

      // init clip
      const clip = {
        trackId: track.id,
        id: ++this.clipIdCount,
        xPos: this.cursorX,
        startSample: 0,
        endSample: 0,
        numSamples: 0,
        sampleRate: 0,
        playing: true,
      };
      this.clips.push(clip);
      this.trackClips[track.id].push(clip);

      mediaRecorder.ondataavailable = ({ data }) => chunks.push(data);
      // When recording's finished, process data chunk
      // into a Blob, and save it for future use
      mediaRecorder.onstop = () => {
        const blobReader = new FileReader();
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });

        blobReader.onloadend = () => {
          const arrayBuffer = blobReader.result;
          this.context.decodeAudioData(arrayBuffer, audioBuffer => {
            clip.blob = blob;
            clip.buffer = audioBuffer;
            clip.duration = clip.buffer.duration;
            clip.numSamples = clip.bars.length;
            clip.endSample = clip.bars.length;
            clip.sampleDuration = clip.buffer.duration / clip.numSamples;
            clip.playing = false;
            clip.sampleRate = Math.round(clip.buffer.length / clip.numSamples);
            this.totalProcessingTracks--;
            if (this.totalProcessingTracks <= 0) this.onRecFinish();
          });
        };

        blobReader.readAsArrayBuffer(blob);
        mediaStreamDestination = null;
        chunks = null;
      };

      mediaRecorder.start();

      this.renderDataObjects.push(this.generateRenderDataObject(track));
    },

    // Stop Rec
    stopRec() {
      this.recording = false;
      this.playing = false;

      for (const trackId in this.mediaRecorders) {
        this.mediaRecorders[trackId].stop();
        delete this.mediaRecorders[trackId];
      }

      this.mediaRecorders = {};

      cancelAnimationFrame(this.recordingRaf);
      cancelAnimationFrame(this.playbackRaf);
      this.recordingRaf = null;
      this.playbackRaf = null;
    },

    stopRecSingleTrack(track) {
      this.mediaRecorders[track.id].stop();
      delete this.mediaRecorders[track.id];

      let index = this.renderDataObjects.findIndex(o => o.trackId == track.id);
      this.renderDataObjects.splice(index, 1);
    },

    onRecFinish() {
      this.logInfo();
    },

    // PLAYBACK

    onPlay() {
      if (this.recording) return;
      if (this.playing) {
        this.onStopBtn();
        this.cursorX = this.lastPlayCursorPos;
      }
      this.lastPlayCursorPos = this.cursorX;
      this.playAllTracks();
    },

    playAllTracks() {
      this.playing = true;
      this.moveTimielineWithPlayback();
    },

    onStopBtn() {
      if (this.playing) {
        this.playing = false;
        this.stopAllClips();
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
        this.stopRec();
      }
    },

    stopAllClips() {
      this.clips.forEach(clip => {
        clip.source && clip.source.stop();
      });
    },

    // RENDERING

    generateRenderDataObject(track) {
      const analyser = track.trackGainAnalyser;
      const clip = this.trackClips[track.id][this.trackClips[track.id].length - 1];
      clip.bars = [];
      return {
        trackId: track.id,
        ctx: track.ctx,
        clip,
        analyser,
        dataArray: new Float32Array(analyser.fftSize),
      };
    },

    captureBarsLoop(cursorStep) {
      this.recordingRaf = requestAnimationFrame(this.captureBarsLoop.bind(null, cursorStep));
      for (var r = 0; r < this.renderDataObjects.length; r++) {
        const renderDataObject = this.renderDataObjects[r];
        let { analyser, dataArray, clip, ctx } = renderDataObject;

        analyser.getFloatTimeDomainData(dataArray);

        let sumOfSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sumOfSquares += dataArray[i] ** 2;
        }
        const avgPower = sumOfSquares / dataArray.length;
        const barHeight = avgPower.map(0, 1, 1, this.timeline.trackHeight);

        clip.bars.push(barHeight);
        this.renderClipBar(clip, ctx, clip.numSamples);
        clip.numSamples++;
        clip.endSample = clip.numSamples;

        // determine total timeleine width
        if (r === 0)
          if (clip.xPos + clip.numSamples > this.timeline.lastSample)
            this.timeline.lastSample = clip.xPos + clip.numSamples;
      }

      this.moveCursor(cursorStep);
      if (this.followCursor) this.moveCarret();
    },

    renderClipBar(clip, ctx, x) {
      const bar = clip.bars[x];

      ctx.fillStyle = clipHandle.color;
      ctx.fillRect(
        (this.cursorX - this.globalStart) * this.timeline.sampleWidth,
        clipHandle.height,
        this.timeline.sampleWidth,
        -clipHandle.height
      );

      ctx.fillStyle = '#000';
      ctx.fillRect(
        (this.cursorX - this.globalStart) * this.timeline.sampleWidth,
        this.timeline.trackHeight / 2 - bar / 2,
        this.timeline.sampleWidth,
        bar
      );
    },

    moveTimielineWithPlayback() {
      this.playbackRaf = requestAnimationFrame(this.moveTimielineWithPlayback.bind(null));
      this.moveCursor(1);
      if (this.followCursor) this.moveCarret();
      if (this.exporting) this.exportProgress = ~~((this.cursorX * 100) / this.timeline.lastSample);
    },

    moveCarret() {
      if ((this.cursorX - this.globalStart) * this.timeline.sampleWidth > this.timeline.viewportWidth)
        this.moveCanvas(this.timeline.carretSkip);
      else if (this.cursorX * this.timeline.sampleWidth < this.globalStart) {
        this.moveCanvas(-this.timeline.carretSkip);
      }
    },
    moveCanvas(amount) {
      if (this.globalStart - amount >= 0) {
        this.globalStart -= amount;
        this.globalEnd = this.globalStart + this.timeline.viewportWidth;
        this.renderCanvas();
      }
    },
    //render canvas
    renderCanvas() {
      console.log('render canvas');
      for (const trackId in this.trackClips) this.renderTrack(trackId);
    },
    //render track
    renderTrack(trackId) {
      const clips = this.trackClips[trackId];
      const canvas = this.$refs[`track-canvas-${trackId}`][0];
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, this.timeline.trackHeight);
      for (var c = 0; c < clips.length; c++) this.renderClip(clips[c], ctx);
    },
    //render clip
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
            (x - this.globalStart) * this.timeline.sampleWidth,
            clipHandle.height,
            this.timeline.sampleWidth,
            -clipHandle.height
          );

          const bar = clip.bars[x - clipXPos + clip.startSample];
          ctx.fillStyle = '#000';
          ctx.fillRect(
            (x - this.globalStart) * this.timeline.sampleWidth,
            this.timeline.trackHeight / 2 - bar / 2,
            this.timeline.sampleWidth,
            bar
          );
        }
      }
    },

    playClip(clip) {
      console.log('play clip', clip.id);
      clip.source = this.context.createBufferSource();
      clip.source.buffer = clip.buffer;

      const offsetStart = (this.cursorX - clip.xPos + clip.startSample) * clip.sampleDuration;
      const offsetEnd = (clip.xPos + clip.endSample - this.cursorX) * clip.sampleDuration;

      const track = this.tracks.find(track => track.id == clip.trackId); // esto es una verga
      clip.source.connect(this.clipDestination || track.trackGain.inputNode);
      clip.source.start(0, offsetStart, offsetEnd);
      clip.playing = true;

      clip.source.onended = () => {
        clip.playing = false;
        clip.source.disconnect();
        clip.source = null;
        delete clip.source;
      };
    },

    // Timeline Interactions

    moveCursor(amount) {
      this.cursorX += amount;
      this.renderCursor();

      if (this.recording || !this.playing) return;
      if (this.cursorX > this.timeline.lastSample) return this.exporting && this.finishRecExport();

      // play clip if corresponds
      for (let c = 0; c < this.clips.length; c++) {
        const clip = this.clips[c];
        if (!clip.playing)
          if (
            this.cursorX >= clip.xPos &&
            this.cursorX < clip.xPos + clip.endSample - clip.startSample - sampleErrorMargin
          ) {
            this.playClip(clip);
          }
      }
    },
    unselectClips() {
      if (!this.selectedClips.length) return;
      const trackIds = new Set();

      this.selectedClips.forEach(clip => {
        clip.selected = false;
        trackIds.add(clip.trackId);
      });
      this.selectedClips = [];
      trackIds.forEach(trackId => {
        this.renderTrack(trackId);
      });
    },
    selectOneClip(clip) {
      const trackIds = new Set([clip.trackId]);

      this.selectedClips.forEach(selectedClip => {
        selectedClip.selected = false;
        trackIds.add(selectedClip.trackId);
      });
      clip.selected = true;
      this.selectedClips = [clip];
      trackIds.forEach(trackId => {
        this.renderTrack(trackId);
      });
    },
    unselectOneCLip(clip) {
      clip.selected = false;
      const index = this.selectedClips.findIndex(selectedClip => selectedClip.id === clip.id);
      this.selectedClips.splice(index, 1);
      const trackId = clip.trackId;
      this.renderTrack(trackId);
    },

    // slect clip on handle clicked
    onCanvasMouseDown(e, trackId) {
      const xPos =
        (e.clientX - e.target.getBoundingClientRect().x + this.globalStart) / this.timeline.sampleWidth;
      const yPos = e.clientY - e.target.getBoundingClientRect().y;

      let anyClipSelected = false;
      let anyHandleClicked = false;
      if (yPos <= clipHandle.height) {
        const clips = this.trackClips[trackId];
        for (var i = 0; i < clips.length; i++) {
          const clip = clips[i];
          if (xPos >= clip.xPos && xPos + clip.startSample <= clip.xPos + clip.endSample) {
            // has clicked on a clip handle
            anyHandleClicked = true;
            if (e.ctrlKey) {
              if (!clip.selected) {
                clip.selected = true;
                this.selectedClips.push(clip);
                anyClipSelected = true;
              } else {
                this.unselectOneCLip(clip);
              }
            } else {
              if (!clip.selected) {
                this.selectOneClip(clip);
              }
            }
          }
        }
      }

      if (anyHandleClicked) {
        if (anyClipSelected) this.renderTrack(trackId);
      } else {
        this.unselectClips();
        this.positionCursor(xPos);
      }

      const timelines = $('.timeline');
      for (var i = 0; i < timelines.length; i++)
        timelines[i].removeEventListener('mousemove', this.onCanvasMouseMove);
      window.addEventListener('mousemove', this.onWindowMousemove);
      window.addEventListener('mouseup', this.onMouseUp);
    },

    // set if clip will resize
    onCanvasMouseMove(e) {
      const xPos =
        (e.clientX - e.target.getBoundingClientRect().x + this.globalStart) / this.timeline.sampleWidth;
      const yPos = e.clientY - e.target.getBoundingClientRect().y;

      let anyHandleHovered = false;
      const trackId = e.target.id;
      if (yPos <= clipHandle.height) {
        const clips = this.trackClips[trackId];
        for (var i = 0; i < clips.length; i++) {
          const clip = clips[i];
          if (xPos + clip.startSample >= clip.xPos && xPos + clip.startSample <= clip.xPos + clip.endSample) {
            // has hovered over a clip handle
            anyHandleHovered = true;
            if (xPos > clip.xPos - 10 && xPos < clip.xPos + clipHandle.hookWidth) {
              e.target.classList.add('e-resize');
              clip.willResize = 'start';
            } else if (
              xPos + clip.startSample > clip.xPos + clip.endSample - clipHandle.hookWidth &&
              xPos + clip.startSample < clip.xPos + clip.endSample + clipHandle.hookWidth
            ) {
              e.target.classList.add('e-resize');
              clip.willResize = 'end';
            } else {
              e.target.classList.remove('e-resize');
              clip.willResize = null;
            }
          }
        }
      }

      if (!anyHandleHovered) e.target.classList.remove('e-resize');
    },

    // resize or move clips
    onWindowMousemove(e) {
      for (var i = 0; i < this.selectedClips.length; i++) {
        const clip = this.selectedClips[i];
        if (clip.selected) {
          if (clip.willResize) {
            if (clip.willResize === 'start') {
              // resize from start
              if (clip.startSample + e.movementX >= 0) {
                if (clip.startSample + e.movementX < clip.endSample - 13) {
                  // prevent reducing the clip to 0
                  clip.startSample += e.movementX;
                  clip.xPos += e.movementX;
                }
              } else {
                clip.startSample = 0;
              }
            } else {
              // resize from end
              if (clip.endSample + e.movementX <= clip.numSamples) {
                if (clip.endSample + e.movementX > clip.startSample + 13) {
                  // prevent reducing the clip to 0
                  clip.endSample += e.movementX;
                }
              } else {
                clip.endSample = clip.numSamples;
              }
            }
          } else {
            clip.xPos += e.movementX;
          }
        }

        if (clip.xPos + clip.endSample > this.timeline.lastSample)
          this.timeline.lastSample = clip.xPos + clip.endSample;

        this.renderTrack(clip.trackId);
      }
    },

    duplicateClips() {
      this.selectedClips.forEach(clip => {
        const newClip = { ...clip };
        clip.xPos = clip.xPos + clip.endSample - clip.startSample;
        newClip.selected = false;
        this.clips.push(newClip);
        this.trackClips[clip.trackId].push(newClip);

        this.renderTrack(clip.trackId);
      });
    },

    onMouseUp(e) {
      const timelines = $('.timeline');
      for (var i = 0; i < timelines.length; i++) {
        timelines[i].addEventListener('mousemove', this.onCanvasMouseMove);
      }
      window.removeEventListener('mousemove', this.onWindowMousemove);
      window.removeEventListener('mouseup', this.onMouseUp);
    },

    positionCursor(xPos) {
      if (this.recording) return;
      this.cursorX = xPos;
      this.renderCursor();
      if (this.playing) {
        this.onStopBtn();
      }
    },
    //render cursor
    renderCursor() {
      this.canvasOverlayCtx.clearRect(0, 0, this.timeline.viewportWidth, this.canvasOverlay.height);
      this.canvasOverlayCtx.fillRect(
        (this.cursorX - this.globalStart) * this.timeline.sampleWidth,
        0,
        2,
        this.canvasOverlay.height
      );
    },

    onCanvasContainerWheel(event) {
      event.preventDefault();
      let amount = carretMovementAmount;
      let delta = minSampleWidth;
      if (event.wheelDelta < 0) {
        delta = -minSampleWidth;
      }
      if (event.shiftKey) {
        amount = 0;
        this.timeline.sampleWidth += 1 * delta;
        if (this.timeline.sampleWidth < minSampleWidth) {
          this.timeline.sampleWidth = minSampleWidth;
        } else if (this.timeline.sampleWidth > 3) {
          this.timeline.sampleWidth = 3;
        }
      }

      if (this.globalStart - amount * delta >= 0) {
        this.moveCanvas(amount * delta);
        this.renderCursor();
      }
    },

    // Tracks, Instruments & Effects

    createInstrument(className) {
      const Node = createInstrument(className);
      this.createTrack(Node);
    },

    createTrack(instrument, trackId) {
      const trackGain = new Gain('Track Gain');
      const trackGainAnalyser = this.context.createAnalyser();
      trackGainAnalyser.fftSize = fftSize;

      instrument.connect(trackGain);
      trackGain.connectNativeNode(trackGainAnalyser, 'Analyser');
      trackGain.connectNativeNode(this.masterInput, 'Mixer Gain');

      this.trackIdCount++;
      const track = {
        id: trackId || this.trackIdCount,
        name: 'Track ' + this.trackIdCount,
        displayName: 'Track ' + this.trackIdCount,
        instrument,
        effects: [],
        trackGain,
        trackGainAnalyser,
        recEnabled: true,
        instrumentEnabled: true,
      };

      this.tracks.push(track);

      this.trackClips[this.trackIdCount] = [];
      this.canvasOverlay.height = this.timeline.trackHeight * this.tracks.length;
      this.renderCursor();

      this.$nextTick(() => {
        const canvasContainer = $('.timeline')[0];
        const canvas = this.$refs[`track-canvas-${track.id}`][0];
        canvas.width = canvasContainer.offsetWidth;
        track.canvas = canvas;
        track.ctx = canvas.getContext('2d');

        this.timeline.viewportWidth = canvas.width;
      });

      this.currentTrack = track;
      this.currentTrackIndex = this.tracks.length - 1;

      // key/touch listeners
      if (instrument.nodeType === 'Drumkit') {
        this.numpadListeners.push({
          instrument,
          trackName: track.name,
        });
      } else {
        this.keypressListeners.push({
          instrument,
          trackName: track.name,
        });
        this.xyPadListeners.push({
          instrument,
          trackName: track.name,
        });
      }

      if (this.recording) {
        if (track.recEnabled) {
          this.$nextTick(() => {
            this.startRecSingleTrack(track);
          });
        }
      }
      // scroll
    },

    deleteTrack(trackIndex) {
      if (typeof trackIndex !== 'number') {
        return;
      }

      let track = this.tracks[trackIndex];

      // clips
      if (this.recording) if (track.recEnabled) this.stopRecSingleTrack(track);

      delete this.trackClips[track.id];
      //todo: eliminate clips from this.clips

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

      this.$nextTick(() => {
        this.canvasOverlay.height = this.timeline.trackHeight * this.tracks.length;
      });
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

    selectTrack(t) {
      if (this.currentTrackIndex === t) return;

      this.currentTrackIndex = t;
      this.currentTrack = null;
      this.$nextTick(() => {
        this.currentTrack = this.tracks[this.currentTrackIndex];
      });
    },

    createMasterGain() {
      this.masterOutput = this.context.createGain();
      this.masterOutput.gain.value = this.masterOutputKnob;

      this.masterInput = this.context.createGain();
      this.masterInput.connect(this.masterOutput);
      this.masterOutput.connect(this.context.destination);
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
        if (noteIndex > numNotes - 1) noteIndex = numNotes - 1;

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
        const noteIndex = noteKeyIndex + 12 * this.octave + this.transpose;
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
            if (this.focusing !== 'tracks') return;
            var futureTrackIndex = this.currentTrackIndex - 1;
            if (futureTrackIndex >= 0) this.selectTrack(futureTrackIndex);
            break;
          case 40: //arrow down - select track
            if (this.focusing !== 'tracks') return;
            var futureTrackIndex = this.currentTrackIndex + 1;
            if (futureTrackIndex < this.tracks.length) this.selectTrack(futureTrackIndex);
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
            if (e.ctrlKey) this.duplicateClips();
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
      console.log('hard reset');
      this.projectId = undefined;
      this.projectName = 'untitled';
      this.clips = [];
      this.trackClips = {};
      this.trackIdCount = 0;
      this.currentTrack = null;
      this.currentTrackIndex = 0;
      this.clipIdCount = 0;
      this.timeline.lastSample = 0;
      this.timeline.viewportWidth = undefined;
      this.globalStart = 0;
      this.cursorX = 0;
      this.unsaved = true;
      this.computeTimelineDimensions();

      for (var i = 0; i < this.tracks.length; i++) this.deleteTrack(i);
      this.tracks = [];
      // todo: reset Nodes' Ids

      if (generateSomeNodes) {
        this.createTrack(createInstrument('Drumkit'));
        this.createTrack(createInstrument('Femod'));
        this.createAndInsertEffect('BiquadFilter');
      }

      this.renderCanvas();
      this.renderCursor();
    },

    onSave(newProjectName) {
      if (!db.projects[this.projectId] || newProjectName) {
        // new project
        this.projectName = newProjectName;
        this.projectId = ++db.projectIdCount;
        db.projects[this.projectId] = { name: this.projectName };
        db.updateProjectsList({ projects: db.projects, idCount: this.projectId }, () => {
          console.log('projects updated');
        });
      }

      db.save(
        this.projectId,
        'project_data',
        {
          globalStart: this.globalStart,
          cursorX: this.cursorX,
          tempo: this.tempo,
          octave: this.octave,
          transpose: this.transpose,
          masterOutputKnob: this.masterOutputKnob,
          followCursor: this.followCursor,
        },
        () => {
          console.log('project_data saved');
        }
      );

      const tracks = [];
      this.tracks.forEach(track => {
        tracks.push({
          id: track.id,
          instrument: JSON.parse(track.instrument.saveString()),
          effects: track.effects.map(effect => JSON.parse(effect.saveString())),
        });
      });
      db.save(this.projectId, 'tracks', tracks, () => {
        console.log('tracks saved');
      });

      const trackClips = {};
      for (const trackId in this.trackClips) {
        const clips = this.trackClips[trackId];
        trackClips[trackId] = clips.map(clip => {
          const saveClip = { ...clip };
          delete saveClip.buffer;
          delete saveClip.selected;
          return saveClip;
        });
      }
      db.save(this.projectId, 'track_clips', trackClips, () => {
        console.log('track_clips saved');
        this.unsaved = false;
      });
    },

    onLoad({ projectId, projectName }) {
      this.hardReset();
      this.projectId = parseInt(projectId);
      this.projectName = projectName;

      db.get(this.projectId, 'project_data', data => {
        this.loadProjectData(data);
      });
      db.get(this.projectId, 'tracks', data => {
        this.loadTracks(data);
      });
      db.get(this.projectId, 'track_clips', data => {
        this.loadTrackClips(data);
        this.unsaved = false;
      });
    },
    loadProjectData(projectData) {
      // todo: load click values
      console.log('load project data');
      this.globalStart = projectData.globalStart;
      this.cursorX = projectData.cursorX;
      this.masterOutputKnob = projectData.masterOutputKnob;
      this.followCursor = projectData.followCursor;
      this.octave = projectData.octave;
      this.transpose = projectData.transpose;
    },
    loadTracks(tracks) {
      tracks.forEach(track => {
        this.loadInstrument(track.instrument, track.id);
        track.effects.forEach(effect => {
          this.loadEffect(effect);
        });
      });
    },
    loadTrackClips(trackClips) {
      let clipsProcessed = 0;
      let numClips = 0;
      for (const trackId in trackClips) {
        const clips = trackClips[trackId];
        numClips += clips.length;
        // if there is no clips, onLoadFinish never triggers
        clips.forEach(clip => {
          const blobReader = new FileReader();
          blobReader.onloadend = () => {
            const arrayBuffer = blobReader.result;
            this.context.decodeAudioData(arrayBuffer, audioBuffer => {
              clip.buffer = audioBuffer;
              clip.duration = clip.buffer.duration;
              clip.numSamples = clip.bars.length;
              clip.sampleDuration = clip.buffer.duration / clip.numSamples;
              clip.sampleRate = Math.round(clip.buffer.length / clip.numSamples);
              clip.playing = false;
              this.clips.push(clip);

              // determine total timeleine width
              const endPos = clip.xPos + clip.numSamples; //endSample
              if (endPos > this.timeline.lastSample) this.timeline.lastSample = endPos;
              // might fail because of race condition?
              if (++clipsProcessed >= numClips) this.onLoadFinish(trackClips);
            });
          };
          blobReader.readAsArrayBuffer(clip.blob);
        });
      }
    },

    onLoadFinish(trackClips) {
      console.log('onLoadFinish');
      this.trackClips = trackClips;
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
      this.export.name = prompt('File name?', 'web-synth-export');
      if (!this.export.name) return;
      this.onStopBtn();
      this.onStopBtn();
      this.export = {};
      this.exporting = true;
      this.recordExport();
      this.clipDestination = this.masterInput;
      this.playAllTracks();
    },

    finishRecExport() {
      this.exportMediaRecorder.stop();
      this.exporting = false;
      this.onStopBtn();
    },

    onRecordExportFinish() {
      this.exportMediaRecorder = null;
      this.clipDestination = null;

      if (!this.export.canceled) {
        this.downloadBlob(this.export.blob, this.export.name);
        this.export.name = null;
      }
    },

    cancelExport() {
      this.export.canceled = true;
      this.finishRecExport();
    },

    recordExport() {
      let chunks = [];
      let mediaStreamDestination = this.context.createMediaStreamDestination();
      this.exportMediaRecorder = new MediaRecorder(mediaStreamDestination.stream);

      this.masterOutput.connect(mediaStreamDestination);

      this.exportMediaRecorder.ondataavailable = ({ data }) => chunks.push(data);
      // When recording's finished, process data chunk
      // into a Blob, and save it for future use
      this.exportMediaRecorder.onstop = () => {
        const blobReader = new FileReader();
        const blob = new Blob(chunks, { type: 'audio/ogg' });

        blobReader.onloadend = () => {
          const arrayBuffer = blobReader.result;
          this.context.decodeAudioData(arrayBuffer, audioBuffer => {
            this.export.blob = blob;
            this.export.buffer = audioBuffer;
            this.onRecordExportFinish();
          });
        };

        blobReader.readAsArrayBuffer(blob);
        mediaStreamDestination = null;
        chunks = null;
      };

      this.exportMediaRecorder.start();
    },

    downloadBlob(blob, fileName) {
      const a = document.createElement('a');
      a.setAttribute('href', URL.createObjectURL(blob));
      a.setAttribute('download', fileName);
      a.click();
    },

    onFollow() {
      this.followCursor = !this.followCursor;
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

    logInfo() {
      let c = 0;
      let sum = 0;
      let min = 0;
      let max = 0;
      let avg;

      this.clips.forEach(clip => {
        if (clip.sampleRate < min || c === 0) min = clip.sampleRate;
        if (clip.sampleRate > max) max = clip.sampleRate;
        sum += clip.sampleRate;
        avg += clip.sampleDuration;
        c++;
      });
      // console.log('sample min:', min);
      // console.log('sample max:', max);
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
