var backgroundcolor = 'white';
var allboltscounter = 0;
var allbolts = {}; //object to hold all bolts

//window details
var windowtracker = []; //hold details about each window
var storewindows = []; //hold shape of each window
var sounds = [];
var numsounds = 5;

//pebble cursor and throw
var mycursor;
var pebble = {};
pebble.inair = false;
pebble.releasex = 0;
pebble.releasey = 0;
pebble.destinationx = 0;
pebble.destinationy = 0;
pebble.cycle = 0;
pebble.numcycles = 20; //counter for time of pebble animation
pebble.windowtarget = null;

//crack origin shape
var nc = {};
nc.resolution = 260; // how many points in the circle
nc.rad = 10;
nc.x = 1;
nc.y = 1;
nc.t = 0; // time passed
nc.tChange = .02; // how quick time flies 
nc.nVal; // noise value
nc.nInt = 1; // noise intensity
nc.nAmp = 10; // noise amplitude
nc.filled = true;

function preload() {
  store1 = loadImage("assets/starbucks.jpg");
  mycursor = loadImage("assets/pebble.png");
  for (var i = 0; i < numsounds; i++) {
    sounds[i] = loadSound('assets/glass'+i+'.mp3');
  }
}

function setup() {
  var canvas = createCanvas(1024, 680); //size of kadenze window
  canvas.parent('canvas');
  canvas.mouseClicked(throwstone);
  
  velx   = createSlider(-300, 300, 40).parent('velx');
  vely = createSlider(-50, 50, -1).parent('vely');
  timer  = createSlider(-5, 15, 2, 0.1).parent('timer');
  endx   = createSlider(-2, 2, 1, 0.1).parent('endx');
  endy   = createSlider(-2, 2, 1, 0.1).parent('endy');
  anglesider   = createSlider(0, 1, 1, 0.1).parent('angle');
  
  //each window is a rect: x, y, w, h
  storewindows[0] = [0, 124, 197, 469];
  storewindows[1] = [216, 116, 283, 467];
  storewindows[2] = [514, 111, 292, 475];
  storewindows[3] = [826, 121, 192, 467];
  
  //crack centers
  noiseSeed(8);
  
  //hide cursor
  noCursor(); //hide mouse cursor
}

function draw() {
  background(backgroundcolor);

  image(store1, 0, 0);
  showslidervals();
  
  //for debug
  //showwindowframes();
  
  //loop through all bolts and display them
  //one bolt contains a series of cracks
  for (var i = 0; i < allboltscounter; i++) {
    displayOneBolt(i);
  }
  
  //crack centers
  for (var i = 0; i < storewindows.length; i++) {
    windownum = i;
    if (windowtracker[windownum]){
      drawNoisyCircle(windownum);
    }
  }
  supercursor();
  
}

//-------------------------------------------------------
function hide_preamble(){
  var preamble = select("#preamble"); 
  preamble.addClass('hide');
  
  var mycanvas = select("#canvas"); 
  mycanvas.removeClass('hide');
}
function throwstone(){
  //if thrown at window, put stone throw animation into effect
  var hit = false;
  var windownum = -1;
  for (var i = 0; i < storewindows.length; i++) {
    hit = collidePointRect(mouseX,mouseY,storewindows[i][0], storewindows[i][1], storewindows[i][2], storewindows[i][3]);
    if (hit){
      windownum = i;
      
      //globals for rock throwing
      pebble.windowtarget = windownum;
      pebble.inair = true; 
      pebble.cycle = 0;
    }
  }
}

function updateWindowDetails(windownum){
      //FIRST TIME that there is a crack in this window
      //set point of origin for the crack (which will stay the same hereafter)
      if (!windowtracker[windownum]){
        windowtracker[windownum] = {};
        windowtracker[windownum].waitingforstone = true;
        windowtracker[windownum].origmousex = mouseX;
        windowtracker[windownum].origmousey = mouseY;
        windowtracker[windownum].rad = nc.rad; //radius of crack center
        windowtracker[windownum].intensity = random(500, 1000); //crack center intensity
      } else {
        //change the shape of the crack center each click
        windowtracker[windownum].rad+=1;
        windowtracker[windownum].intensity+=random(5, 50);
      }
    
}
//fly pebble towards crack center
//when it hits the crack center, make crack
//can't quite get this the way i want it... think i need to take a page from steering forces
function supercursor(){
  if (pebble.inair){
    //pebble flies from point of release to point of impact
    //set destination on first cycle through animation
 
    if (pebble.cycle === 0){
        pebble.releasex = mouseX; //fly from wherever mouse is currently 
        pebble.releasey = mouseY;
        pebble.destinationx = mouseX - (mycursor.width/2); //fly to center of crack 
        pebble.destinationy = mouseY - (mycursor.height/2);

        pebble.xdif = pebble.destinationx - pebble.releasex; //distance between where mouse is and center of crack is
        pebble.ydif = pebble.destinationy - pebble.releasey;
        
        //console.log("pebble should move to:" + pebble.releasex, pebble.releasex);
        //console.log("which, from current position of:" + pebble.releasex, pebble.releasey);
       // console.log("is:" + pebble.xdif, pebble.ydif);
    }

    //on each cycle, move pebble one bit closer to the crack by a percentage of the distance remaining
    //TODO: something not working about this
    var gox = pebble.releasex - (pebble.xdif / (pebble.cycle+.01/pebble.numcycles));  //add .01 to avoid div by zero
    var goy = pebble.releasey - (pebble.ydif / (pebble.cycle+.01/pebble.numcycles));
    
    image(mycursor, gox, goy, mycursor.width-pebble.cycle, mycursor.height-pebble.cycle);
    pebble.cycle++;
    
    //Do this when pebble animation has completed 
    if (pebble.cycle > pebble.numcycles){
      pebble.inair = false;
      pebble.cycle = 0;

      updateWindowDetails(pebble.windowtarget); //set window details that will be used to make crack and crack center
      releaseBolt(pebble.windowtarget); //do the crack and sound, after the pebble has hit the window
    }
  } else {
    //when nothing is happening, replace cursor with pebble
    image(mycursor, mouseX-(mycursor.width/2), mouseY-(mycursor.height/2));
  }
}

//center of crack
//lifted from here: http://www.openprocessing.org/sketch/112858
function drawNoisyCircle(windownum){
  push();
  translate(windowtracker[windownum].origmousex, windowtracker[windownum].origmousey);
  if (nc.filled) {
    strokeWeight(.5);
    stroke(0);
    fill(255);
  }
  else {
    noFill();
    stroke(0);
    strokeWeight(1);
  }
  nc.nInt = map(windowtracker[windownum].intensity*.9, 0, width, 0.1, 30); // map mouseX to noise intensity (change to mouseX for cool)
  nc.nAmp = map(nc.nAmp *.9, 0, height, 0.0, 1.0); // map mouseY to noise amplitude (change to mouseY for cool)
  beginShape();
  for (var a=0; a<=TWO_PI; a+=TWO_PI/nc.resolution) {
    nc.nVal = map(noise( cos(a)*nc.nInt+1, sin(a)*nc.nInt+1, nc.t ), 0.0, 1.0, nc.nAmp, 1.0); // map noise value to match the amplitude
    nc.x = cos(a)*windowtracker[windownum].rad *nc.nVal;
    nc.y = sin(a)*windowtracker[windownum].rad *nc.nVal;
    vertex(nc.x, nc.y);
  }
  endShape(CLOSE);
  //nc.t += nc.tChange; (not using change, but it's cool if you turn it on!)
  pop();
}


//draw rects for debug
function showwindowframes(){
  for (var i = 0; i < storewindows.length; i++) {
    rect(storewindows[i][0], storewindows[i][1], storewindows[i][2], storewindows[i][3]);
  }
}

//siders for debug
function showslidervals(){
  velxdisplay.innerHTML = velx.value();
  velydisplay.innerHTML = vely.value();
  timerdisplay.innerHTML = timer.value();
  endxdisplay.innerHTML = endx.value();
  endydisplay.innerHTML = endy.value();
  angledisplay.innerHTML = anglesider.value();
}

//shows one bolt
function displayOneBolt(boltnum){
    for (var i = 0; i < allbolts[boltnum].cracks.length; i++) {
      // Get the allbolts[0].cracks, update
      allbolts[boltnum].cracks[i].update();
      allbolts[boltnum].cracks[i].render();
      
      if (allbolts[boltnum].cracks[i].timeToBranch()) {
        if (allbolts[boltnum].cracks.length < 15) {
          allbolts[boltnum].cracks.push(allbolts[boltnum].cracks[i].drawme( random(60) * anglesider.value())); // Add one going right
          allbolts[boltnum].cracks.push(allbolts[boltnum].cracks[i].drawme(- random(20) * anglesider.value())); // Add one going left
        } 
      }
  }
}

//utility helper
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

//create a new bolt and add it to the bolts object
function releaseBolt(windownum){
  
  //only draw crack on the window that was hit
  if (windownum > -1){
    allbolts[allboltscounter] = {};
    allbolts[allboltscounter].cracks = [];
    var myx = random(-70, 100);
    var myy = random(-30, 50);
    var mytimer = random(0.0, 2.0);
    var crack = new Crack(createVector(windowtracker[windownum].origmousex, windowtracker[windownum].origmousey), createVector(myx, myy), mytimer, windownum);
    allbolts[allboltscounter].cracks.push(crack);
    allboltscounter++;
    var soundnum = getRandomInt(0, sounds.length);
    sounds[soundnum].play();
  }
  
}
  