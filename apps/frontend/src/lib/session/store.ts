import type { Session } from './types';

const STORAGE_KEY = 'tacobot.session';

type Listener = () => void;

class SessionStore {
  private session: Session | null;
  private listeners = new Set<Listener>();

  constructor() {
    this.session = this.readFromStorage();
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
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
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
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
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
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore storage errors
    }
  }
}

export const sessionStore = new SessionStore();
