type Listener = () => void;

const STORAGE_KEY = 'tacobot:developerMode';

class DeveloperModeStore {
  private isEnabled: boolean;
  private readonly listeners = new Set<Listener>();

  constructor() {
    this.isEnabled = this.readFromStorage();
    // Listen for storage changes from other tabs
    globalThis.window.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  private handleStorageChange(event: StorageEvent) {
    // Only handle changes to our storage key
    if (event.key === STORAGE_KEY) {
      // Update state from storage
      this.isEnabled = this.readFromStorage();
      // Notify all listeners about the change
      this.emit();
    }
  }

  public getIsEnabled() {
    return this.isEnabled;
  }

  public setIsEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    this.writeToStorage(enabled);
    this.emit();
  }

  public toggle() {
    this.setIsEnabled(!this.isEnabled);
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

  private readFromStorage(): boolean {
    if (!globalThis.window) {
      return false;
    }
    try {
      return globalThis.window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private writeToStorage(enabled: boolean) {
    if (!globalThis.window) {
      return;
    }
    try {
      if (enabled) {
        globalThis.window.localStorage.setItem(STORAGE_KEY, 'true');
      } else {
        globalThis.window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }
}

export const developerModeStore = new DeveloperModeStore();
