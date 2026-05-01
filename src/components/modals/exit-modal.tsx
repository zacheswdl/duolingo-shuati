"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExitModal } from "@/store/use-exit-modal";

export const ExitModal = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { isOpen, close } = useExitModal();

  useEffect(() => setIsClient(true), []);

  if (!isClient) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center w-full justify-center mb-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl">
              🏃
            </div>
          </div>
          <DialogTitle className="text-center font-bold text-2xl text-slate-700">
            确定要离开吗？
          </DialogTitle>
          <DialogDescription className="text-center text-base text-slate-500">
            当前进度不会被保存哦
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-y-3 mt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              close();
              router.push("/learn");
            }}
          >
            确认离开
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={close}
          >
            继续答题
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
