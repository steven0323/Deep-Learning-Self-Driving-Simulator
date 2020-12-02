class Network {

  constructor(layout, minW, maxW) {
    this.layers = [];
    this.minW = minW;
    this.maxW = maxW;
    this.layout = layout;
    layout.forEach((length, index) => {
      let layer = new Layer(length);
      if (index !== 0) {
        layer.neurons.forEach((neuron) => {
          neuron.setBias(neuron.getRandomBias(minW, maxW));
        });
      }
      this.layers.push(layer);
    });
    this.connectLayers(minW, maxW);
  }

  connectLayers(minW, maxW) {
    for (var layer = 1; layer < this.layers.length; layer++) {
      const thisLayer = this.layers[layer];
      const prevLayer = this.layers[layer - 1];
      for (var neuron = 0; neuron < prevLayer.neurons.length; neuron++) {
        for (var thisLayerNeuron = 0; thisLayerNeuron < thisLayer.neurons.length; thisLayerNeuron++) {
          var connection = new Connection(prevLayer.neurons[neuron], thisLayer.neurons[thisLayerNeuron]);
          connection.setWeight(connection.getRandomWeight(minW, maxW));
          thisLayer.neurons[thisLayerNeuron].addInputConnection(connection);
        }
      }
    }
  }

  leakyRelu(val) {
    var ans = 0;
    if (val >= 0) {
      ans = val;
    } else {
      ans = 0.1 * val;
    }
    return ans;
  }

  fwdProp(input) {

    this.layers[0].neurons.forEach((n, i) => {
      n.setOutput(input[i]);
    });

    for (var layer = 1; layer < this.layers.length; layer++) {
      for (var neuron = 0; neuron < this.layers[layer].neurons.length; neuron++) {
        let op = this.layers[layer].neurons[neuron].bias;
        op += this.layers[layer].neurons[neuron].ipConnections.reduce((total, conn) => {
          return total + (conn.weight * conn.from.output);
        }, 0);
        this.layers[layer].neurons[neuron].setOutput(this.leakyRelu(op));
      }
    }

    var output = [];
    this.layers[this.layers.length - 1].neurons.forEach((n) => {
      output.push(n.output);
    });

    return output;

  }

  crossover(network1, network2, mutation) {

    for (var layer = 1; layer < this.layers.length; layer++) {
      for (var neuron = 0; neuron < this.layers[layer].neurons.length; neuron++) {
        let pb = random(100);
        if(pb < mutation) {
          this.layers[layer].neurons[neuron].setBias(this.layers[layer].neurons[neuron].getRandomBias(this.minW, this.maxW));
        } else if(pb < ((100-mutation)/2)) {
          this.layers[layer].neurons[neuron].setBias(network1.layers[layer].neurons[neuron].bias);
        } else {
          this.layers[layer].neurons[neuron].setBias(network2.layers[layer].neurons[neuron].bias)
        }
        
        this.layers[layer].neurons[neuron].ipConnections.forEach((conn, index) => {
          let p = random(100);
          if(p < mutation) {
            conn.setWeight(conn.getRandomWeight(this.minW, this.maxW));
          } else if(p < ((100-mutation)/2)) {
            conn.setWeight(network1.layers[layer].neurons[neuron].ipConnections[index].weight);
          } else {
            conn.setWeight(network2.layers[layer].neurons[neuron].ipConnections[index].weight);
          }
        });
      }
    }

  }

  getNetworkJSON() {
    var netObj = {};
    netObj.layout = this.layout.slice();
    netObj.weights = {};
    for (var layer = 1; layer < this.layers.length; layer++) {
      let l = layer.toString();
      netObj.weights[l] = {};
      for (var neuron = 0; neuron < this.layers[layer].neurons.length; neuron++) {
        let op = this.layers[layer].neurons[neuron].bias;
        let n = neuron.toString();
        netObj.weights[l][n] = {};
        netObj.weights[l][n]['-1'] = op;
        this.layers[layer].neurons[neuron].ipConnections.forEach((conn, index) => {
          netObj.weights[l][n][index.toString()] = conn.weight;
        });
      }
    }
    return netObj;
  }

  checkEqualArrays(a1, a2) {
    if(a1.length != a2.length)
      return false;
    
    for(let i = 0; i < a1.length; i++) {
      if(a1[i] != a2[i])
        return false;
    }

    return true;
  }

  loadNetworkJSON(netObj) {
    //print('netobj', netObj.layout.slice());
    //print('this', this.layout.slice());
    if(this.checkEqualArrays(netObj.layout.slice(), this.layout.slice())) {
      for (var layer = 1; layer < this.layers.length; layer++) {
        let l = layer.toString();
        for (var neuron = 0; neuron < this.layers[layer].neurons.length; neuron++) {
          let n = neuron.toString();
          this.layers[layer].neurons[neuron].setBias(netObj.weights[l][n]['-1']);
          this.layers[layer].neurons[neuron].ipConnections.forEach((conn, index) => {
            conn.setWeight(netObj.weights[l][n][index.toString()]);
          });
        }
      }
    } else {
      print("Network Architectures do not match!", netObj.layout, this.layout);
    }
  }

}