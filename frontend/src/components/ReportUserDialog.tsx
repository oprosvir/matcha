import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ReportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
  userName?: string;
  selectedReason: string;
  onReasonChange: (reason: string) => void;
}

export function ReportUserDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  userName,
  selectedReason,
  onReasonChange,
}: ReportUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {userName || "User"}</DialogTitle>
          <DialogDescription>
            Please select a reason for reporting this user. Our team will review your report.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={selectedReason} onValueChange={onReasonChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fake_account" id="fake_account" />
              <Label htmlFor="fake_account">Fake Account</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="harassment" id="harassment" />
              <Label htmlFor="harassment">Harassment</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inappropriate_photos" id="inappropriate_photos" />
              <Label htmlFor="inappropriate_photos">Inappropriate Photos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="spam" id="spam" />
              <Label htmlFor="spam">Spam</Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedReason)}
            disabled={isPending}
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
