import { CheckCircle2, Copy, Edit, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Form, Link } from 'react-router';
import { Button } from '@/components/ui';
import { routes } from '@/lib/routes';

type OrderCardActionsProps = {
  readonly tacoID?: string;
  readonly orderId: string;
  readonly itemId: string;
  readonly canEdit: boolean;
  readonly canDelete: boolean;
  readonly isSubmitting: boolean;
  readonly onDuplicate: () => void;
};

export function OrderCardActions({
  tacoID,
  orderId,
  itemId,
  canEdit,
  canDelete,
  isSubmitting,
  onDuplicate,
}: OrderCardActionsProps) {
  const [copiedTacoID, setCopiedTacoID] = useState<string | null>(null);

  const handleCopyTacoID = async () => {
    if (!tacoID) return;
    try {
      await navigator.clipboard.writeText(tacoID);
      setCopiedTacoID(tacoID);
      setTimeout(() => setCopiedTacoID(null), 2000);
    } catch (err) {
      console.error('Failed to copy tacoID:', err);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-900/70 p-2 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-opacity delay-150 group-hover:opacity-100">
      {tacoID && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopyTacoID}
          className="h-7 w-7 rounded-lg p-0 transition-transform hover:scale-110 hover:bg-emerald-500/25"
          title={copiedTacoID === tacoID ? 'Copied!' : 'Copy tacoID'}
        >
          {copiedTacoID === tacoID ? (
            <CheckCircle2 size={14} className="text-emerald-400" />
          ) : (
            <Tag size={14} className="text-emerald-300" />
          )}
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDuplicate}
        className="h-7 w-7 rounded-lg p-0 transition-transform hover:scale-110 hover:bg-blue-500/25"
        title="Duplicate order"
      >
        <Copy size={14} className="text-blue-300" />
      </Button>
      {canEdit && (
        <Link
          to={routes.root.orderCreate({ orderId, search: { orderId: itemId } })}
          className="cursor-pointer"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-lg p-0 transition-transform hover:scale-110 hover:bg-brand-500/25"
          >
            <Edit size={14} className="text-brand-300" />
          </Button>
        </Link>
      )}
      {canDelete && (
        <Form method="post">
          <input type="hidden" name="_method" value="delete" />
          <input type="hidden" name="itemId" value={itemId} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            className="h-7 w-7 rounded-lg p-0 text-rose-400 transition-transform hover:scale-110 hover:bg-rose-500/25 hover:text-rose-300"
          >
            <Trash2 size={14} />
          </Button>
        </Form>
      )}
    </div>
  );
}
