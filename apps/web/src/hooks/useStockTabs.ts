/**
 * Stock tabs state management hook
 * Manages active tab with validation when sections change
 */

import { useEffect, useState } from 'react';
import type { StockResponse } from '@/lib/api';
import type { StockSectionKey } from './useStockSections';

interface UseStockTabsState {
  activeTab: StockSectionKey;
  setActiveTab: (key: StockSectionKey) => void;
}

/**
 * Manage active stock tab with automatic fallback when sections change
 */
export function useStockTabs(
  sections: Array<{ key: StockSectionKey }>,
  initialTab: StockSectionKey
): UseStockTabsState {
  const [activeTab, setActiveTab] = useState<StockSectionKey>(initialTab);

  useEffect(() => {
    if (sections.length === 0) {
      return;
    }

    // Validate that active tab still exists in current sections
    const stillValid = sections.some((section) => section.key === activeTab);
    if (!stillValid) {
      // Fallback to first section
      setActiveTab(sections[0].key);
    }
  }, [sections, activeTab]);

  return {
    activeTab,
    setActiveTab,
  };
}
