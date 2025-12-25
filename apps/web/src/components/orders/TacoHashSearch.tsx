import { Button, Input } from '@tacocrew/ui-kit';
import { ArrowRight, Link } from 'lucide-react';
import { type KeyboardEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetTacoByTacoID } from '@/lib/api/tacos';
import type { TacoOrder } from '@/lib/api/types';

type TacoHashSearchProps = Readonly<{
  onSelectTaco: (taco: TacoOrder) => void;
  disabled?: boolean;
}>;

export function TacoHashSearch({ onSelectTaco, disabled }: TacoHashSearchProps) {
  const { t } = useTranslation();
  const [hash, setHash] = useState('');
  const getTaco = useGetTacoByTacoID();

  // Handle successful fetch
  useEffect(() => {
    if (getTaco.data) {
      onSelectTaco(getTaco.data);
      setHash('');
      getTaco.reset();
    }
  }, [getTaco.data, onSelectTaco, getTaco]);

  const handleSearch = async () => {
    if (!hash.trim()) {
      return;
    }

    try {
      await getTaco.mutateAsync(hash.trim());
    } catch (_error_) {
      // Error is handled by the mutation
    }
  };

  const error = getTaco.error ? t('orders.create.hashSearch.errors.notFound') : null;
  const isLoading = getTaco.isPending;

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && !disabled) {
      handleSearch();
    }
  };

  return (
    <div className="space-y-2 border-white/10 border-b pb-3 sm:space-y-3 sm:pb-4">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link size={14} className="shrink-0 text-blue-300 sm:w-4" />
        <span className="font-medium text-white text-xs sm:text-sm">
          {t('orders.create.hashSearch.title')}
        </span>
      </div>
      <div className="flex gap-1.5 sm:gap-2">
        <Input
          type="text"
          placeholder={t('orders.create.hashSearch.placeholder')}
          value={hash}
          onChange={(e) => {
            setHash(e.target.value);
          }}
          onKeyDown={handleKeyPress}
          disabled={disabled || isLoading}
          className="flex-1 font-mono text-xs sm:text-sm"
        />
        <Button
          type="button"
          onClick={handleSearch}
          disabled={disabled || isLoading || !hash.trim()}
          loading={isLoading}
          className="aspect-square shrink-0 p-0 sm:p-0"
        >
          <ArrowRight size={14} className="sm:w-4" />
        </Button>
      </div>
      {error && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-1.5 sm:p-2">
          <p className="text-[10px] text-amber-200 sm:text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
