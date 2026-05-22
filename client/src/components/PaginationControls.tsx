import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  label?: string;
};

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const start = Math.max(0, (page - 1) * pageSize);
  return items.slice(start, start + pageSize);
}

export function getTotalPages(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  label = "items",
}: PaginationControlsProps) {
  const totalPages = getTotalPages(totalItems, pageSize);
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  if (totalItems <= pageSize) return null;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="font-semibold text-slate-500">
        Showing {start}-{end} of {totalItems} {label}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-9 rounded-lg"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="min-w-20 text-center text-xs font-black uppercase tracking-wide text-slate-400">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="h-9 rounded-lg"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
