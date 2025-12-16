import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tacocrew/ui-kit';
import { Crown, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OrganizationRole } from '@/lib/api/types';

type RoleSelectorProps = Readonly<{
  value: OrganizationRole;
  onValueChange: (value: OrganizationRole) => void;
  disabled?: boolean;
  id?: string;
  triggerClassName?: string;
}>;

function RoleDisplay({ role }: Readonly<{ role: OrganizationRole }>) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      {role === 'ADMIN' ? (
        <>
          <Crown size={14} className="shrink-0" />
          <span>{t('organizations.roles.admin')}</span>
        </>
      ) : (
        <>
          <User size={14} className="shrink-0" />
          <span>{t('organizations.roles.member')}</span>
        </>
      )}
    </div>
  );
}

/**
 * Reusable role selector component with icons
 */
export function RoleSelector({
  value,
  onValueChange,
  disabled = false,
  id,
  triggerClassName,
}: RoleSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(val: string) => onValueChange(val as OrganizationRole)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={triggerClassName}>
        <SelectValue>
          <RoleDisplay role={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="MEMBER">
          <RoleDisplay role="MEMBER" />
        </SelectItem>
        <SelectItem value="ADMIN">
          <RoleDisplay role="ADMIN" />
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
