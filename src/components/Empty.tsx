import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Empty component
export function Empty({ error }: { error?: Error }) {
  return (
    <div className={cn("flex h-full items-center justify-center flex-col gap-2 p-4")}>
      {error ? (
        <>
          <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
          <p className="text-red-600 text-center">{error.message}</p>
        </>
      ) : (
        <p>暂无数据</p>
      )}
    </div>
  );
}