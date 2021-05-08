class Node {
  static context = null
  static nextBeatTime = 0
  static lastBeatTime = 0

  constructor(initialGain) {
    this.muted = false
    this.inputNode = Node.context.createGain()
    this.outputNode = Node.context.createGain()
    this.outputs = []

    this.initGain(initialGain)
  }

  initGain(initialGain) {
    this.gain = initialGain
    this.outputNode.gain.value = initialGain

    this.minGain = 0
    this.maxGain = 3
    this.gainStep = 0.01
  }

  destroy() {
    this.disconnect()

    if (this.audioParams) this.audioParams = null
    if (this.customParams) this.customParams = null
    if (this.modulationParams) this.modulationParams = null
    if (this.innerNodeAudioParams) this.innerNodeAudioParams = null

    if (this.node) this.node = null

    this.inputNode = null
    this.outputNode = null
  }

  connect(Node) {
    this.outputNode.connect(Node.inputNode)
    this.outputs.push({ name: Node.name, node: Node.inputNode })
    return Node
  }

  disconnect() {
    this.outputs.forEach(o => {
      this.outputNode.disconnect(o.inputNode)
    })
    this.outputNode.disconnect()
    this.outputs = []
    return this
  }

  setGain(value) {
    console.log('setgain', value)
    this.gain = value
    if (!this.muted)
      this.outputNode.gain.setValueAtTime(value, 0)
  }

  setMute(muted) {
    this.muted = muted
    if (muted) this.outputNode.gain.setValueAtTime(0, 0)
    else this.outputNode.gain.setValueAtTime(this.gain, 0)
  }

  toggleMute() {
    this.muted = !this.muted
    this.setMute(this.muted)
  }
}

module.exports = Node