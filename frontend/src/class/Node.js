class Node {
  static context = null
  static nextBeatTime = 0
  static lastBeatTime = 0

  constructor(name) {
    this.name = name || "Some Node"
    this.node = null
    this.nodeType = ""

    this.muted = false

    this.outputNode = null

    this.minGain = 0
    this.maxGain = 3
    this.gain = 1
    this.gainStep = 0.01

    this.audioParams = []
    this.outputs = []
  }

  destroy(haventOwnNode) {
    this.outputNode.disconnect()

    this.outputs = null
    this.audioParams = null

    if (!haventOwnNode) {
      this.node.disconnect()
      this.node = null
    }

    this.outputNode = null
  }

  connect(Node) {
    this.outputNode.connect(Node.node)
    this.outputs.push({ name: Node.name, node: Node.node })
    return Node
  }

  connectNativeNode(node, name) {
    this.outputNode.connect(node)
    this.outputs.push({ node, name: name || "Some Native Node" })
    return node
  }

  disconnect() {
    this.outputs.forEach(o => {
      this.disconnectOutput(o.node)
    })
    return this
  }

  disconnectOutput(output) {
    this.outputNode.disconnect(output.node)
    const index = this.outputs.findIndex(o => o.name === output.name)
    this.outputs.splice(index, 1)
  }

  // disconnectNativeOutput(node) {
  //   this.outputNode.disconnect(node)
  //   const index = this.outputs.findIndex(o => o.name === output.name)
  //   this.outputs.splice(index, 1)
  // }

  initGain(initialGain) {
    this.gain = initialGain || 1

    this.level = Node.context.createGain()
    this.level.gain.setValueAtTime(this.gain, 0)
    this.outputNode = this.level

    this.node.connect(this.outputNode)
  }

  setAudioParam(indexOrName, value) {
    let index = indexOrName
    if (typeof (indexOrName) !== 'number') index = this.audioParams.findIndex(ap => ap.name === indexOrName)

    let curvedValue = parseFloat(value)
    // console.log(curvedValue)
    // if (curvedValue <= 2000) {
    //   curvedValue = curvedValue.map(0, 2000, 0, 1000)
    // } else if (curvedValue <= 4000) {
    //   curvedValue = curvedValue.map(2001, 4000, 1001, 4000)
    // } else {
    //   curvedValue = curvedValue.map(4001, 7000, 4001, 7000)
    // }

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

  setGain(value, time) {
    const t = time || Node.context.currentTime
    this.gain = value
    if (!this.muted)
      this.outputNode.gain.setValueAtTime(value, t)
  }

  setMute(muted) {
    this.muted = muted
    if (muted) this.outputNode.gain.setValueAtTime(0, 0)
    else this.outputNode.gain.setValueAtTime(this.gain, 0)
  }

  toggleMute() {
    this.muted = !this.muted
    this.setMute(this.muted)
    // if (this.muted) this.outputNode.gain.setValueAtTime(0, 0)
    // else this.outputNode.gain.setValueAtTime(this.gain, 0)
  }

  setType(type) {
    this.node.type = type
    this.type = type //test
  }

  getAudioParams(exludedKeys) {
    this.audioParams = []
    for (let key in this.node) {
      if (this.node[key])
        if (this.node[key].toString().includes("AudioParam") && !this.keyExcluded(exludedKeys, key))
          this.audioParams.push({
            name: key,
            step: 0.1,
            minValue: this.node[key].minValue,
            maxValue: this.node[key].maxValue,
            value: this.node[key].value,
            defaultValue: this.node[key].defaultValue,
          })
    }
  }

  initParams(audioParamsConfig) {
    this.audioParams.forEach(ap => {
      const index = audioParamsConfig.findIndex(apc => apc.name === ap.name)
      for (let key in ap)
        ap[key] = audioParamsConfig[index][key]

      ap.unit = audioParamsConfig[index].unit
      ap.displayName = audioParamsConfig[index].displayName
    })
  }

  keyExcluded(excludedKeys, key) {
    if (!excludedKeys) return false
    const index = excludedKeys.findIndex(ek => ek === key)
    if (index === -1) return false
    else return true
  }
}

module.exports = Node