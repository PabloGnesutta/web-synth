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

  destroy() {
    this.outputNode.disconnect()

    this.outputs = null
    this.audioParams = null

    this.node.disconnect()
    this.node = null
    this.outputNode = null
  }

  connect(Node) {
    this.outputNode.connect(Node.node)
    this.outputs.push({ name: Node.name, node: Node.node })
  }

  connectNativeNode(node, name) {
    this.outputNode.connect(node)
    this.outputs.push({ node, name: name || "Some Native Node" })
  }

  connectAudioParam(Node, audioParam) {
    this.outputNode.connect(Node.node[audioParam.name])
    this.outputs.push({ name: Node.name + ' ' + audioParam.name, node: Node.node[audioParam.name] })
  }

  connectCustomParam(Node, customParam, cpIndex) {
    const param = Node.customParams[cpIndex]
    const destination = param.node[param.nodeAudioParam]
    this.outputNode.connect(destination)
    this.outputs.push({ name: Node.name + ' ' + param.name, node: destination })
  }

  connectOutputNode(Node) { //outuputNode = level gainNode
    this.outputNode.connect(Node.outputNode)
    this.outputs.push({ name: Node.name + ' Level', node: Node.outputNode })
  }

  // al conectar el delay, el delay se conecta automáticamente al primer output...
  // puede haber casos en que el primer output de este nodo no sea la una ganancia, y puede haber problemas
  // es para evitar tener que conectar manualmente el delay a una ganancia luego de conectarlo a este nodo
  // no se puede conectar a this.outputNode porque genera feedback infinito
  connectDelay(Delay) {
    Delay.connectNativeNode(this.outputs[0].node, this.outputs[0].name)
    this.disconnectOutput(this.outputs[0].node)
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

  setGain(value, time) {
    this.outputNode.gain.setValueAtTime(value, time || 0)
    this.gain = value
  }

  rampGain(value, time) {
    this.outputNode.gain.linearRampToValueAtTime(value, time);
  }

  setTargetGain(value, startTime, endTime) {
    this.outputNode.gain.setTargetAtTime(value, startTime, endTime);
  }

  //debería entender tanto indice como nombre del parámetro
  setAudioParam(index, value) {
    const param = this.audioParams[index];
    this.node[param.name].setValueAtTime(value, 0);
    this.audioParams[index].value = parseFloat(value);
  }

  setCustomParam(index, value) {
    const customParam = this.customParams[index];
    customParam.node[customParam.nodeAudioParam].setValueAtTime(value, 0);
    this.customParams[index].value = parseFloat(value);
  }

  setType(type) {
    this.node.type = type
  }

  getAudioParams(exludedKeys) {
    this.audioParams = []
    for (let key in this.node) {
      if (this.node[key]) {
        if (this.node[key].toString().includes("AudioParam") && !this.keyExcluded(exludedKeys, key)) {
          this.audioParams.push({
            name: key,
            step: 0.1,
            minValue: 0,
            maxValue: 3000,
            value: this.node[key].value,
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