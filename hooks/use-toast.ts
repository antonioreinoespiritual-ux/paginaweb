"use client";

export function useToast() {
  return {
    toast: ({ title }: { title: string }) => alert(title)
  };
}
