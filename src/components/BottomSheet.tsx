import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export const BottomSheet = ({ open, onOpenChange, title, children }: BottomSheetProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bottom-0 top-auto translate-y-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};
