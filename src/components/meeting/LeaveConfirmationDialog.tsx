import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeaveConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function LeaveConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Leave Meeting?",
  description = "Are you sure you want to leave this meeting? You can rejoin later if the meeting is still active.",
}: LeaveConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl z-[9999] gap-0 p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-base mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="p-6 pt-2 bg-slate-50/50 gap-3 sm:gap-0 sm:space-x-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Leave Meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
