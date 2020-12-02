class Neuron {

  constructor() {
    this.ipConnections = [];
    this.bias = 0;
    this.output = 0;
  }

  getRandomBias(min, max) {
    return random(min, max);
  }

  addInputConnection(connection) {
    this.ipConnections.push(connection)
  }

  setBias(val) {
    this.bias = val
  }

  setOutput(val) {
    this.output = val
  }

}