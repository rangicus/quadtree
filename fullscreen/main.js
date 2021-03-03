// Globals
let canvas = {
  e: null, // Canvas element
  size: null, // Canvas size
};

let debug = {
  drawAllPoints: false,
  drawAllBoxes: false,
};

let colors = {};

let radius = 50;

let qt;

// Classes
class Vector2 {
  constructor (x, y) {
    this.x = x;
    this.y = y;
  }

  static fromMouse () { return new Vector2(mouseX, mouseY); }
  static random () { return new Vector2(random(), random()); }
  static Zero () { return new Vector2(0, 0); }

  copy () {
    return new Vector2(this.x, this.y);
  }

  add (other) {
    if (other instanceof Vector2) {
      this.x += other.x;
      this.y += other.y;
    } else console.error(`Unknown type.`);

    return this;
  }

  mult (other) {
    if (typeof other ===  `number`) {
      this.x *= other;
      this.y *= other;
    } else if (other instanceof Vector2) {
      this.x *= other.x;
      this.y *= other.y;
    } else console.error(`Unknown type.`);

    return this;
  }

  div (other) {
    if (typeof other === `number`) {
      this.x /= other;
      this.y /= other;
    } else console.error(`Unknown type.`);

    return this;
  }

  greater (other) {
    // Checks if this is greater than other (Vector2)

    if (!other instanceof Vector2) console.error(`Vector2.greater only operates on type Vector2.`);

    return this.x > other.x && this.y > other.y;
  }

  less (other) {
    // Checks if this is less than other (Vector2)

    if (!other instanceof Vector2) console.error(`Vector2.less only operates on type Vector2.`);

    return this.x < other.x && this.y < other.y;
  }

  dist (other) {
    if (other instanceof Vector2) {
      let dx = this.x - other.x;
      let dy = this.y - other.y;

      return Math.sqrt(dx * dx + dy * dy);
    } else console.error(`Unknown type.`);
  }

  draw () {
    circle(this.x, this.y, 2);
  }
}

class Box {
  constructor (p1, size) {

    this.p1 = p1.copy();
    
    this.size = size.copy();
    
    this.p2 = p1.copy().add(size);
    this.center = this.p1.copy().add(this.p2).div(2);
  }

  contains (other) {
    if (other instanceof Vector2) {
      return other.greater(this.p1) && other.less(this.p2);
    } else console.error(`Unknown type.`, typeof other);
  }

  draw () {
    rect(this.p1.x, this.p1.y, this.size.x, this.size.y);
  }
}

class Circle {
  constructor (point, radius) {
    this.pos = point.copy();
    this.r = radius;
  }

  static fromMouse () { return new Circle( Vector2.fromMouse(), radius ); }

  intersect (other) {
    if (other instanceof Box) {
      let testX = this.pos.x;
      let testY = this.pos.y;

      if (this.pos.x < other.p1.x) testX = other.p1.x;
      else if (this.pos.x > other.p2.x) testX = other.p2.x;

      if (this.pos.y < other.p1.y) testY = other.p1.y;
      else if (this.pos.y > other.p2.y) testY = other.p2.y;

      let dist = this.pos.dist( new Vector2(testX, testY) );
      return dist <= this.r;
    } else console.error(`Unknown type.`);
  }

  contains (other) {
    if (other instanceof Vector2) {
      return this.pos.dist(other) <= this.r;
    } else console.error(`Unknown type.`);
  }

  draw () {
    circle(this.pos.x, this.pos.y, this.r * 2)
  }
}

class QuadTree {
  constructor (bounds) {
    this.capacity = 4;
    this.divided = false;
    this.points = [];
    this.children = [];

    if (!bounds instanceof Box) console.error(`Constructor: "bounds" must be instance of Box.`);
    this.bounds = bounds;
  }

  draw () {
    if (debug.drawAllBoxes) this.drawSelf();
    if (debug.drawAllPoints) this.drawPoints();
    
    // Draw Children
    this.children.forEach(child => child.draw())
  }

  drawSelf () {
    stroke(colors.white); strokeWeight(1); noFill();
    this.bounds.draw();
  }

  drawPoints () {
    noStroke(); fill(colors.white);
    this.points.forEach(point => point.draw());
  }

  subdivide () {
    if (!this.divided) {
      const half = this.bounds.size.copy().div(2);
  
      const halfX = new Vector2(half.x, 0);
      const halfY = new Vector2(0, half.y);
  
      this.children = [
        new QuadTree(new Box( this.bounds.p1.copy(), half.copy() )),
        new QuadTree(new Box( this.bounds.p1.copy().add(halfX), half.copy() )),
        new QuadTree(new Box( this.bounds.p1.copy().add(halfY), half.copy() )),
        new QuadTree(new Box( this.bounds.p1.copy().add(halfX).add(halfY), half.copy() )),
      ];
    }

    this.divided = true;
    return this;
  }

  search (other) {
    if (other instanceof Circle) {
      let results = { point: [], box: [] }

      if (!other.intersect(this.bounds)) return results;

      this.points
        .filter(point => other.contains(point))
        .forEach(point => results.point.push(point));
      results.box.push(this.bounds);

      this.children
        .forEach(child => {
          let r = child.search(other);

          results.box.push(...r.box);
          results.point.push(...r.point);
        });

      return results;
    } else console.error(`Unknown type.`);
  }

  insert (other) {
    if (other instanceof Vector2) {
      if (!this.bounds.contains(other)) return false; // Ignore points not in the bounds.
      

      if (this.points.length < this.capacity) {
        // If this can hold another point, put it in.
        this.points.push(other);
        
        return true;
      } else {
        // Otherwise, subdivide, then add the point to the first one that will take it.

        if (!this.divided) this.subdivide(); // If not already divided, divide.
        
        // Put it in the first child that will take it.
        for (let i = 0; i < this.children.length; i ++) {
          if (this.children[i].insert(other)) return true;
        }
      }
    } else console.error(`Other must be Vector2.`);

    return false;
  }
}

// p5 Functions
function setup () {
  // Canvas
  canvas.e = createCanvas();
  canvas.e.parent(`container`);
  windowResized();

  // Variables
  colors = {
    black: color(0),
    gray: color(128),
    white: color(255),

    green: color(0, 255, 0),
    blue: color(0, 0, 255),
    red: color(255, 0, 0),
  }

  qt = new QuadTree(new Box(Vector2.Zero(), canvas.size.copy()));

  const screen = new Vector2(canvas.size.x, canvas.size.y);
  for (let i = 0; i < 10e3; i ++) {
    qt.insert(
      Vector2.random().mult(screen)
    );
  }
}

function draw () {
  // Clearing
  background(colors.black);

  // Drawing
    // Mouse
  const mouse = Vector2.fromMouse();
  const mouseCircle = new Circle(mouse, radius);

  noFill(); stroke(colors.green); strokeWeight(1);
  mouseCircle.draw();

    // Tree
  qt.draw();

  let results = qt.search(mouseCircle);
  
  stroke(colors.gray); strokeWeight(1); noFill();
  results.box.forEach(box => box.draw());

  noStroke(); fill(colors.green);
  results.point.forEach(point => point.draw());
}

function mouseClicked () {
  const mouse = Vector2.fromMouse();

  if (mouse.greater(Vector2.Zero()) && mouse.less(canvas.size)) {
    // If mouse is within canvas.

    qt.insert(mouse.copy());
  }
}

function windowResized () {
  canvas.size = new Vector2(window.innerWidth, window.innerHeight);

  resizeCanvas(canvas.size.x, canvas.size.y);
}