import { useSyncExternalStore } from 'react';
import { developerModeStore } from '../lib/developer-mode/store';

export function useDeveloperMode() {
  const isEnabled = useSyncExternalStore(
    (listener) => developerModeStore.subscribe(listener),
    () => developerModeStore.getIsEnabled(),
    () => false
  );

  const toggle = () => developerModeStore.toggle();
  const setIsEnabled = (enabled: boolean) => developerModeStore.setIsEnabled(enabled);

  return {
    isEnabled,
    toggle,
    setIsEnabled,
  };
}
