type Listener = () => void;

const STORAGE_KEY = 'tacobot:developerMode';

class DeveloperModeStore {
  private isEnabled: boolean;
  private listeners = new Set<Listener>();

  constructor() {
    this.isEnabled = this.readFromStorage();
    // Listen for storage changes from other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
    }
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
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private writeToStorage(enabled: boolean) {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (enabled) {
        window.localStorage.setItem(STORAGE_KEY, 'true');
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }
}

export const developerModeStore = new DeveloperModeStore();
