class Connection {

  constructor(from, to) {
    this.from = from;
    this.to = to;
    this.weight = 0;
  }

  setWeight(w) {
    this.weight = w;
  }

  getRandomWeight(min, max) {
  	return random(min, max);
  }

}