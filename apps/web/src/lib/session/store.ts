import type { Session } from './types';

const STORAGE_KEY = 'tacobot.session';

type Listener = () => void;

class SessionStore {
  private session: Session | null;
  private readonly listeners = new Set<Listener>();

  constructor() {
    this.session = this.readFromStorage();
    globalThis.window?.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  private handleStorageChange(event: StorageEvent) {
    // Only handle changes to our storage key
    if (event.key === STORAGE_KEY) {
      // Update session from storage (could be null if cleared)
      this.session = this.readFromStorage();
      // Notify all listeners about the change
      this.emit();
    }
  }

  public getSession() {
    return this.session;
  }

  public setSession(session: Session) {
    this.session = session;
    this.writeToStorage(session);
    this.emit();
  }

  public clearSession() {
    this.session = null;
    try {
      if (globalThis.window) {
        globalThis.window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
    this.emit();
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private readFromStorage(): Session | null {
    if (!globalThis.window) {
      return null;
    }
    try {
      const raw = globalThis.window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Session;
      if (!parsed?.token || !parsed?.username || !parsed?.userId) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private writeToStorage(session: Session) {
    if (!globalThis.window) {
      return;
    }
    try {
      globalThis.window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore storage errors
    }
  }
}

export const sessionStore = new SessionStore();
