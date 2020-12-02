class Layer {

  constructor(numberOfNeurons) {
    this.neurons = [];
    for (var i = 0; i < numberOfNeurons; i++) {
      this.neurons.push(new Neuron());
    }
  }

}