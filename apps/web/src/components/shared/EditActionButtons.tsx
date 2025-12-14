import { Button } from '@tacocrew/ui-kit';
import { Check, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type EditActionButtonsProps = {
  readonly isSaving: boolean;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly saveDisabled?: boolean;
  readonly size?: 'sm' | 'xs';
};

export function EditActionButtons({
  isSaving,
  onSave,
  onCancel,
  saveDisabled,
  size = 'sm',
}: EditActionButtonsProps) {
  const { t } = useTranslation();
  const buttonClass = size === 'sm' ? 'h-11 w-11 p-0' : 'h-9 w-9 p-0';
  const iconSize = size === 'sm' ? 16 : 14;

  return (
    <>
      <Button
        onClick={onSave}
        disabled={isSaving || saveDisabled}
        variant="default"
        size="sm"
        className={buttonClass}
        title={isSaving ? t('account.saving') : t('account.save')}
      >
        {isSaving ? (
          <RefreshCw size={iconSize} className="animate-spin" />
        ) : (
          <Check size={iconSize} />
        )}
      </Button>
      <Button
        onClick={onCancel}
        disabled={isSaving}
        variant="outline"
        size="sm"
        className={buttonClass}
        title={t('account.cancel')}
      >
        <X size={iconSize} />
      </Button>
    </>
  );
}
