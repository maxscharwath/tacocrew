import { Crown, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import type { OrganizationRole } from '@/lib/api/types';

type RoleSelectorProps = {
  readonly value: OrganizationRole;
  readonly onValueChange: (value: OrganizationRole) => void;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly className?: string;
  readonly triggerClassName?: string;
};

/**
 * Reusable role selector component with icons
 */
export function RoleSelector({
  value,
  onValueChange,
  disabled = false,
  id,
  className,
  triggerClassName,
}: RoleSelectorProps) {
  const { t } = useTranslation();

  const RoleDisplay = ({ role }: { role: OrganizationRole }) => (
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

  return (
    <Select
      value={value}
      onValueChange={(val) => onValueChange(val as OrganizationRole)}
      disabled={disabled}
      className={className}
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
