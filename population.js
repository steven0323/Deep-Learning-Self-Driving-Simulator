class Population {

  constructor(populationSize, nnLayout, minW, maxW, maxI, ipRange, mutation, randomness, maxTime, fr) {
    this.pop = [];
    this.popSize = populationSize
    this.alive = populationSize;
    this.randomness = randomness;

    this.nnLayout = nnLayout;
    this.minW = minW;
    this.maxW = maxW;
    this.maxI = maxI;
    this.mutation = mutation;

    this.ipRange = ipRange;
    this.startPos = createVector(width / 2, height / 2);
    this.angle = 0;
    this.chkpts = [];

    this.maxTime = maxTime;
    this.time = 0;
    this.timeCntr = 0;
    this.fr = fr;

    this.genCount = 1;
    this.best = undefined;

    this.trainingData = {};

    for (let i = 0; i < populationSize; i++) {
      this.pop.push(new Car(nnLayout, minW, maxW, maxI, ipRange));
    }

  }

  getParents(total_score, best_index) {
  	var parent1, parent2;
  	var p1 = random();
  	var p2 = random();
  	var p = 0;
  	var i1 = -1;
  	var bi = 0;
  	var flag1 = true, flag2 = true;
  	if(this.best.score == total_score) {
  		//print("best = total!");
  		parent1 = this.best;
  		parent2 = this.pop[floor(random(this.popSize))];
  		bi = 1;
  	} else {
  		let cntr = 0;
	  	for(let i = 0; i < this.popSize && (flag1 || flag2); i++) {
	  		if(this.pop[i].score > 0) {
	  			p += (this.pop[i].score/total_score);
		  		if(flag1 && p1 <= p) {
		  			parent1 = this.pop[i];
		  			flag1 = false;
		  			i1 = i;
		  			if(i == best_index) {
		  				bi = 1;
		  			}
		  		}
		  		if(flag2 && p2 <= p) {
		  			if(cntr > 50) {
		  				//print("Cntr exceeded!!!");
		  				parent2 = new Car(this.nnLayout, this.minW, this.maxW, this.maxI, this.ipRange);
		  				flag2 = false;
		  			} else if(i1 == i) {
		  				i = -1;
		  				p = 0;
		  				p2 = random();
		  				cntr++;
		  			} else {
		  				parent2 = this.pop[i];
		  				flag2 = false;
		  				if(i == best_index) {
			  				bi = 1;
			  			}
		  			}
		  		}
	  		}
  		}
  	}

  	return {
  		par1: parent1,
  		par2: parent2,
  		bi: bi
  	};

  }

  newGeneration(total_score, best_index) {
  	print("Total Score", total_score);
  	var newPop = [];
  	var bestIndexSelected = 0;
  	if(!(total_score == NaN || total_score == undefined || total_score == 0)) {
  		//print("in total_score", total_score);
  		print("Best Checkpoints Crossed", this.best.chkpt_crossed);
  		var n = this.popSize - round(this.popSize * this.randomness / 100) - 1;
	  	newPop.push(this.best);
	  	//print(n);
	  	for(let i = 0; i < n; i++) {
			let parents = this.getParents(total_score, best_index);
			bestIndexSelected += parents.bi;
			newPop.push(new Car(this.nnLayout, this.minW, this.maxW, this.maxI, this.ipRange));
			//print(newPop.length, i);
			//print(parents.par1, parents.par2);
			newPop[i+1].network.crossover(parents.par1.network, parents.par2.network, this.mutation);
	  	}
	  	newPop[0].reset(this.nnLayout, this.maxI, this.ipRange);
  	}
  	print("Best Car selected", bestIndexSelected, "times!");
  	this.trainingData[this.genCount.toString()].bestCarSelected = bestIndexSelected;
  	
  	while(newPop.length != this.popSize) {
  		newPop.push(new Car(this.nnLayout, this.minW, this.maxW, this.maxI, this.ipRange));
  	}

  	this.pop = [];
  	for(let i = 0; i < this.popSize; i++) {
  		this.pop.push(newPop.shift());
  		this.pop[i].pos.x = this.startPos.x;
      	this.pop[i].pos.y = this.startPos.y;
      	this.pop[i].angle = this.angle;
      	for (let j = 0; j < this.chkpts.length; j++) {
	      this.pop[i].addChkpts_rem(this.chkpts[j].concat());
	    }
  	}
  	print("");
  	this.genCount++;
  }

  killGeneration() {
  	print("--------- Generation", this.genCount, "---------");
  	print('Killing Generation!');
  	var total_score = 0;
    var max_score_index = 0;
    var max_score = 0;
    var tempBest = null;
    this.alive = this.popSize;
    for (let i = 0; i < this.pop.length; i++) {
    	//this.pop[i].crashed = true;
    	if(this.pop[i].crashed)
    		this.alive--;
    	this.pop[i].calculateScore(this.best);
		if(this.pop[i].score > max_score) {
			max_score = this.pop[i].score;
			max_score_index = i;
			tempBest = this.pop[i];
		}
		total_score += this.pop[i].score;
    }
	print('Best Score', max_score);
	this.time = 0;
	this.timeCntr = 0;
	this.best = tempBest;
	let gc = this.genCount.toString();
	this.trainingData[gc] = {};
	this.trainingData[gc].alive = this.alive;
	this.trainingData[gc].dead = this.popSize - this.alive;
	this.trainingData[gc].totalScore = total_score;
	this.trainingData[gc].maxScore = max_score;
	if(this.best)
		this.trainingData[gc].checkpointRecord = this.best.chkpt_crossed;
	else
		this.trainingData[gc].checkpointRecord = 0;
	this.trainingData[gc].totalCheckpoints = floor(this.chkpts.length / 2);
	this.newGeneration(total_score, max_score_index);
  }

  simulate(entire, view) {
  	this.timeCntr++;
  	this.time = floor(this.timeCntr/this.fr);
    this.alive = 0;
    var total_score = 0;
    var max_score_index = 0;
    var max_score = 0;
    var see = true;
    var tempBest = null;
    for (let i = 0; i < this.pop.length; i++) {
    	if(this.pop[i].crashed) {
    		if(this.pop[i].score > max_score) {
    			max_score = this.pop[i].score;
    			max_score_index = i;
    			tempBest = this.pop[i];
    		}
    		total_score += this.pop[i].score;
    	} else {
        	this.pop[i].drive(see, view, (this.timeCntr/this.fr), this.best);
	        if(!entire)
	        	see = false;
	        this.alive++;
      	}
    }
    if(this.alive == 0) {
    	print("--------- Generation", this.genCount, "---------");
    	print("Died Out!");
    	print('Best Score', max_score);
    	this.time = 0;
    	this.timeCntr = 0;
    	this.best = tempBest;
    	let gc = this.genCount.toString();
    	this.trainingData[gc] = {};
    	this.trainingData[gc].alive = 0;
    	this.trainingData[gc].dead = this.popSize;
    	this.trainingData[gc].totalScore = total_score;
    	this.trainingData[gc].maxScore = max_score;
    	if(this.best)
			this.trainingData[gc].checkpointRecord = this.best.chkpt_crossed;
		else
			this.trainingData[gc].checkpointRecord = 0;
    	this.trainingData[gc].totalCheckpoints = floor(this.chkpts.length / 2);
    	this.newGeneration(total_score, max_score_index);
    } else if(this.time >= this.maxTime) {
    	this.killGeneration();
    }

  }

  show(entire, view) {
    for (let i = 0; i < this.pop.length; i++) {
      if (!this.pop[i].crashed) {
        this.pop[i].show(view);
        if(!entire)
        	break;
      }
    }
  }

  setStartPos(x, y) {
    this.startPos.x = x;
    this.startPos.y = y;
    for (let i = 0; i < this.pop.length; i++) {
      this.pop[i].pos.x = x;
      this.pop[i].pos.y = y;
    }
  }

  setStartAngle(x, y) {
    var xdiff = x - this.pop[0].pos.x;
    var ydiff = y - this.pop[0].pos.y;
    translate(this.pop[0].pos.x, this.pop[0].pos.y);
    angleMode(DEGREES);
    var angle = 0
    if (xdiff == 0 && ydiff == 0)
      angle = 0;
    angle = atan2(ydiff, xdiff) + 90;
    this.angle = angle;
    for (let i = 0; i < this.pop.length; i++) {
      this.pop[i].angle = angle;
    }
  }

  addChkpts_rem(val) {
    this.chkpts.push(val.concat());
    for (let i = 0; i < this.pop.length; i++) {
      this.pop[i].addChkpts_rem(val.concat());
    }
  }

  resetWeights() {
  	this.pop = [];
  	for (let i = 0; i < this.popSize; i++) {
  		this.pop.push(new Car(this.nnLayout, this.minW, this.maxW, this.maxI, this.ipRange));
    	for(let j = 0; j < this.chkpts.length; j++) {
    		this.pop[i].addChkpts_rem(this.chkpts[j].concat());
    	}
    }
  }

  resetCheckpoints() {
  	this.chkpts = [];
  	for (let i = 0; i < this.pop.length; i++) {
      this.pop[i].chkpts_rem = [];
      this.pop[i].chkpts_com = [];
      this.pop[i].chkpt_crossed = 0;
      this.pop[i].chkpts = 0;
    }
  }

}