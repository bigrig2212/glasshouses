
function Crack(start, vel, n, windownum) {
  this.start = start.copy();
  this.end = start.copy();
  this.vel = vel.copy();
  //this.vel.mult(1);
  this.timerstart = n;
  this.timer = n;
  this.windownum = windownum;
  this.growing = true;

  this.update = function() {
    if (this.growing) {
      this.end.add(this.vel);
    }
  }

  this.render = function() {
    stroke(225);
    
    //check to make sure that crack is still being drawn within the given window
    //if not, don't draw it
    var point_in_window = false;
    point_in_window = collidePointRect(this.end.x, this.end.y, storewindows[this.windownum][0], storewindows[this.windownum][1], storewindows[this.windownum][2], storewindows[this.windownum][3]);
    
    if (!point_in_window){
      push();
      noStroke();
    } 
    line(this.start.x, this.start.y, this.end.x*endx.value(), this.end.y*endy.value());
    if (!point_in_window){
      pop();
    } 
  }
  


  this.timeToBranch = function() {
    this.timer--;
    if (this.timer < 0 && this.growing) {
      this.growing = false;
      return true;
    } else {
      return false;
    }
  }

  this.drawme = function(angle) {
    // What is my current heading
    var theta = vel.heading();
    // What is my current speed
    var m = vel.mag();
    // Turn me
    theta += radians(angle);
    // Look, polar coordinates to cartesian!!
    var newvel = createVector(m * cos(theta), m * sin(theta));
    // Return a new Branch
    return new Crack(this.end, newvel, this.timerstart, this.windownum);
  }

}
