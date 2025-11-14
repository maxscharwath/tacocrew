import { ArrowRight, Link } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@/components/ui';
import { TacosApi } from '@/lib/api';
import type { TacoOrder } from '@/lib/api/types';

type TacoHashSearchProps = {
  readonly onSelectTaco: (taco: TacoOrder) => void;
  readonly disabled?: boolean;
};

export function TacoHashSearch({ onSelectTaco, disabled }: TacoHashSearchProps) {
  const { t } = useTranslation();
  const [hash, setHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!hash.trim()) {
      setError(t('orders.create.hashSearch.errors.empty'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const taco = await TacosApi.getTacoByTacoID(hash.trim());
      onSelectTaco(taco);
      setHash(''); // Clear input on success
      setError(null);
    } catch (error_) {
      // Log error for debugging but don't expose to user
      console.error('Failed to fetch taco by hash:', error_);
      setError(t('orders.create.hashSearch.errors.notFound'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && !disabled) {
      handleSearch();
    }
  };

  return (
    <div className="space-y-3 border-white/10 border-b pb-4">
      <div className="flex items-center gap-2">
        <Link size={16} className="shrink-0 text-blue-300" />
        <span className="font-medium text-sm text-white">
          {t('orders.create.hashSearch.title')}
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={t('orders.create.hashSearch.placeholder')}
          value={hash}
          onChange={(e) => {
            setHash(e.target.value);
            setError(null);
          }}
          onKeyPress={handleKeyPress}
          disabled={disabled || isLoading}
          className="flex-1 font-mono text-sm"
        />
        <Button
          type="button"
          onClick={handleSearch}
          disabled={disabled || isLoading || !hash.trim()}
          loading={isLoading}
          className="shrink-0"
        >
          <ArrowRight size={16} />
        </Button>
      </div>
      {error && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-2">
          <p className="text-amber-200 text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
