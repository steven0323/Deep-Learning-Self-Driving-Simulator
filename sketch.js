//====================VARIABLES IN CODE======================
var input_sensors = 8;
const opLayer = 6;
var input_range = 150.0;
var networkArchitecture = [input_sensors, 10, 8, 7, opLayer]; //output must always be 6!
var minWeightVal = -2;
var maxWeightVal = 2;
var maxInputVal = 1; //Input will be from [0, maxInputVal]

var populationSize = 1000;
var max_time_alive = 30; //In seconds

var rand_pop_pct = 5;  //PERCENTAGE VALUE for variance for car overall
var mutation_rate = 5; //PERCENTAGE VALUE for variance weights during crossover

var mapFileName = 'map (1).json';
var modelFileName = 'model.json';
var trainingDataFileName = 'data.json';

var screenHeight = 1080;
var screenWidth = 700;
//===========================================================

var fr = 60;

var population;
var walls1 = [];
var walls2 = [];

var pause = false;
var builderMode = true;
var waller = false;
var side = true;
var startp = false;
var starta = false;
var checkpoint = false;
var viewMetrics = false;
var entire = false;

var loadJSONobj = null;

function setup() {
  frameRate(fr);
  createCanvas(screenHeight, screenWidth);
  population = new Population(populationSize, networkArchitecture, minWeightVal, maxWeightVal, maxInputVal, input_range, mutation_rate, rand_pop_pct, max_time_alive, fr);
}

function draw() {
  background(220);
  showTrack();

  //SHOW POPULATION COUNT
  textSize(16);
  text('Population: ', 10, 20);
  text(population.alive, 100, 20);
  text('Time:', 10, 45);
  text(population.time, 100, 45);
  text('/ ' + max_time_alive.toString(), 130, 45);
  text('Generation:', 10, 70);
  text(population.genCount, 100, 70);


  if (pause)
    population.show(entire, viewMetrics)
  else if (!builderMode) {
    population.simulate(entire, viewMetrics);
  }
}

function completeModelUpload() {
  //print('loadJSONobj', loadJSONobj);
  //print('pop', population.pop[0]);
  population.pop[0].network.loadNetworkJSON(loadJSONobj);
  print("Upload complete!");
}

function completeMapUpload() {
  walls1 = [];
  walls2 = [];
  walls1 = loadJSONobj.walls1;
  walls2 = loadJSONobj.walls2;
  population.resetCheckpoints();
  for(let i = 0; i < loadJSONobj.checkpoints.length; i++) {
    population.addChkpts_rem(loadJSONobj.checkpoints[i].slice());
  }
}

function keyPressed() {

  switch (key) {
    case 'a':
    case 'A':
      print('Save Map!');
      var mapObj = {};
      mapObj.walls1 = walls1;
      mapObj.walls2 = walls2;
      mapObj.checkpoints = population.chkpts;
      saveJSON(mapObj, mapFileName, true);
      break;

    case 'b':
    case 'B':
      pause = false;
      builderMode = !builderMode;
      print('builder mode!', builderMode);
      break;

    case 'c':
    case 'C':
      if(builderMode) {
        startp = false;
        starta = false;
        waller = false;
        checkpoint = !checkpoint;
        print('checkpoint mode!', checkpoint);
      }
      break;

    case 'd':
    case 'D':
      print('Uploading Map!');
      loadJSONobj = loadJSON('http://127.0.0.1:8887/' + mapFileName, completeMapUpload);
      break;

    case 'e':
    case 'E':
      entire = !entire;
      print('Viewing Entire Population!', entire);
      break;

    case 'k':
    case 'K':
      print('Manually Killing Generation!');
      population.killGeneration();
      break;

    case 'l':
    case 'L':
      if(builderMode) {
        side = !side;
        print('change side!', side);
      }
      break;

    case 'n':
    case 'N':
      print('Saving Training Data Stats!');
      saveJSON(population.trainingData, trainingDataFileName, true);
      break;

    case 'm':
    case 'M':
      print('Saving Best Car Model!');
      if(population.best) {
        var bestNet = population.best.network.getNetworkJSON();
        saveJSON(bestNet, modelFileName, true);
      } else {
        print("Best Car model does not exist!");
      }
      break;

    case 'p':
    case 'P':
      if(!builderMode) {
        pause = !pause;
        print('pause!', pause);
      }
      break;

    /*
    case 'r':
    case 'R':
      startp = false;
      starta = false;
      waller = false;
      checkpoint = false;
      population.resetWeights();
      print('Reset Population!');
      break;
    */

    case 's':
    case 'S':
      if(builderMode) {
        startp = !startp;
        starta = !starta;
        waller = false;
        checkpoint = false;
        print('start position!', startp);
      }
      break;

    case 't':
    case 'T':
      fr -= 2;
      if(fr <= 0)
        fr = 10;
      frameRate(fr);
      print("Decreasing frameRate!", fr);
      break;

    case 'u':
    case 'U':
      print('Uploading Best Car Model!');
      loadJSONobj = loadJSON('http://127.0.0.1:8887/' + modelFileName, completeModelUpload);
      break;

    case 'v':
    case 'V':
      viewMetrics = !viewMetrics;
      print('view mode!', viewMetrics);
      break;

    case 'w':
    case 'W':
      if(builderMode) {
        waller = !waller;
        startp = false;
        starta = false;
        checkpoint = false;
        print('waller mode!', waller);
      }
      break;

    case 'x':
    case 'X':
      if(builderMode) {
        print("Reset Checkpoints!");
        population.resetCheckpoints();
      }
      break;

    case 'y':
    case 'Y':
      fr += 2;
      frameRate(fr);
      print("Increasing frameRate!", fr);
      break;

    case 'z':
    case 'Z':
      if(builderMode) {
        print("Reset Walls!");
        walls1 = [];
        walls2 = [];
      }
      break;

    default:
      // statements_def
      break;
  }
}

function mouseClicked() {
  if (builderMode) {
    if (startp) {
      population.setStartPos(mouseX, mouseY);
      startp = false;
    } else if (starta) {
      population.setStartAngle(mouseX, mouseY);
      starta = false;
    } else if (waller) {
      if (side)
        walls1.push([mouseX, mouseY]);
      else
        walls2.push([mouseX, mouseY]);
    } else if (checkpoint) {
      population.addChkpts_rem([mouseX, mouseY]);
    }
  }
}

function showTrack() {
  let m = max(walls1.length, walls2.length);
  for (i = 1; i < m; i++) {
    if (i < walls1.length)
      line(walls1[i - 1][0], walls1[i - 1][1], walls1[i][0], walls1[i][1]);
    if (i < walls2.length)
      line(walls2[i - 1][0], walls2[i - 1][1], walls2[i][0], walls2[i][1]);
  }

  stroke('rgb(0,200,50)');
  for (i = 1; i < population.chkpts.length; i += 2) {
    line(population.chkpts[i - 1][0], population.chkpts[i - 1][1], population.chkpts[i][0], population.chkpts[i][1]);
  }
  stroke(0);

  if (builderMode) {
    if (waller) {
      if (side) {
        l = walls1.length;
        if (l != 0)
          line(walls1[l - 1][0], walls1[l - 1][1], mouseX, mouseY);
      } else {
        l = walls2.length;
        if (l != 0)
          line(walls2[l - 1][0], walls2[l - 1][1], mouseX, mouseY);
      }
    }

    if (!startp) {
      fill('#fae');
      circle(population.startPos.x, population.startPos.y, 5);
      if (starta)
        line(population.startPos.x, population.startPos.y, mouseX, mouseY);
    }

    if (checkpoint && population.chkpts.length % 2 == 1) {
      stroke('rgba(0,200,50,0.5)');
      line(population.chkpts[population.chkpts.length - 1][0], population.chkpts[population.chkpts.length - 1][1], mouseX, mouseY);
      stroke(0);
    }
  }

}