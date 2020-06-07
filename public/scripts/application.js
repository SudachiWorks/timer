function Timer(limit) {
  this.limit = limit * 1000; // msec
  this.remaining = this.limit;
  this.intervalID = null;
}

Timer.prototype.start = function (callback) {
  const DELAY = 50; // msec

  this.intervalID = setInterval(function interval () {
    this.remaining = this.remaining - DELAY;

    if (this.remaining <= 0) {
      this.remaining = 0;
      clearInterval(this.intervalID);
      this.intervalID = null;
    }

    callback(this);
  }.bind(this), DELAY);
}

Timer.prototype.stop = function() {
  clearInterval(this.intervalID);
}

Timer.prototype.isStarted = function() {
  return !!this.intervalID;
}

Timer.prototype.isStopped = function() {
  return !this.isStarted();
}

Timer.prototype.getRemaining = function() {
  const remaining = this.remaining / 1000;
  return {
    min: Math.floor(remaining / 60),
    sec: Math.floor(remaining % 60),
    msec: Math.floor(this.remaining % 1000)
  }
}

Timer.prototype.getProgress = function() {
  return this.remaining / this.limit;
}

function TimerView(target) {
  this.el = document.querySelector(target);
  this.minEl = this.el.querySelector('.timer-min');
  this.secEl = this.el.querySelector('.timer-sec');
}

TimerView.prototype.render = function (timer) {
  const remaining = timer.getRemaining();
  const min = String(remaining.min).padStart(2, '0');
  const sec = String(remaining.sec).padStart(2, '0');
  this.minEl.innerHTML = min;
  this.secEl.innerHTML = sec;
}

function SettingsView(target) {
  this.listeners = {};
  this.el = document.querySelector(target);
  this.speechTimeEl = this.el.querySelector('.settings-speech-time');
  this.discussionTimeEl = this.el.querySelector('.settings-discussion-time');
  this.buttonEl = this.el.querySelector('.timer-button');
  this.speechTime = this.speechTimeEl.value;
  this.discussionTime = this.discussionTimeEl.value;

  this.speechTimeEl.addEventListener('change', this.handleChangeSpeechTime.bind(this));
  this.discussionTimeEl.addEventListener('change', this.handleChangeDiscussionTime.bind(this));
  this.buttonEl.addEventListener('click', this.handleClickButton.bind(this));
}

SettingsView.prototype.handleChangeSpeechTime = function (event) {
  this.speechTime = Number(event.target.value);
  this.dispatchEvent(new Event('changetimer'));
}

SettingsView.prototype.handleChangeDiscussionTime = function (event) {
  this.discussionTime = Number(event.target.value);
  this.dispatchEvent(new Event('changetimer'));
}

SettingsView.prototype.handleClickButton = function (event) {
  this.dispatchEvent(new Event('clickbutton'));
}

SettingsView.prototype.addEventListener = function (type, callback) {
  if (!(type in this.listeners)) {
    this.listeners[type] = [];
  }
  this.listeners[type].push(callback);
}

SettingsView.prototype.dispatchEvent = function(event) {
  if (!(event.type in this.listeners)) {
    return true;
  }
  const stack = this.listeners[event.type].slice();

  for (let i = 0, l = stack.length; i < l; i++) {
    stack[i].call(this, event);
  }
  return !event.defaultPrevented;
};

SettingsView.prototype.getSpeechTime = function () {
  return Number(this.speechTime);
}

SettingsView.prototype.getDiscussionTime = function () {
  return Number(this.discussionTime);
}

SettingsView.prototype.render = function (timer) {
  if (timer.isStopped()) {
    this.buttonEl.innerHTML = "start";
  } else {
    this.buttonEl.innerHTML = "stop";
  }
}

function ProgressView(target) {
  this.el = document.querySelector(target);
  this.barEl = this.el.querySelector('.progress-bar');
}

ProgressView.prototype.render = function (timer, status) {
  if (timer.isStarted()) {
    const progress = ((1 - timer.getProgress()) * 100).toFixed(2);

    this.barEl.style.width =  progress + '%';

    if (progress < 90) {
      this.barEl.style.backgroundColor = status === 'speech' ? 'blue' : 'green';
    } else {
      this.barEl.style.backgroundColor = 'red';
    }
  } else {
    this.barEl.style.width = '0';
  }
}

function StatusView(target) {
  this.el = document.querySelector(target);
  this.stoppedEl = this.el.querySelector('.status-stopped');
  this.speechEl = this.el.querySelector('.status-speech');
  this.discussiondEl = this.el.querySelector('.status-discussion');
}

StatusView.prototype.render = function (status) {
  setDisplay(this.stoppedEl, status === 'stopped');
  setDisplay(this.speechEl, status === 'speech');
  setDisplay(this.discussiondEl, status === 'discussion');
}

function setDisplay(el, isDisplay) {
  el.style.display = isDisplay ? 'inline' : 'none';
}

!function main() {
  let timer = null;
  let speechTime = null;
  let discussionTime = null;
  let status = null;

  const timerView = new TimerView('.timer');
  const settingsView = new SettingsView('.settings');
  const progressView = new ProgressView('.progress');
  const statusView = new StatusView('.status');

  settingsView.addEventListener('clickbutton', function () {
    if (timer.isStarted()) {
      initTimer();
    } else {
      startTimer('speech');
    }
    settingsView.render(timer);
  });

  settingsView.addEventListener('changetimer', function () {
    initTimer();
  });

  function initTimer() {
    stopTimer();

    speechTime = settingsView.getSpeechTime();
    discussionTime = settingsView.getDiscussionTime();

    timer = new Timer(speechTime);

    timerView.render(timer);
    progressView.render(timer, status);
    settingsView.render(timer);
  }

  function startTimer(nextStatus) {
    timer.start(function (t) {
      if (t.remaining > 0) {
        progressView.render(t, status);
        timerView.render(t);
      } else {
        if (status === 'speech') {
          timer = new Timer(discussionTime);
          startTimer('discussion');
        } else {
          initTimer();
        }
      }
    });

    status = nextStatus;
    statusView.render(status);
  }

  function stopTimer() {
    if (timer) {
      timer.stop();
      timer = null;
    }
    status = 'stopped';
    statusView.render(status);
  }

  initTimer();
}();
