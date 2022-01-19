<template>
  <div class="home-wrapper">
    <div v-if="inited" class="home-inner">
      <!-- Top Section -->
      <div class="top-section">
        <Header
          :ref="'header'"
          @startRec="startRec"
          @stopRec="stopRec"
          @playExport="playExport"
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
        <div class="left-col sidebar-wrapper">
          <Sidebar
            @createInstrument="createInstrument"
            @createEffect="createAndInsertEffect"
            @loadPreset="loadPreset"
            :instrument-is-loaded="!!currentTrack"
          />
        </div>

        <div class="right-col">
          <!-- Click -->
          <div class="click-wrapper"><Click ref="click" /></div>

          <!-- Tracks -->
          <div class="tracks-container custom-scrollbar" :class="{ mapping: mapping }">
            <div class="tracks-list">
              <div
                v-for="(track, t) in tracks"
                :key="track.name"
                class="track"
                :class="{ selected: currentTrackIndex === t, connecting: appConnecting }"
                @click.self="selectTrack(t)"
              >
                <div class="track-inner-left">
                  <div @click="deleteTrack(t)" class="pointer">[X]</div>
                  <div class="select-none" @click="selectTrack(t)">{{ track.name }}</div>
                  <div class="select-none" @click="selectTrack(t)">
                    {{ track.instrument.name }}
                  </div>
                </div>

                <!-- Track Gain and Controls -->
                <GainBody
                  :Node="track.trackGain"
                  :analyser="track.trackGainAnalyser"
                  :recEnabled="track.recEnabled"
                  @knobClicked="knobClicked"
                />
              </div>
            </div>

            <!-- Master -->
            <div class="track master">
              <div class="track-inner-left">Master</div>
              <div class="master-knob-wrapper" @click="knobClicked('MainGain')">
                <Knob
                  :ref="'MainGain'"
                  minVal="0"
                  maxVal="1"
                  :initVal="mainGainKnob"
                  @knobTurned="setMainGainValue"
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

      <!-- Main Gain -->
      <!-- <div class="section-inner main-gain">
        <div class="knob-wrapper" @click="knobClicked('MainGain')">
          <Knob
            :ref="'MainGain'"
            minVal="0"
            maxVal="1"
            :initVal="mainGainKnob"
            @knobTurned="setMainGainValue"
          />
        </div>
        <h3>Main Gain</h3>
      </div> -->
    </div>

    <div v-else class="welcome-msg select-none">
      <p>Welcome to web-synth</p>
      <p>Click anywhere to Start!</p>
    </div>
  </div>
</template>

<script>
const noteFrequencies = require('../data/noteFrequencies');
const totalAmountOfNotes = noteFrequencies.length;
const noteKeys = require('../data/noteKeys');

const Node = require('../class/Node');
// Instruments
const Mic = require('../class/Instruments/Mic');
const Femod = require('../class/Instruments/Femod');
const Surgeon = require('../class/Instruments/Surgeon');
const Carrier = require('../class/Instruments/Carrier');
const Drumkit = require('../class/Instruments/Drumkit');
const Sampler = require('../class/Instruments/Sampler');
const WhiteNoise = require('../class/Instruments/WhiteNoise');
const instrumentsDict = new Map([
  ['Mic', Mic],
  ['Femod', Femod],
  ['Carrier', Carrier],
  ['Drumkit', Drumkit],
  ['Sampler', Sampler],
  ['Surgeon', Surgeon],
  ['WhiteNoise', WhiteNoise],
]);
// Effects
const EQ3 = require('../class/Effects/EQ3');
const Gain = require('../class/Effects/Gain');
const Delay = require('../class/Effects/Delay');
const Distortion = require('../class/Effects/Distortion');
const Reverb = require('../class/Effects/Reverb');
const Looper = require('../class/Effects/Looper');
const Compressor = require('../class/Effects/Compressor');
const BiquadFilter = require('../class/Effects/BiquadFilter');
const effectsDict = new Map([
  ['EQ3', EQ3],
  ['Delay', Delay],
  ['Reverb', Reverb],
  ['Looper', Looper],
  ['Distortion', Distortion],
  ['Compressor', Compressor],
  ['BiquadFilter', BiquadFilter],
]);

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

      mainGain: null,
      bufferGain: null,
      mainGainKnob: 0.5,

      keyEnabled: [],
      keypressListeners: [],
      numpadListeners: [],
      xyPadListeners: [],

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

      octave: 3,
      transpose: 0,

      //keys - could be removed listening to event
      m_pressed: false,
      ctrl_pressed: false,
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

  mounted() {
    this.keyEnabled = Array(222).fill(true);
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(this.onMIDISuccess, this.onMIDIFailure);
    }
    document.querySelector('.home-wrapper').addEventListener('click', this.init);
  },

  methods: {
    ...mapMutations(['setAppIsMapping', 'setContext']),

    toggleRecEnabled(t) {
      this.tracks[t].recEnabled = !this.tracks[t].recEnabled;
    },

    init() {
      this.addConfirmLeaveHandler();
      document.querySelector('.home-wrapper').removeEventListener('click', this.init);
      this.setContext(new (window.AudioContext || window.webkitAudioContext)());
      Node.context = this.context;

      this.createMainGain();

      this.createTrack(new Surgeon());
      this.createAndInsertEffect('BiquadFilter');

      window.addEventListener('keyup', this.onKeyup);
      window.addEventListener('keydown', this.onKeydown);

      this.inited = true;
    },

    createInstrument(className) {
      const Node = new (instrumentsDict.get(className))();
      this.createTrack(Node);
    },

    createTrack(instrument) {
      const trackGain = new Gain('Track Gain');
      const trackCompressor = this.context.createDynamicsCompressor();
      const trackGainAnalyser = this.context.createAnalyser();

      instrument.connect(trackGain);
      // trackGain.connectNativeNode(trackCompressor, 'Track Compressor');
      // trackCompressor.connect(this.bufferGain);
      // trackCompressor.connect(trackGainAnalyser);
      trackGain.connectNativeNode(this.bufferGain, 'Mixer Gain');
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
      // remove track - check if this actually cleans more memory than simply nulling the track
      track.instrument.destroy();
      track.instrument = null;
      track.trackGain.destroy();
      track.trackGain = null;
      track.effects.forEach(effect => {
        effect.destroy();
        effect = null;
      });
      track = null;

      if (trackIndex === this.currentTrackIndex) {
        // todo: ensure to clean analyser node memory
        // console.log(this.currentTrack);
        // console.log(this.currentTrack.trackGainAnalyser);
        this.currentTrackIndex = null;
        this.currentTrack = null;
      }

      this.tracks.splice(trackIndex, 1);
    },

    // Effects:
    createAndInsertEffect(className) {
      const Node = new (effectsDict.get(className))();
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

    createMainGain() {
      this.mainGain = this.context.createGain();
      this.mainGain.gain.value = this.mainGainKnob;
      this.mainGain.connect(this.context.destination);

      this.bufferGain = this.context.createGain();

      this.bufferGain.connect(this.mainGain);
    },

    createMic() {
      const that = this;
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then(function (stream) {
          that.createTrack(new Mic(stream));
        })
        .catch(function (err) {
          console.log('err', err);
          alert("Couldn't get user media, continuing without mic input. Error: " + err);
        });
    },

    setMainGainValue(val) {
      this.mainGain.gain.setValueAtTime(val, 0);
    },

    selectTrack(t) {
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

    onPadTouchCancel(e) {
      console.log('onPadTouchCancel', e);
    },
    onPadTouchMove(e) {
      console.log('onPadTouchMove', e);
    },

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
      //m
      if (keyCode === 77) this.m_pressed = true;
      //ctrl
      else if (keyCode === 17) this.ctrl_pressed = true;
      //1 a 9 numpad:
      else if (keyCode >= 97 && keyCode <= 105) {
        this.numpadListeners.forEach(scaleInterface => {
          scaleInterface.instrument.playNote(parseInt(key));
        });
      }
    },

    onOtherKeyup({ keyCode }) {
      //1 a 9
      if (keyCode >= 49 && keyCode <= 57) {
        if (this.m_pressed) this.tracks[+key - 1].trackGain.toggleMute();
      } else {
        switch (keyCode) {
          case 77: //m
            this.m_pressed = false;
            if (this.ctrl_pressed) this.currentTrack.trackGain.toggleMute();
            break;
          case 81: //q
            if (this.ctrl_pressed) this.deleteTrack(this.currentTrackIndex);
            break;
          case 17: //ctrl
            this.ctrl_pressed = false;
            break;
          case 27: //esc
            this.$refs.header.hideMenues();
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
        const existingMap = this.maps.find(m => m.refName === refName);
        if (!existingMap) {
          this.maps.push({
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
          const mappedItem = this.maps.find(m => m.cmd === status && m.note === note);
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
      if (saveString.nodeRol === 'Instrument') this.loadInstrument(saveString);
      else this.loadEffect(saveString);
    },

    loadInstrument(instSaveString) {
      const instrument = new (instrumentsDict.get(instSaveString.nodeType))(instSaveString);
      this.createTrack(instrument);
    },

    loadEffect(effectSaveString) {
      const effect = new (effectsDict.get(effectSaveString.nodeType))(effectSaveString);
      this.insertEffect(effect);
    },

    // REC

    startRec() {
      const recordingTracks = this.tracks.filter(t => t.recEnabled);
      const total = recordingTracks.length;
      let c = 0;

      this.recordingCount++;
      this.recording = true;
      this.renderFinished = false;

      // record entire mix

      this.chunks = [];
      this.exportDestination = this.context.createMediaStreamDestination();
      this.mainGain.connect(this.exportDestination);

      this.exportMediaRecorder = new MediaRecorder(this.exportDestination.stream);

      this.exportMediaRecorder.ondataavailable = evt => {
        this.chunks.push(evt.data);
      };

      this.exportMediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: 'audio/ogg; codecs=opus',
        });

        this.exportBlobs.push(blob);

        // PARA UPLOAD:
        // const audioFile = new File([blob], "audio.ogg", {
        //   type: 'audio/ogg; codecs="opus"',
        // });

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

      console.log('rec start');

      //record each track

      recordingTracks.forEach((t, i) => {
        let chunks = [];
        let dest = this.context.createMediaStreamDestination();
        t.trackGain.connectNativeNode(dest);

        let mediaRecorder = new MediaRecorder(dest.stream);
        this.mediaRecorders.push(mediaRecorder);

        mediaRecorder.ondataavailable = evt => {
          chunks.push(evt.data);
        };

        mediaRecorder.onstop = evt => {
          const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
          chunks = null;

          const fileReader = new FileReader();

          fileReader.onloadend = () => {
            const arrayBuffer = fileReader.result;

            this.context.decodeAudioData(arrayBuffer, audioBuffer => {
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
      this.mediaRecorders.forEach(mr => {
        mr.stop();
      });
      this.mediaRecorders = [];
      this.recording = false;
    },

    recordingsReady() {
      const name = prompt('Recording Name', 'Recording Nº ' + this.recordingCount);
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

    playExport() {
      let index = prompt(
        'Which recording do you want to play? Choose number: 1 to ' + this.recordings.length,
        1
      );
      index = parseInt(index);

      if (!index) return alert('Only numers from 1 to ' + this.recordings.length);

      if (index > this.recordings.length || index < 1) return alert('There is no such recording!');

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
      this.recordings[index].scene.forEach(s => {
        // const source = this.context.createBufferSource();
        // source.buffer = s.audioBuffer;
        // source.connect(this.mainGain);
        // source.start();
        console.log('trackId: ' + s.trackId + ' - download URL: ' + URL.createObjectURL(s.blob));
      });
    },

    stopPlayingExport() {
      this.exportSource.stop(0);
      this.playing = false;
    },

    downloadBlob(blob, fileName) {
      const a = document.createElement('a');
      a.setAttribute('href', URL.createObjectURL(blob));
      a.setAttribute('download', fileName);
      a.click();
    },

    getCssNodeName(name) {
      return name.replace(new RegExp(' ', 'g'), '-');
    },

    addConfirmLeaveHandler() {
      window.onbeforeunload = function (e) {
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
  // width: 100%;
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
  gap: 0.5em;

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

.master {
  padding: 0.75rem 0.5rem;
}
.master-knob-wrapper {
  margin-right: 1rem;
}

// .main-gain {
//   position: fixed;
//   bottom: 5px;
//   right: 5px;
//   background: #222;
//   color: #f3f3f3;
//   padding: 0.75rem;
//   border: 1px solid #666;
//   h3 {
//     font-size: 1rem;
//     margin-top: 1rem;
//     user-select: none;
//   }
// }

.welcome-msg {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
}
</style>
