import { Button, Modal } from '@tacocrew/ui-kit';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

type OrderConfirmationModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

export function OrderConfirmationModal({ isOpen, onClose }: OrderConfirmationModalProps) {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    if (isOpen) {
      // Set window size immediately
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      setShowConfetti(true);

      // Stop confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {showConfetti &&
        typeof document !== 'undefined' &&
        createPortal(
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}
          />,
          document.body
        )}
      <Modal isOpen={isOpen} onClose={onClose} title={t('orders.submit.confirmation.title')}>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="font-bold text-white text-xl">
              {t('orders.submit.confirmation.successTitle')}
            </h3>
            <p className="text-slate-400 text-sm">
              {t('orders.submit.confirmation.successMessage')}
            </p>
          </div>
          <Button onClick={onClose} fullWidth className="mt-4">
            {t('orders.submit.confirmation.closeButton')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
