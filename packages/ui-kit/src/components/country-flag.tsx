import { useEffect, useState } from 'react';
import { cn } from '../utils';

type CountryFlagProps = Readonly<{
  countryCode: string;
  size?: 'sm' | 'md';
  className?: string;
}>;

export function CountryFlag({ countryCode, size = 'md', className }: CountryFlagProps) {
  const [FlagComponent, setFlagComponent] = useState<React.ComponentType<{ title?: string; className?: string }> | null>(null);

  useEffect(() => {
    const loadFlag = async () => {
      try {
        const flagsModule = await import('country-flag-icons/react/3x2');
        const component = flagsModule[countryCode as keyof typeof flagsModule];
        setFlagComponent(() => component || null);
      } catch {
        setFlagComponent(null);
      }
    };
    void loadFlag();
  }, [countryCode]);

  const sizeClasses = size === 'sm' ? 'h-4 w-6' : 'h-5 w-[30px]';

  if (!FlagComponent) {
    return <span className={cn('inline-block rounded bg-slate-600', sizeClasses, className)} />;
  }

  return (
    <FlagComponent
      title={countryCode}
      className={cn('inline-block aspect-3/2 overflow-hidden rounded', sizeClasses, className)}
    />
  );
}

