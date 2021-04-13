class Node {
  static context = null

  constructor(name) {
    this.name = name || "Some Node"
    this.node = null
    this.nodeType = ""

    this.outputNode = null

    this.minGain = 0
    this.maxGain = 1
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
  }

  disconnect() {
    this.outputs.forEach(o => {
      this.disconnectOutput(o.node)
    })
    // this.disconnectOutput(this.outputs[0].node)
    return this
  }

  disconnectOutput(output) {
    this.outputNode.disconnect(output.node)
    const index = this.outputs.findIndex(o => o.name === output.name)
    this.outputs.splice(index, 1)
  }

  disconnectNativeOutput(node) {
    this.outputNode.disconnect(node)
    const index = this.outputs.findIndex(o => o.name === output.name)
    this.outputs.splice(index, 1)
  }

  initGain(initialGain) {
    this.gain = initialGain || 1

    this.level = Node.context.createGain()
    this.level.gain.setValueAtTime(this.gain, 0)
    this.outputNode = this.level

    this.node.connect(this.outputNode)
  }



  setInnerNodeAudioParam(index, value) {
    const innerNodeAudioParam = this.innerNodeAudioParams[index];
    innerNodeAudioParam.node[innerNodeAudioParam.nodeAudioParam].setValueAtTime(value, 0);
    this.innerNodeAudioParams[index].value = parseFloat(value);
  }

  setCustomParam(index, value) {
    const innerNodeAudioParam = this.customParams[index];
    innerNodeAudioParam.value = value
    innerNodeAudioParam.set(parseFloat(value))
  }



  // connectDelay(Delay) {
  //   Delay.connectNativeNode(this.outputs[0].node, this.outputs[0].name)
  //   this.disconnectOutput(this.outputs[0].node)
  // }

  setGain(value, time) {
    this.outputNode.gain.setValueAtTime(value, time || 0)
    this.gain = value
  }

  //debería entender tanto indice como nombre del parámetro
  setAudioParam(index, value) {
    const param = this.audioParams[index];
    let curvedValue = parseFloat(value)
    // console.log(curvedValue)
    // if (curvedValue <= 2000) {
    //   curvedValue = curvedValue.map(0, 2000, 0, 1000)
    // } else if (curvedValue <= 4000) {
    //   curvedValue = curvedValue.map(2001, 4000, 1000, 4000)
    // } else {
    //   curvedValue = curvedValue.map(4001, 7000, 4000, 7000)
    // }
    this.node[param.name].setValueAtTime(curvedValue, 0);
    this.audioParams[index].value = parseFloat(value);
  }

  setType(type) {
    this.node.type = type
    this.type = type //test
  }

  getAudioParams(exludedKeys) {
    this.audioParams = []
    for (let key in this.node) {
      if (this.node[key]) {
        if (this.node[key].toString().includes("AudioParam") && !this.keyExcluded(exludedKeys, key)) {
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
    }
  }

  setMinMaxStep(minMaxStep) {
    this.audioParams.forEach(ap => {
      const index = minMaxStep.findIndex(mms => mms.name === ap.name)
      for (let key in ap) {
        ap[key] = minMaxStep[index][key]
      }
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