import React from "react";
import { Pagination } from "../../ui/Pagination";

type PaginationControlsProps = Readonly<{
  total: number;
  page: number;
  pageSize: number;
  setPage: (value: number) => void;
  setPageSize: (value: number) => void;
}>;

export function PaginationControls({
  total,
  page,
  pageSize,
  setPage,
  setPageSize
}: PaginationControlsProps) {
  return (
    <Pagination
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={(value) => {
        setPageSize(value);
        setPage(1);
      }}
    />
  );
}
