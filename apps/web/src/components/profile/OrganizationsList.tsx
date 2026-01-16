import { Button, Card, CardContent, CardHeader, CardTitle } from '@tacocrew/ui-kit';
import { Check, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OrganizationAvatar } from '@/components/shared/OrganizationAvatar';
import type { Organization } from '@/lib/api/types';

interface OrganizationsListProps {
  readonly organizations: Organization[];
  readonly selectedId: string;
  readonly onSelect: (orgId: string) => void;
  readonly onCreateNew: () => void;
  readonly disabled?: boolean;
}

export function OrganizationsList({
  organizations,
  selectedId,
  onSelect,
  onCreateNew,
  disabled = false,
}: OrganizationsListProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('organizations.list.title')}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateNew}
            className="h-8 w-8 p-0"
            disabled={disabled}
            title={t('organizations.list.add')}
          >
            <Plus size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              className={`group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-200 ${
                org.id === selectedId
                  ? 'border-brand-400/60 bg-brand-500/15 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]'
                  : 'border-white/5 bg-slate-900/30 text-slate-300 hover:border-brand-400/30 hover:bg-slate-800/50 hover:text-white'
              }`}
              onClick={() => onSelect(org.id)}
              disabled={disabled}
            >
              <OrganizationAvatar
                organizationId={org.id}
                name={org.name}
                size="sm"
                imageUrl={org.image}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{org.name}</p>
              </div>
              {org.id === selectedId && <Check size={16} className="shrink-0 text-brand-400" />}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
