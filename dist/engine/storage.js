export const SAVE_KEY = 'ember-skylands-save-v1';
export function readSave() {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}
export function writeSave(value) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
}
export function readSettings() {
  try {
    return JSON.parse(localStorage.getItem('ember-settings')) || {};
  } catch {
    return {};
  }
}
export function writeSettings(value) {
  try {
    localStorage.setItem('ember-settings', JSON.stringify(value));
  } catch {}
}
