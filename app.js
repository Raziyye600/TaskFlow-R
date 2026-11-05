import { loadTasks, saveTasks } from "./storage.js";

let tasks = loadTasks();
const $ = (id) => document.getElementById(id);
const labels = { todo: "Gözləyir", doing: "Davam edir", done: "Tamamlandı" };
const dialog = $("taskDialog");

function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  window.setTimeout(() => el.classList.remove("show"), 2300);
}
function persist() { saveTasks(tasks); render(); }
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
function taskMarkup(task) {
  const date = task.date ? new Date(task.date + "T00:00:00").toLocaleDateString("az-AZ") : "";
  return `<article class="task-row">
    <input class="task-check" type="checkbox" data-complete="${task.id}" ${task.status === "done" ? "checked" : ""} aria-label="Tapşırığı tamamla">
    <div class="task-main"><strong>${escapeHTML(task.title)}</strong>${task.description ? `<p>${escapeHTML(task.description)}</p>` : ""}</div>
    <div class="task-meta">${date ? `<span>${date}</span>` : ""}<span class="priority ${task.priority}">${task.priority === "high" ? "Yüksək prioritet" : task.priority === "low" ? "Aşağı prioritet" : "Normal"}</span><span class="pill ${task.status}">${labels[task.status]}</span></div>
    <button class="delete-btn" data-delete="${task.id}" aria-label="Tapşırığı sil">×</button>
  </article>`;
}
function render() {
  $("totalCount").textContent = tasks.length;
  $("progressCount").textContent = tasks.filter(t => t.status === "doing").length;
  $("doneCount").textContent = tasks.filter(t => t.status === "done").length;
  $("projectTaskCount").textContent = `${tasks.length} tapşırıq`;
  const query = $("searchInput").value.trim().toLocaleLowerCase("az");
  const filtered = tasks.filter(t => `${t.title} ${t.description}`.toLocaleLowerCase("az").includes(query));
  $("recentTasks").innerHTML = filtered.slice(0, 5).map(taskMarkup).join("") || emptyState("Hələ tapşırıq yoxdur. İlk tapşırığını yarat.");
  const status = $("statusFilter").value;
  const all = filtered.filter(t => status === "all" || t.status === status);
  $("allTasks").innerHTML = all.map(taskMarkup).join("") || emptyState("Bu siyahıda tapşırıq yoxdur.");
  for (const state of ["todo", "doing", "done"]) {
    const list = filtered.filter(t => t.status === state);
    $(`${state}Badge`).textContent = list.length;
    $(`${state}Column`).innerHTML = list.map(t => `<div class="board-card"><strong>${escapeHTML(t.title)}</strong>${t.date ? `<p>${new Date(t.date+"T00:00:00").toLocaleDateString("az-AZ")}</p>` : ""}<select data-status="${t.id}" aria-label="Statusu dəyiş">${Object.entries(labels).map(([k,v]) => `<option value="${k}" ${k===state?"selected":""}>${v}</option>`).join("")}</select></div>`).join("") || `<p class="muted">Burada hələ heç nə yoxdur.</p>`;
  }
}
function emptyState(message) { return `<div class="project-card"><p>${escapeHTML(message)}</p></div>`; }
function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  $(`${name}View`).classList.remove("hidden");
  document.querySelectorAll(".nav-item[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  $("pageTitle").textContent = ({dashboard:"İdarə paneli",tasks:"Bütün tapşırıqlar",projects:"Layihələr",board:"Kanban lövhəsi"})[name];
}
document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.goto)));
$("addTaskBtn").addEventListener("click", () => { $("taskForm").reset(); dialog.showModal(); $("taskTitle").focus(); });
$("closeDialog").addEventListener("click", () => dialog.close());
$("cancelDialog").addEventListener("click", () => dialog.close());
$("taskForm").addEventListener("submit", event => {
  event.preventDefault();
  const title = $("taskTitle").value.trim();
  if (!title) return;
  tasks.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title, description: $("taskDescription").value.trim(), date: $("taskDate").value, priority: $("taskPriority").value, status: $("taskStatus").value, created: new Date().toISOString() });
  persist(); dialog.close(); toast("Tapşırıq yadda saxlanıldı.");
});
document.addEventListener("click", event => {
  const del = event.target.closest("[data-delete]");
  if (del && confirm("Bu tapşırığı silmək istəyirsən?")) { tasks = tasks.filter(t => t.id !== del.dataset.delete); persist(); toast("Tapşırıq silindi."); }
});
document.addEventListener("change", event => {
  if (event.target.matches("[data-complete]")) {
    const task = tasks.find(t => t.id === event.target.dataset.complete);
    if (task) { task.status = event.target.checked ? "done" : "todo"; persist(); toast("Status yeniləndi."); }
  }
  if (event.target.matches("[data-status]")) {
    const task = tasks.find(t => t.id === event.target.dataset.status);
    if (task) { task.status = event.target.value; persist(); toast("Status yeniləndi."); }
  }
});
$("searchInput").addEventListener("input", render);
$("statusFilter").addEventListener("change", render);
$("themeToggle").addEventListener("click", () => { document.body.classList.toggle("dark"); localStorage.setItem("taskflow.dark", document.body.classList.contains("dark") ? "1" : "0"); });
if (localStorage.getItem("taskflow.dark") === "1") document.body.classList.add("dark");
render();
