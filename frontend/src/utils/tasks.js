// Shared helpers for tasks persisted in localStorage["tasks"].
const STORAGE_KEY = 'tasks';

export const newTaskId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Read tasks, giving a stable id to any task saved before ids existed.
export const readTasks = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(t => t && typeof t.text === 'string')
      .map(t => ({ id: t.id || newTaskId(), text: t.text, completed: !!t.completed }));
  } catch (e) {
    console.warn('Failed to parse tasks from localStorage', e);
    return [];
  }
};

// Persist tasks (dropping UI-only fields) and notify listeners such as the Task component.
export const writeTasks = (tasks, { notify = true } = {}) => {
  const clean = tasks.map(({ id, text, completed }) => ({ id, text, completed: !!completed }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  if (notify) window.dispatchEvent(new CustomEvent('tasksUpdated'));
};

// Best match for a natural-language query: exact text first, then first substring match.
export const findTaskIndex = (tasks, query) => {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return -1;
  const exact = tasks.findIndex(t => t.text.trim().toLowerCase() === q);
  if (exact !== -1) return exact;
  return tasks.findIndex(t => t.text.toLowerCase().includes(q));
};
