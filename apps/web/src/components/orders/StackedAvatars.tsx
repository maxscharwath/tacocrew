import { Avatar } from '@/components/ui';
import { getAvatarUrl } from '@/lib/api/user';
import {
  getAvatarSizeClass,
  getAvatarSizePixels,
  getStackedOffsetClass,
  getUserInitials,
} from './user-utils';

type Participant = {
  readonly userId: string;
  readonly name: string | null;
};

type StackedAvatarsProps = {
  readonly participants: Participant[];
  readonly maxVisible?: number;
  readonly maxStack?: number;
  readonly size?: 'sm' | 'md';
};

/**
 * Stacked avatar component for displaying multiple participants
 * Shows overlapping avatars with a count badge if there are more than maxVisible
 */
export function StackedAvatars({
  participants,
  maxVisible = 3,
  maxStack = 5,
  size = 'sm',
}: StackedAvatarsProps) {
  if (participants.length === 0) {
    return null;
  }

  const maxToShow = Math.min(maxVisible, maxStack);
  const visible = participants.slice(0, maxToShow);
  const remaining = participants.length - maxToShow;
  const avatarSize = getAvatarSizePixels(size);
  const avatarClass = getAvatarSizeClass(size, 'stacked');
  const offsetClass = getStackedOffsetClass(size);

  return (
    <div className="flex items-center">
      {visible.map((participant, index) => {
        const avatarUrl = getAvatarUrl(participant.userId, { size: avatarSize });

        return (
          <div
            key={participant.userId}
            className={`${index > 0 ? offsetClass : ''} relative overflow-hidden rounded-full border-2 border-slate-900`}
            style={{ zIndex: visible.length - index }}
          >
            <Avatar
              color="brandHero"
              size={size}
              variant="default"
              src={avatarUrl}
              className={`${avatarClass} border-0`}
            >
              {getUserInitials(participant.name)}
            </Avatar>
          </div>
        );
      })}
      {remaining > 0 && (
        <div
          className={`${offsetClass} relative flex items-center justify-center rounded-full border-2 border-slate-900 bg-slate-800 ${avatarClass} font-semibold text-slate-300 text-xs`}
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
