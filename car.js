class Car {

  constructor(nnLayout, minW, maxW, maxI, ipRange) {
    this.carW = 10;
    this.carH = 20;
    this.carCurve = 2.5;
    if(ipRange == 0)
      ipRange = 100;
    this.visibility = ipRange;
    if(nnLayout[0] == 0)
      nnLayout[0] = 8;
    this.sensors = nnLayout[0];
    this.color = color(255, 204, 0);

    this.pos = createVector(width / 2, height / 2);

    this.vel = 0;
    this.maxVel = 5.0;
    this.minVel = -2.0;
    this.vel_vec = createVector();

    this.turnr = 1.0;
    this.turncnt = 0.0;
    this.turn = false;
    this.maxTurn = 2.0;
    this.angle = 0;

    this.dists = [];
    
    this.chkpts_rem = [];
    this.chkpts_com = [];
    this.chkpt_crossed = 0;
    this.chkpts = 0;
    this.chkptTime = 0;
    this.crashed = false;
    if(minW == maxW) {
      minW = -1;
      maxW = 1;
    }
    this.network = new Network(nnLayout, minW, maxW);
    if(maxI <= 0)
      maxI = 1;
    this.maxInput = maxI;

    this.score = 0;
  }

  addChkpts_rem(val) {
    this.chkpts_rem.push(val);
    //this.chkpts = floor(this.chkpts_rem.length/2);
  }

  drive(see, view, time, best) {
    this.progress(time); //detects if crashed and checkpoints crossed
    this.sense(); //detects dist
    if(see)
      this.show(view);
    var actions = this.network.fwdProp(this.dists);
    this.engine(actions);
    this.update();
  }

  update() {
    this.vel_vec.x = this.vel * sin(this.angle);
    this.vel_vec.y = -1 * this.vel * cos(this.angle);
    let oldpos = this.pos.copy();
    this.pos.add(this.vel_vec);
    let newpos = this.pos.copy();
    this.turncnt += newpos.sub(oldpos).mag();
    if (this.turncnt >= this.turnr) {
      this.turn = true;
    }
  }

  show(view) {
    push();
    translate(this.pos.x, this.pos.y);
    angleMode(DEGREES);
    rotate(this.angle);
    rectMode(CENTER);
    strokeWeight(0.5);
    fill(this.color);
    rect(0, 0, this.carW, this.carH, this.carCurve, this.carCurve, 0, 0);
    if(view) {
      let rr = 360 / this.sensors;
      for (i = 0; i < this.sensors; i++) {
        strokeWeight(2);
        stroke(255, 255, 255);
        line(0, 0, 0, -this.visibility);
        //print(this.dists[i]);
        if(this.dists[i] != 1) {
          fill(255, 255, 255);
          stroke(0);
          strokeWeight(1);
          circle(0, -this.dists[i] * this.visibility / this.maxInput, 7);
          noFill(); 
        }
        rotate(rr);
      } 
    }
    pop();
  }

  line_intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    var ua, ub, denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    if (denom == 0) {
      return null;
    }
    ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (!(ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1)) {
      return null;
    }

    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1)
    };
  }

  progress(time, best) {

    let rectDiag = sqrt(sq(this.carW / 2) + sq(this.carH / 2));
    let rectAngle = atan2(this.carH / 2, this.carW / 2);
    let c1 = rectDiag * cos(-rectAngle + this.angle);
    let s1 = rectDiag * sin(-rectAngle + this.angle);
    let c2 = rectDiag * cos(rectAngle + this.angle);
    let s2 = rectDiag * sin(rectAngle + this.angle);
    let cx = [];
    let cy = [];
    // cx1 cy1
    cx.push(this.pos.x - c1);
    cy.push(this.pos.y - s1);

    // cx2 cy2
    cx.push(this.pos.x + c2);
    cy.push(this.pos.y + s2);

    // cx3 cy3
    cx.push(this.pos.x + c1);
    cy.push(this.pos.y + s1);

    // cx4 cy4
    cx.push(this.pos.x - c2);
    cy.push(this.pos.y - s2);

    /* Check if all coordinates are correct
    fill(0, 0, 255);
    circle(cx1, cy1, 5);
    fill('red');
    circle(cx2, cy2, 5);
    fill('#fae');
    circle(cx3, cy3, 5);
    fill('rgb(0,255,0)');
    circle(cx4, cy4, 5);
    noFill();
    */

    //CHECK IF CRASHED
    let m = max(walls1.length, walls2.length);
    this.crashed = false;
    this.color = color(255, 204, 0);
    for (var i = 1; i < m && !this.crashed; i++) {
      if (i < walls1.length) {
        for (var j = 0; j < 4; j++) {
          let intr = this.line_intersect(cx[j], cy[j], cx[(j + 1) % 4], cy[(j + 1) % 4], walls1[i - 1][0], walls1[i - 1][1], walls1[i][0], walls1[i][1]);
          if (intr != null) {
            this.crashed = true;
            this.color = color(255, 0, 0);
            break;
          }
        }
      }

      if (!this.crashed && i < walls2.length) {
        for (var j = 0; j < 4; j++) {
          let intr = this.line_intersect(cx[j], cy[j], cx[(j + 1) % 4], cy[(j + 1) % 4], walls2[i - 1][0], walls2[i - 1][1], walls2[i][0], walls2[i][1]);
          if (intr != null) {
            this.crashed = true;
            this.color = color(255, 0, 0);
            break;
          }
        }
      }
    }

    //CHECK FOR CHECKPOINTS CROSSED
    var flag = true;
    while (flag && this.chkpts_rem.length > 1) {
      flag = false;
      for (var j = 0; j < 4; j++) {
        let intr = this.line_intersect(cx[j], cy[j], cx[(j + 1) % 4], cy[(j + 1) % 4], this.chkpts_rem[0][0], this.chkpts_rem[0][1], this.chkpts_rem[1][0], this.chkpts_rem[1][1]);
        if (intr != null) {
          flag = true;
          this.chkpt_crossed++;
          this.chkptTime = time;
          this.chkpts_com.push(this.chkpts_rem.shift());
          this.chkpts_com.push(this.chkpts_rem.shift());
          break;
        }
      }
    }
    if (this.chkpts_rem.length < 2) {
      this.chkpts_rem.shift();
      this.chkpts_rem = this.chkpts_com.concat();
      this.chkpts_com = [];
    }

    if(this.crashed) {
      this.calculateScore(best);
    }
  } //CHECK IF CRASHED AND HOW MANY CHECKPOINTS CROSSED

  sense() {
    if (this.sensors == 0)
      return null;
    let sx = [];
    let sy = [];
    let rr = 0;
    let aa = 360 / this.sensors;
    for (var i = 0; i < this.sensors; i++) {
      sx.push(this.pos.x + (this.visibility * sin(this.angle + rr)));
      sy.push(this.pos.y + (-this.visibility * cos(this.angle + rr)));
      rr += aa;
    }

    let m = max(walls1.length, walls2.length);
    let d1 = [];
    let p1 = [];
    let d2 = [];
    let p2 = [];

    for (var i = 1; i < m; i++) {
      if (i < walls1.length) {
        for (var j = 0; j < this.sensors; j++) {
          let intr = this.line_intersect(sx[j], sy[j], this.pos.x, this.pos.y, walls1[i - 1][0], walls1[i - 1][1], walls1[i][0], walls1[i][1]);
          if (intr != null) {
            let dd = sqrt(sq(this.pos.x - intr.x) + sq(this.pos.y - intr.y));
            if (dd < d1[j] || d1[j] == undefined || d1[j] == null) {
              d1[j] = dd;
              p1[j] = [intr.x, intr.y];
            }
          }
        }
      }

      if (i < walls2.length) {
        for (var j = 0; j < this.sensors; j++) {
          let intr = this.line_intersect(sx[j], sy[j], this.pos.x, this.pos.y, walls2[i - 1][0], walls2[i - 1][1], walls2[i][0], walls2[i][1]);
          if (intr != null) {
            let dd = sqrt(sq(this.pos.x - intr.x) + sq(this.pos.y - intr.y));
            if (dd < d2[j] || d2[j] == undefined || d2[j] == null) {
              d2[j] = dd;
              p2[j] = [intr.x, intr.y];
            }
          }
        }
      }
    }
  
    for (var i = 0; i < this.sensors; i++) {
      if (d2[i] == undefined || d2[i] == null || d1[i] < d2[i]) {
        if (!(d1[i] == this.visibility || d1[i] == undefined || d1[i] == null)) {
          d1[i] = (d1[i] * this.maxInput) / this.visibility;
        } else {
          d1[i] = this.maxInput;
        }
      } else {
        d1[i] = d2[i];
        if (!(d1[i] == this.visibility || d1[i] == undefined || d1[i] == null)) {
          d1[i] = (d1[i] * this.maxInput) / this.visibility;
        } else {
          d1[i] = this.maxInput;
        }
      }
    }
    this.dists = [];
    //print('d1', d1);
    this.dists= d1.concat();
    //print('dists', this.dists);
  }

  softmax(arr) {
    var sum1 = 0,
      sum2 = 0;
    for (let i = 0; i < arr.length; i++) {
      arr[i] = exp(arr[i]);
      if (i < 3)
        sum1 += arr[i];
      else
        sum2 += arr[i];
    }

    var turnActs = arr.slice(0, 3);
    var accActs = arr.slice(3);
    for (let i = 0; i < 3; i++) {
      turnActs[i] /= sum1;
      accActs[i] /= sum2;
    }

    var turnAct = turnActs.reduce((iMax, x, i, turnActs) => x > turnActs[iMax] ? i : iMax, 0);
    var accAct = accActs.reduce((iMax, x, i, accActs) => x > accActs[iMax] ? i : iMax, 0);
    return {
      turnAct: turnAct,
      accAct: accAct
    };
  }

  engine(actions) {
    var result = this.softmax(actions);

    switch (result.turnAct) {
      case 1: //LEFT TURN
        if (this.turn) {
          this.turn = false;
          this.turncnt = 0.0;
          this.angle -= this.maxTurn;
          if (this.angle == -360) {
            this.angle = 0;
          }
        }
        break;
      case 0: //RIGHT TURN
        if (this.turn) {
          this.turn = false;
          this.turncnt = 0.0;
          this.angle += this.maxTurn;
          if (this.angle == 360) {
            this.angle = 0;
          }
        }
        break;
    }

    switch (result.accAct) {
      case 1: //ACCELERATE
        this.vel += 0.1;
        if (this.vel > this.maxVel) {
          this.vel = this.maxVel;
        }
        break;
      case 0: //DECELERATE/REVERSE
        this.vel -= 0.05;
        if (this.vel < this.minVel) {
          this.vel = this.minVel;
        }
        break;
    }
  }

  calculateScore(best) {
    //this.score = sq(this.chkpt_crossed);  //factorial the checkpoints crossed * 10^laps_done
    /*
    if(this.chkpt_crossed == 0)
      this.score = 0;
    else {
      var i = this.chkpt_crossed;
      this.score = 1;
      while(i > 1) {
        this.score *= Math.log10(i*10);
        i--;
      }
      //this.score /= 100000;
      //this.score *= pow(10,floor(this.chkpt_crossed / this.chkpts));
    }
    */
    this.score = 0;
    if(best) {
      if(this.chkpt_crossed >= floor(best.chkpt_crossed / 2)) {
        var i = this.chkpt_crossed;
        while(i > 1) {
          this.score += Math.log10(i);
          i--;
        }
        if(this.chkpt_crossed > 2) {
          var avgt = this.chkptTime / this.chkpt_crossed;
          if(avgt == 0)
            avgt = 0.001;
          this.score += (2/avgt); 
        }
        if(!this.crashed)
          this.score += 1;
        this.score *= pow(10,floor((this.chkpt_crossed-1) / floor((this.chkpts_rem.length + this.chkpts_com.length)/2)));
      }
    } else {
      var i = this.chkpt_crossed;
      while(i > 1) {
        this.score += Math.log10(i);
        i--;
      }
      if(this.chkpt_crossed > 2) {
        var avgt = this.chkptTime / this.chkpt_crossed;
        if(avgt == 0)
          avgt = 0.001;
        this.score += (2/avgt);
        if(!this.crashed)
          this.score += 1; 
        this.score *= pow(10,floor((this.chkpt_crossed-1) / floor((this.chkpts_rem.length + this.chkpts_com.length)/2)));
      }
    }
  }

  reset(nnLayout, maxI, ipRange) {
    this.carW = 10;
    this.carH = 20;
    this.carCurve = 2.5;
    this.visibility = ipRange;
    this.sensors = nnLayout[0];
    this.color = color(255, 204, 0);

    this.pos = createVector(width / 2, height / 2);

    this.vel = 0;
    this.maxVel = 5.0;
    this.minVel = -2.0;
    this.vel_vec = createVector();

    this.turnr = 1.0;
    this.turncnt = 0.0;
    this.turn = false;
    this.maxTurn = 2.0;
    this.angle = 0;

    this.dists = [];
    
    this.chkpts_rem = [];
    this.chkpts_com = [];
    this.chkpt_crossed = 0;
    this.crashed = false;

    this.maxInput = maxI;

    this.score = 0;
  }

}