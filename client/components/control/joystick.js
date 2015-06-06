/**
 * Created by pedro on 6/6/15.
 */
function sprite(t, i, s, e, a) {
  this.ab = i,
    this.padding = new an(s, e),
    this.img = GAME.assetsManager.getAsset(t),
    this.clipStart = new an(0, 0),
    this.sprite = new an(0, 0),
    this.size = new an(this.img.json.frameSize[0], this.img.json.frameSize[1]),
    this.halfSize = new an(0.5 * this.size.X, 0.5 * this.size.Y),
    this.nbSprites = this.img.json.texSize[0] / this.img.json.frameSize[0],
    this.loop = a
};

sprite.prototype = {
  draw: function () {
    C.drawImage(this.img, this.clipStart.X, this.clipStart.Y, this.img.json.frameSize[0], this.img.json.frameSize[1], this.ab.X + this.padding.X - this.halfSize.X, this.ab.Y + this.padding.Y - this.halfSize.Y, this.size.X, this.size.Y)
  },
  init: function () {
    this.sprite.init(0, 0),
      this.clipStart.init(0, 0)
  },
  set: function (t, i) {
    this.sprite.X = t,
      this.sprite.Y = i,
      this.clipStart.init(this.img.json.frameSize[0] * this.sprite.X, this.img.json.frameSize[1] * this.sprite.Y)
  },
  setY: function (t) {
    this.sprite.Y = t,
      this.clipStart.Y = this.img.json.frameSize[1] * this.sprite.Y
  },
  add: function (t, i) {
    this.sprite.X += t,
      this.sprite.Y += i,
    this.loop && (this.sprite.X == this.nbSprites ? this.sprite.X = 0 : this.sprite.X < 0 && (this.sprite.X = this.nbSprites - 1)),
      this.clipStart.init(this.img.json.frameSize[0] * this.sprite.X, this.img.json.frameSize[1] * this.sprite.Y)
  }
};

function Joystick() {
  this.ab = new an(0, 0),
    this.stickSize = new Array(0.5, 0.75, 1),
    this.sprite = null,
    this.stick = null,
    this.stickab = new an(0, 0),
    this.delta = new an(0, 0),
    this.ae = 0,
    this.on = 0
};
Joystick.prototype = {
  init: function () {
    this.sprite = new sprite('joystick.png', this.ab, 0, 0, 0),
      this.stick = new sprite('joystick2.png', this.stickab, 0, 0, 0)
  },
  draw: function () {
    this.on && (this.sprite.draw(), this.stick.draw())
  },
  setab: function (t) {
    this.computeDelta(t);
    var i = this.delta.squareMagnitude();
    i >= this.squareRad ? (this.stickab.initV(t), this.delta.normalize(), this.delta.scale(this.sprite.halfSize.X, 2), this.ab.initV(t), this.ab.subtract(this.delta), this.clamp(), this.computeDelta(t))  : this.stickab.initV(t),
      this.computeDirection()
  },
  computeDelta: function (t) {
    this.delta.initV(t),
      this.delta.subtract(this.ab)
  },
  computeDirection: function () {
    D.initV(this.delta),
      D.scale(1 / this.sprite.halfSize.X, 2)
  },
  clamp: function () {
    this.ab.Y < this.ao.top && (this.ab.Y = this.ao.top),
    this.ab.X > this.ao.right && (this.ab.X = this.ao.right),
    this.ab.Y > this.ao.bottom && (this.ab.Y = this.ao.bottom),
    this.ab.X < this.ao.left && (this.ab.X = this.ao.left)
  },
  release: function () {
    this.center(),
      this.on = 0
  },
  center: function () {
    this.stickab.initV(this.ab),
      D.init(0, 0)
  },
  push: function (t) {
    this.on = 1,
      this.ab.initV(t),
      this.stickab.initV(t),
      this.clamp(),
      this.computeDelta(t),
      this.computeDirection()
  },
  setSize: function () {
    this.sprite && (this.sprite.size.init(this.sprite.img.json.frameSize[0] * this.stickSize[OPTION.stickSize], this.sprite.img.json.frameSize[1] * this.stickSize[OPTION.stickSize]), this.sprite.halfSize.init(this.sprite.size.X >> 1, this.sprite.size.Y >> 1), this.stick.size = new an(this.stick.img.json.frameSize[0] * this.stickSize[OPTION.stickSize], this.stick.img.json.frameSize[1] * this.stickSize[OPTION.stickSize]), this.stick.halfSize = new an(this.stick.size.X >> 1, this.stick.size.Y >> 1), this.ao = new ao( - this.sprite.halfSize.X, - this.sprite.halfSize.Y), this.squareRad = this.sprite.halfSize.X * this.sprite.halfSize.X)
  }
};