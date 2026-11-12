"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadImageAction } from "@/lib/upload-actions";
import { cn } from "@/lib/utils";

type Folder = "products" | "categories" | "banners";

export function ImageUpload({
  value,
  onChange,
  folder,
  aspectClassName = "aspect-square",
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder: Folder;
  aspectClassName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadImageAction(folder, formData);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      onChange(result.data.url);
    });
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative flex w-full max-w-[220px] items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-secondary",
          aspectClassName,
        )}
      >
        {value ? (
          <>
            <Image src={value} alt="" fill className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white hover:bg-black"
              aria-label="Remover imagem"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="flex flex-col items-center gap-2 p-4 text-muted-foreground hover:text-foreground"
          >
            {isPending ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <ImagePlus className="size-6" />
            )}
            <span className="text-xs">{isPending ? "Enviando..." : "Enviar imagem"}</span>
          </button>
        )}
      </div>

      {value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Trocar imagem
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="text-sm text-status-danger-fg">{error}</p>}
    </div>
  );
}
