import { Avatar, AvatarFallback, AvatarImage } from '@tacocrew/ui-kit';
import {
  getAvatarSizeClass,
  getAvatarSizePixels,
  getStackedOffsetClass,
  getUserInitials,
} from '@/components/orders/user-utils';
import { getAvatarUrl } from '@/lib/api/user';

type Participant = {
  readonly userId: string;
  readonly name: string | null;
};

type StackedAvatarsProps = {
  readonly participants: Participant[];
  readonly maxVisible?: number;
  readonly size?: 'sm' | 'md';
};

/**
 * Stacked avatar component for displaying multiple participants.
 * Shows overlapping avatars with a count badge if there are more than maxVisible.
 */
export function StackedAvatars({ participants, maxVisible = 5, size = 'sm' }: StackedAvatarsProps) {
  if (participants.length === 0) {
    return null;
  }

  const visible = participants.slice(0, maxVisible);
  const remaining = participants.length - maxVisible;
  const avatarSize = getAvatarSizePixels(size);
  const avatarClass = getAvatarSizeClass(size, 'stacked');
  const offsetClass = getStackedOffsetClass(size);

  return (
    <div className="mx-2 flex items-center overflow-visible">
      {visible.map((participant, index) => (
        <Avatar
          key={participant.userId}
          color="brandHero"
          size={size}
          variant="default"
          className={`${index > 0 ? offsetClass : ''} ${avatarClass} relative rounded-full border border-brand-400 shadow-sm`}
          style={{ zIndex: index + 1 }}
        >
          <AvatarImage
            src={getAvatarUrl(participant.userId, { size: avatarSize })}
            alt={participant.name ?? ''}
          />
          <AvatarFallback>{getUserInitials(participant.name)}</AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <div
          className={`${offsetClass} ${avatarClass} relative flex min-w-8 items-center justify-center rounded-full border border-brand-400 bg-slate-800 px-2 font-semibold text-sm text-white shadow-sm`}
          style={{ zIndex: 10 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
