const KEY = "taskflow.tasks.v1";
export function loadTasks() {
  try { const value = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
export function saveTasks(tasks) { localStorage.setItem(KEY, JSON.stringify(tasks)); }
