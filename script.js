const STORAGE_KEY = "domashkaRadar.tasks";
const REMIND_KEY = "domashkaRadar.reminders";
const COLORS = ["#ff7a7a", "#ffb84d", "#ffe066", "#7be08a", "#5fd4e8", "#8fa2ff", "#d88cff", "#ff8fc7"];

const els = {
  tomorrow: document.getElementById("tomorrow"),
  tomorrowEmpty: document.getElementById("tomorrow-empty"),
  bring: document.getElementById("bring"),
  bringSection: document.getElementById("bring-section"),
  week: document.getElementById("week"),
  weekEmpty: document.getElementById("week-empty"),
  overlay: document.getElementById("form-overlay"),
  form: document.getElementById("task-form"),
  subject: document.getElementById("subject"),
  text: document.getElementById("text"),
  due: document.getElementById("due"),
  openBtn: document.getElementById("open-form"),
  cancelBtn: document.getElementById("cancel"),
  remindOverlay: document.getElementById("remind-overlay"),
  remindForm: document.getElementById("remind-form"),
  remindText: document.getElementById("remind-text"),
  remindDate: document.getElementById("remind-date"),
  openRemindBtn: document.getElementById("open-remind"),
  cancelRemindBtn: document.getElementById("remind-cancel"),
};

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadReminders() {
  try {
    return JSON.parse(localStorage.getItem(REMIND_KEY)) || [];
  } catch {
    return [];
  }
}

function saveReminders(items) {
  localStorage.setItem(REMIND_KEY, JSON.stringify(items));
}

// Локальная дата в формате YYYY-MM-DD (без сдвига из-за UTC)
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function colorFor(subject) {
  let hash = 0;
  for (const ch of subject.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" });
}

function makeCard(task) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.background = colorFor(task.subject);

  const info = document.createElement("div");
  const subj = document.createElement("div");
  subj.className = "subject";
  subj.textContent = task.subject;
  const text = document.createElement("div");
  text.className = "text";
  text.textContent = task.text;
  const date = document.createElement("div");
  date.className = "date";
  date.textContent = "Сдать: " + formatDate(task.due);
  info.append(subj, text, date);

  const done = document.createElement("button");
  done.className = "done";
  done.textContent = "Готово";
  done.addEventListener("click", () => {
    saveTasks(loadTasks().filter((t) => t.id !== task.id));
    render();
  });

  card.append(info, done);
  return card;
}

// Список "Levar": независимые напоминания о том, что взять с собой
function makeBringItem(item) {
  const li = document.createElement("li");
  const what = document.createElement("span");
  what.className = "bring-what";
  what.textContent = item.text;
  const when = document.createElement("span");
  when.className = "bring-date";
  when.textContent = formatDate(item.date);
  const done = document.createElement("button");
  done.className = "done";
  done.textContent = "Готово";
  done.addEventListener("click", () => {
    saveReminders(loadReminders().filter((r) => r.id !== item.id));
    render();
  });
  li.append(what, when, done);
  return li;
}

function renderBring() {
  const items = loadReminders().sort((a, b) => a.date.localeCompare(b.date) || a.created - b.created);
  els.bring.replaceChildren(...items.map(makeBringItem));
  els.bringSection.hidden = items.length === 0;
}

function render() {
  renderBring();
  const tasks = loadTasks().sort((a, b) => a.due.localeCompare(b.due) || a.created - b.created);
  const today = new Date();
  const tomorrowISO = toISODate(addDays(today, 1));
  const weekEndISO = toISODate(addDays(today, 7));

  const tomorrow = tasks.filter((t) => t.due === tomorrowISO);
  const week = tasks.filter((t) => t.due > tomorrowISO && t.due <= weekEndISO);

  els.tomorrow.replaceChildren(...tomorrow.map(makeCard));
  els.week.replaceChildren(...week.map(makeCard));
  els.tomorrowEmpty.hidden = tomorrow.length > 0;
  els.weekEmpty.hidden = week.length > 0;
}

function openForm() {
  els.form.reset();
  els.due.value = toISODate(addDays(new Date(), 1));
  els.overlay.classList.remove("hidden");
  els.subject.focus();
}

function closeForm() {
  els.overlay.classList.add("hidden");
}

function openRemind() {
  els.remindForm.reset();
  els.remindDate.value = toISODate(addDays(new Date(), 1));
  els.remindOverlay.classList.remove("hidden");
  els.remindText.focus();
}

function closeRemind() {
  els.remindOverlay.classList.add("hidden");
}

els.openBtn.addEventListener("click", openForm);
els.cancelBtn.addEventListener("click", closeForm);
els.overlay.addEventListener("click", (e) => {
  if (e.target === els.overlay) closeForm();
});

els.openRemindBtn.addEventListener("click", openRemind);
els.cancelRemindBtn.addEventListener("click", closeRemind);
els.remindOverlay.addEventListener("click", (e) => {
  if (e.target === els.remindOverlay) closeRemind();
});

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const tasks = loadTasks();
  tasks.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    subject: els.subject.value.trim(),
    text: els.text.value.trim(),
    due: els.due.value,
    created: Date.now(),
  });
  saveTasks(tasks);
  closeForm();
  render();
});

els.remindForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const items = loadReminders();
  items.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    text: els.remindText.value.trim(),
    date: els.remindDate.value,
    created: Date.now(),
  });
  saveReminders(items);
  closeRemind();
  render();
});

render();
