import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
  userName?: string;
}

export function BlockUserDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  userName,
}: BlockUserDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Block {userName ? `${userName}` : "this user"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will:
          </AlertDialogDescription>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground ml-4">
            <li>Remove your match with this user</li>
            <li>Hide your profile from them</li>
            <li>You won't be able to message each other</li>
          </ul>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {isPending ? "Blocking..." : "Block User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
