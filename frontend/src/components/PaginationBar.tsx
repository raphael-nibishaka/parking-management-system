import type { PaginatedMeta } from "../api";

type Props = {
  meta: PaginatedMeta;
  onChange: (page: number) => void;
};

export function PaginationBar({ meta, onChange }: Props) {
  const { page, totalPages } = meta;
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button type="button" className="btn ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span className="pagination-meta">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="btn ghost"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
