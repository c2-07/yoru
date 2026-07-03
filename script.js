const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

let player;

const channels = [
  "X4VbdwhkE10", // Lofi Girl
  // TODO: Add Support for other channels

  // "jfKfPfyJRdk", // Lofi Girl Synthwave "4xDzrUhVKcg", // Chillhop radio
  // "7NOSDKb0HlU", // Chillhop lofi
  // "5yx6BWlEVcY", // Chillout lounge
];
let currentChannelIndex = 0;

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    width: "1",
    height: "1",
    videoId: channels[0],
    playerVars: {
      controls: 0,
      autoplay: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
  if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    if (btnPlayPause)
      btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else if (event.data === YT.PlayerState.PAUSED) {
    if (btnPlayPause)
      btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
}

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;

  if (e.code !== "Space" || !player) return;

  e.preventDefault();
  togglePlayPause();
});

// Player Controls Logic
const btnPlayPause = document.getElementById("btn-play-pause");
const btnVolume = document.getElementById("btn-volume");
const volumeSlider = document.getElementById("volume-slider");
let isMuted = false;
let previousVolume = 100;

function togglePlayPause() {
  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
    if (btnPlayPause)
      btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
  } else {
    player.playVideo();
    if (btnPlayPause)
      btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
  }
}

if (btnPlayPause) {
  btnPlayPause.addEventListener("click", togglePlayPause);
}

let fadeInterval;

function updateSliderVisuals(vol) {
  if (volumeSlider) {
    volumeSlider.value = vol;
    volumeSlider.style.setProperty("--slider-fill", `${vol}%`);
  }
}

if (volumeSlider) {
  volumeSlider.addEventListener("input", (e) => {
    if (!player) return;
    clearInterval(fadeInterval);
    const vol = parseInt(e.target.value, 10);
    player.setVolume(vol);
    updateSliderVisuals(vol);

    if (isMuted && vol > 0) {
      player.unMute();
      isMuted = false;
    }

    if (vol === 0) {
      btnVolume.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
      isMuted = true;
    } else {
      btnVolume.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      isMuted = false;
      previousVolume = vol;
    }
  });
}

function smoothMuteToggle() {
  if (!player) return;
  clearInterval(fadeInterval);

  let currentVol = player.getVolume();
  if (player.isMuted()) currentVol = 0;

  const targetVol = isMuted ? previousVolume || 100 : 0;
  if (!isMuted)
    previousVolume = currentVol || (volumeSlider ? volumeSlider.value : 100);

  if (targetVol > 0) {
    player.unMute();
    isMuted = false;
    btnVolume.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
  } else {
    isMuted = true;
    btnVolume.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
  }

  const diff = targetVol - currentVol;
  const steps = 15;
  const stepVal = diff / steps;
  let currentStep = 0;

  fadeInterval = setInterval(() => {
    currentStep++;
    let nextVol = Math.round(currentVol + stepVal * currentStep);
    if (currentStep >= steps) {
      nextVol = targetVol;
      clearInterval(fadeInterval);
      if (nextVol === 0) player.mute();
    }
    player.setVolume(nextVol);
    updateSliderVisuals(nextVol);
  }, 15);
}

if (btnVolume) {
  btnVolume.addEventListener("click", smoothMuteToggle);
}

function updateClock() {
  const now = new Date();

  const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
  const timeString = now.toLocaleTimeString([], timeOptions);

  const dateOptions = { weekday: "long", month: "long", day: "numeric" };
  const dateString = now.toLocaleDateString([], dateOptions);

  const timeEl = document.getElementById("time");
  const dateEl = document.getElementById("date");

  if (timeEl && dateEl) {
    timeEl.textContent = timeString;
    dateEl.textContent = dateString;
  }
}

setInterval(updateClock, 1000);
updateClock();

// Todo Logic
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const todoMenu = document.getElementById("todo-menu");
const todoToggle = document.getElementById("todo-toggle");
const historyToggle = document.getElementById("history-toggle");
const todoTitle = document.getElementById("todo-title");
const todoWrapper = document.getElementById("todo-wrapper");

let todos = JSON.parse(localStorage.getItem("lofi-todos") || "[]");
let showingHistory = false;

function renderTodos() {
  todoList.innerHTML = "";

  const filteredTodos = todos.filter((todo) =>
    showingHistory ? todo.completed : !todo.completed,
  );

  filteredTodos.forEach((todo) => {
    const originalIndex = todos.indexOf(todo);
    const li = document.createElement("li");
    if (todo.completed) {
      li.classList.add("completed");
    }

    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = todo.text;

    const tickBtn = document.createElement("button");
    tickBtn.className = "task-btn tick";
    tickBtn.innerHTML = showingHistory ? "⟲" : "✓";
    tickBtn.title = showingHistory ? "Restore" : "Mark Complete";
    tickBtn.onclick = () => toggleTodo(originalIndex);

    const delBtn = document.createElement("button");
    delBtn.className = "task-btn delete";
    delBtn.innerHTML = "✕";
    delBtn.title = "Delete";
    delBtn.onclick = () => deleteTodo(originalIndex);

    li.appendChild(textSpan);
    li.appendChild(tickBtn);
    li.appendChild(delBtn);
    todoList.appendChild(li);
  });

  // Update toggle button text
  const pendingCount = todos.filter((t) => !t.completed).length;
  if (todoToggle) {
    todoToggle.textContent = `Tasks ${pendingCount == 0 ? "-" : pendingCount}`;
  }

  if (todoTitle) {
    todoTitle.textContent = showingHistory ? "History" : "Tasks";
  }
}

function toggleTodo(index) {
  todos[index].completed = !todos[index].completed;
  saveTodos();
  renderTodos();
}

function deleteTodo(index) {
  todos.splice(index, 1);
  saveTodos();
  renderTodos();
}

function addTodo(text) {
  if (!text.trim()) return;
  todos.push({ text: text.trim(), completed: false });
  saveTodos();

  if (showingHistory) {
    showingHistory = false;
  }
  renderTodos();
}

function saveTodos() {
  localStorage.setItem("lofi-todos", JSON.stringify(todos));
}

if (historyToggle) {
  historyToggle.addEventListener("click", () => {
    showingHistory = !showingHistory;
    renderTodos();
  });
}

if (todoToggle) {
  todoToggle.addEventListener("click", () => {
    todoMenu.classList.toggle("hidden");
  });
}

document.addEventListener("click", (e) => {
  if (
    todoMenu &&
    !todoMenu.classList.contains("hidden") &&
    todoWrapper &&
    !todoWrapper.contains(e.target)
  ) {
    todoMenu.classList.add("hidden");
  }
});

if (todoInput) {
  todoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      addTodo(todoInput.value);
      todoInput.value = "";
      if (todoMenu && todoMenu.classList.contains("hidden")) {
        todoMenu.classList.remove("hidden");
      }
    }
  });
}

renderTodos();
