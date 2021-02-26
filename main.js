'use strict';

const GAME_DURATION = 10;
const CARROTS_COUNT = 10;
const BUGS_COUNT = 10;

const info = document.querySelector('.info');

const game = document.querySelector('.game');
const btn = document.querySelector('.header__btn');
const timer = document.querySelector('.header__timer');
const counter = document.querySelector('.header__counter');
const field = document.querySelector('.game__field');
const fieldRect = field.getBoundingClientRect();

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const width = (canvas.width = fieldRect.width);
const height = (canvas.height = fieldRect.height);

const msg = document.querySelector('.msg');
const result = document.querySelector('.msg__result');
const replay = document.querySelector('.msg__replay');
const cancel = document.querySelector('.msg__cancel');

const bgSound = new Audio('sound/bg.mp3');
const winningSound = new Audio('sound/game_win.mp3');
const bugSound = new Audio('sound/bug_pull.mp3');
const alertSound = new Audio('sound/alert.wav');

const carrotImg = new Image();
carrotImg.src = 'img/carrot.png';
const bugImg = new Image();
bugImg.src = 'img/bug.png';

let isFinished = true;
let intervalForTimer;
let count = CARROTS_COUNT;
let rAF;

// constructors 생성
function Creature(x, y, velX, velY, size, exists) {
  this.x = x;
  this.y = y;
  this.velX = velX;
  this.velY = velY;
  this.size = size;
  this.exists = exists;
}

Creature.prototype.draw = function (imgName) {
  ctx.drawImage(imgName, this.x, this.y);
};

Creature.prototype.update = function () {
  if (this.x + this.size >= width) {
    this.velX = -this.velX;
  }
  if (this.x <= 0) {
    this.velX = -this.velX;
  }
  if (this.y + this.size >= height) {
    this.velY = -this.velY;
  }
  if (this.y <= 0) {
    this.velY = -this.velY;
  }

  this.x += this.velX;
  this.y += this.velY;
};

function Carrot(x, y) {
  Creature.call(this, x, y, 0, 0, 80, true);
}

Carrot.prototype = new Creature();

Carrot.prototype.detectClick = function () {
  canvas.addEventListener('click', e => {
    if (isFinished) {
      return;
    }
    if (!this.exists) {
      return;
    }

    // canvas는 translate 전 위치를 기준으로 offsetTop이 결정됨
    const x = e.clientX - field.offsetLeft;
    const y = e.clientY - field.offsetTop;

    if (
      y > this.y &&
      y < this.y + this.size &&
      x > this.x &&
      x < this.x + this.size
    ) {
      this.exists = false;
      playCarrotSound();
      updateCounting();
      if (count === 0) {
        finishGame('win');
      }
    }
  });
};

function Bug(x, y, velX, velY) {
  Creature.call(this, x, y, velX, velY, 50);
}

Bug.prototype = new Creature();

Bug.prototype.detectClick = function () {
  canvas.addEventListener('click', e => {
    if (isFinished) {
      return;
    }

    const x = e.clientX - field.offsetLeft;
    const y = e.clientY - field.offsetTop;

    if (
      y > this.y &&
      y < this.y + this.size &&
      x > this.x &&
      x < this.x + this.size
    ) {
      finishGame('lose');
    }
  });
};

// instance objects 생성
const carrots = [];
while (carrots.length < CARROTS_COUNT) {
  const carrot = new Carrot(random(0, width - 80), random(0, height - 80));
  carrots.push(carrot);
}

const bugs = [];
while (bugs.length < BUGS_COUNT) {
  const bug = new Bug(
    random(0, width - 50),
    random(0, height - 50),
    random(-3, 3),
    random(-3, 3)
  );
  bugs.push(bug);
}

function random(min, max) {
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num;
}

btn.addEventListener('click', () => {
  if (isFinished) {
    startGame();
  } else {
    finishGame('replay');
  }
});

replay.addEventListener('click', () => {
  resetGame();
  startGame();
});

cancel.addEventListener('click', () => {
  resetGame();
});

function startGame() {
  isFinished = false;
  hideInfo();
  showBtn('stop');
  startTimer();
  startCounting();
  displayItems();
  playSound(bgSound);
}

function finishGame(myResult) {
  isFinished = true;
  hideBtn();
  clearInterval(intervalForTimer);
  clearField();
  showMsg(myResult);
  stopSound(bgSound);
}

function resetGame() {
  hideMsg();
  showBtn('play');
  resetTimer();
  resetCounting();
  reviveCarrots();
  showInfo();
}

function showInfo() {
  info.style.visibility = 'visible';
}

function hideInfo() {
  info.style.visibility = 'hidden';
}

function showBtn(btnName) {
  btn.innerHTML = `<i class="fas fa-${btnName}"></i>`;
  btn.style.visibility = 'visible';
}

function hideBtn() {
  btn.style.visibility = 'hidden';
}

function startTimer() {
  let sec = GAME_DURATION;
  setTimer(sec);
  intervalForTimer = setInterval(() => {
    setTimer(--sec);
    if (sec === 0) {
      finishGame('lose');
    }
  }, 1000);
}

function setTimer(sec) {
  const minute = Math.floor(sec / 60);
  const second = sec % 60;
  const modifiedMinute = modifyTime(minute);
  const modifiedSecond = modifyTime(second);
  timer.textContent = `${modifiedMinute}:${modifiedSecond}`;
}

function modifyTime(time) {
  const modifiedTime = time < 10 ? `0${time}` : time;
  return modifiedTime;
}

function resetTimer() {
  timer.textContent = '00:00';
}

function startCounting() {
  counter.textContent = count;
}

function resetCounting() {
  counter.textContent = '0';
  count = CARROTS_COUNT;
}

function updateCounting() {
  counter.textContent = --count;
}

function displayItems() {
  ctx.clearRect(0, 0, width, height);

  carrots.forEach(carrot => {
    if (!carrot.exists) {
      return;
    }
    carrot.draw(carrotImg);
    carrot.update();
    carrot.detectClick();
  });

  bugs.forEach(bug => {
    bug.draw(bugImg);
    bug.update();
    bug.detectClick();
  });

  rAF = requestAnimationFrame(displayItems);
}

function clearField() {
  cancelAnimationFrame(rAF);
  ctx.clearRect(0, 0, width, height);
}

function reviveCarrots() {
  carrots.forEach(carrot => (carrot.exists = true));
}

function playSound(soundName) {
  soundName.currentTime = 0;
  soundName.play();
}

function stopSound(soundName) {
  soundName.pause();
}

// 당근들을 연속적으로 빠르게 클릭 시 오디오가 재생되지 않는 현상 방지 목적의 함수
function playCarrotSound() {
  const carrotSound = new Audio('sound/carrot_pull.mp3');
  carrotSound.addEventListener('ended', () => {
    carrotSound.remove();
  });
  carrotSound.play();
}

function showMsg(myResult) {
  switch (myResult) {
    case 'win':
      result.textContent = `🥕 YOU WIN 🥕`;
      playSound(winningSound);
      break;
    case 'lose':
      result.textContent = `🐛 YOU LOSE 🐛`;
      playSound(bugSound);
      break;
    case 'replay':
      result.textContent = `🎮 Replay? 🎮`;
      playSound(alertSound);
  }

  msg.style.visibility = 'visible';
}

function hideMsg() {
  msg.style.visibility = 'hidden';
}
