class Node {
  static context = null;
  static nodeCount = 0;

  constructor(initialGain, nodeRole, nodeType) {
    this.id = ++Node.nodeCount;
    this.gain = initialGain;
    this.minGain = 0;
    this.maxGain = 2;
    this.muted = false;

    this.nodeRol = nodeRole;  //Instrument/Effect
    this.nodeType = nodeType; //The specific node's class name

    this.inputNode = Node.context.createGain();
    this.outputNode = Node.context.createGain();

    this.outputNode.gain.value = initialGain;

    this.saveParams = [
      { version: '1.0.0' },
      { name: 'nodeRol', value: this.nodeRol },
      { name: 'nodeType', value: this.nodeType },
    ];

    this.destroyers = [() => {
      this.outputNode.disconnect();
      this.outputNode = null;
      this.inputNode.disconnect();
      this.inputNode = null;

      if (this.node) {
        this.node.disconnect();
        this.node = null;
      }
    }];
  }

  destroy() {
    this.destroyers.forEach(destroyer => { destroyer(); });
  }

  connect(Node) {
    this.outputNode.connect(Node.inputNode);
    return Node;
  }

  disconnect() {
    this.outputNode.disconnect();
    return this;
  }

  setGain(value) {
    this.gain = value;
    if (!this.muted)
      this.outputNode.gain.setValueAtTime(value, 0);
  }

  setMute(muted) {
    this.muted = muted;
    if (muted) this.outputNode.gain.setValueAtTime(0, 0);
    else this.outputNode.gain.setValueAtTime(this.gain, 0);
  }

  toggleMute() {
    this.muted = !this.muted;
    this.setMute(this.muted);
  }
}

module.exports = Node;