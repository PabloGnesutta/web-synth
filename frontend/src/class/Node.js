class Node {
  static context = null
  static nextBeatTime = 0
  static lastBeatTime = 0

  constructor(initialGain) {
    this.muted = false
    this.inputNode = Node.context.createGain()
    this.outputNode = Node.context.createGain()
    this.outputs = []

    this.minGain = 0
    this.maxGain = 3
    this.gainStep = 0.01

    this.initGain(initialGain)
  }

  initGain(initialGain) {
    this.gain = initialGain
    this.outputNode.gain.value = initialGain
  }

  destroy() {
    this.disconnect()

    this.outputNode.disconnect()

    this.outputs = null
    this.audioParams = null

    this.inputNode.disconnect()
    this.inputNode = null

    if (this.node) {
      this.node.disconnect()
      this.node = null
    }

    if (this.keepOutputAlive) {
      this.keepOutputAlive.disconnect()
      this.keepOutputAlive = null
    }

    this.outputNode = null
  }

  connect(Node) {
    this.outputNode.connect(Node.inputNode)
    this.outputs.push({ name: Node.name, node: Node.inputNode })
    return Node
  }

  connectNativeNode(node, name) {
    this.outputNode.connect(node)
    this.outputs.push({ node, name: name || "Some Native Node" })
    return node
  }

  disconnect() {
    this.outputs.forEach(o => {
      this.outputNode.disconnect(o.inputNode)
    })
    this.outputs = []
    return this
  }

  setAudioParam(indexOrName, value) {
    let index = indexOrName
    if (typeof (indexOrName) !== 'number') index = this.audioParams.findIndex(ap => ap.name === indexOrName)

    let curvedValue = parseFloat(value)

    const param = this.audioParams[index];
    this.node[param.name].setValueAtTime(curvedValue, 0);
    this.audioParams[index].value = parseFloat(value);
  }

  setInnerNodeAudioParam(indexOrName, value) {
    let index = indexOrName
    if (typeof (indexOrName) !== 'number') index = this.innerNodeAudioParams.findIndex(inap => inap.name === indexOrName)

    const innerNodeAudioParam = this.innerNodeAudioParams[index];
    innerNodeAudioParam.node[innerNodeAudioParam.nodeAudioParam].setValueAtTime(value, 0);
    this.innerNodeAudioParams[index].value = parseFloat(value);
  }

  setCustomParam(index, value) {
    const customParam = this.customParams[index];
    customParam.value = value
    customParam.set(parseFloat(value))
  }

  setGain(value) {
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

  setType(type) {
    this.node.type = type
    this.type = type
  }
}

module.exports = Node