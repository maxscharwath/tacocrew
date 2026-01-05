import { useState } from 'react';

export function useCopyFeedback() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_error) {
      // Clipboard access may fail in some contexts, silently ignore
    }
  };

  return {
    isCopied,
    copyToClipboard,
  };
}

