import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export default function LoadingSpinner({ fullScreen = false }: LoadingSpinnerProps) {
  return (
    <div className={cn(
      "flex items-center justify-center",
      fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-[999]"
    )}>
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
