import { Button, Input, Modal, toast } from '@tacocrew/ui-kit';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useTransferGroupOrderLeader } from '@/lib/api/orders';
import { useOrganizationMembers } from '@/lib/api/organization';
import type { GroupOrder } from '@/lib/api/types';

type TransferLeaderDialogProps = Readonly<{
  groupOrder: GroupOrder;
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}>;

export function TransferLeaderDialog({
  groupOrder,
  organizationId,
  isOpen,
  onClose,
  onSuccess,
}: TransferLeaderDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const membersQuery = useOrganizationMembers(organizationId, isOpen);
  const transferLeader = useTransferGroupOrderLeader();

  const eligibleMembers = useMemo(() => {
    const members = membersQuery.data ?? [];
    return members.filter((m) => m.status === 'ACTIVE' && m.userId !== groupOrder.leader.id);
  }, [membersQuery.data, groupOrder.leader.id]);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return eligibleMembers;
    const query = search.toLowerCase();
    return eligibleMembers.filter(
      (m) =>
        m.user.name?.toLowerCase().includes(query) || m.user.email?.toLowerCase().includes(query)
    );
  }, [eligibleMembers, search]);

  const selectedMember = eligibleMembers.find((m) => m.userId === selectedMemberId);

  const handleTransfer = async () => {
    if (!selectedMemberId) return;

    try {
      await transferLeader.mutateAsync({
        groupOrderId: groupOrder.id,
        newLeaderId: selectedMemberId,
      });

      const memberName = selectedMember?.user.name ?? '';
      toast.success(t('orders.detail.transferLeader.success', { memberName }));
      setSelectedMemberId(null);
      setSearch('');
      onSuccess();
      onClose();
    } catch (_error) {
      toast.error(t('orders.detail.transferLeader.error'));
    }
  };

  const handleClose = () => {
    setSelectedMemberId(null);
    setSearch('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('orders.detail.transferLeader.title')}
      description={t('orders.detail.transferLeader.description')}
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('orders.detail.transferLeader.searchPlaceholder')}
            className="pl-9"
          />
        </div>

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {membersQuery.isLoading && (
            <p className="py-4 text-center text-slate-400 text-sm">{t('common.loading')}</p>
          )}

          {!membersQuery.isLoading && filteredMembers.length === 0 && (
            <p className="py-4 text-center text-slate-400 text-sm">
              {search.trim()
                ? t('orders.detail.transferLeader.noResults')
                : t('orders.detail.transferLeader.noMembers')}
            </p>
          )}

          {filteredMembers.map((member) => (
            <button
              key={member.userId}
              type="button"
              onClick={() => setSelectedMemberId(member.userId)}
              disabled={transferLeader.isPending}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                selectedMemberId === member.userId
                  ? 'border-brand-400 bg-brand-500/10'
                  : 'border-transparent hover:bg-white/5'
              }`}
            >
              <UserAvatar userId={member.user.id} name={member.user.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm text-white">{member.user.name}</p>
                <p className="truncate text-slate-400 text-xs">{member.user.email}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-white/10 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={transferLeader.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleTransfer}
            disabled={!selectedMemberId || transferLeader.isPending}
          >
            {transferLeader.isPending
              ? t('orders.detail.transferLeader.transferring')
              : t('orders.detail.transferLeader.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
