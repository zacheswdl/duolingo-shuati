"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHeartsModal } from "@/store/use-hearts-modal";

export const HeartsModal = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { isOpen, close } = useHeartsModal();

  useEffect(() => setIsClient(true), []);

  const onClick = () => {
    close();
    router.push("/mistakes");
  };

  if (!isClient) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) return; }}>
      <DialogContent className="max-w-md rounded-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center w-full justify-center mb-4">
            <Icon name="frown" size={80} />
          </div>
          <DialogTitle className="text-center font-bold text-2xl text-slate-700">
            红心耗尽！😢
          </DialogTitle>
          <DialogDescription className="text-center text-base text-slate-500">
            快去错题本复习恢复红心吧！
            <br />
            每答对1道错题可恢复1颗❤️
            <br />
            红心每天0点自动恢复满
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-y-3 mt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onClick}
          >
            去错题本恢复红心
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
};
