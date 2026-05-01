"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePracticeModal } from "@/store/use-practice-modal";

export const PracticeModal = () => {
  const [isClient, setIsClient] = useState(false);
  const { isOpen, close } = usePracticeModal();

  useEffect(() => setIsClient(true), []);

  if (!isClient) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center w-full justify-center mb-4">
            <div className="w-20 h-20 bg-[#ffc800] rounded-full flex items-center justify-center text-4xl">
              🎉
            </div>
          </div>
          <DialogTitle className="text-center font-bold text-2xl text-slate-700">
            太棒了！复习时间到！
          </DialogTitle>
          <DialogDescription className="text-center text-base text-slate-500">
            你已经掌握了这一章的内容！
            <br />
            来复习一下错题巩固知识吧
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-y-3 mt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={close}
          >
            继续练习
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
