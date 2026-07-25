import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface ReuseableModalPropstypes {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
  title?: string;
}

export default function ReuseableModal({
  open,
  setOpen,
  children,
  title,
}: ReuseableModalPropstypes) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
