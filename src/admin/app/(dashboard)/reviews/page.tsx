"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { FileSpreadsheet, Star, Trash2, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import type { AdminReviewRow } from "@/lib/api-types";
import { fetchAdminReviews, deleteAdminReview } from "@/lib/admin-api";
import { AdminPagination } from "@/components/admin-pagination";
import { exportToCsv } from "@/lib/export-excel";
import { errorMessage, formatDateTimeVi } from "@/lib/format";

const RATING_FILTERS = [
  { value: 0, label: "Tất cả sao" },
  { value: 5, label: "5 sao (Rất tốt)" },
  { value: 4, label: "4 sao (Tốt)" },
  { value: 3, label: "3 sao (Bình thường)" },
  { value: 2, label: "2 sao (Kém)" },
  { value: 1, label: "1 sao (Rất tệ)" },
];

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<AdminReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const res = await fetchAdminReviews({
      page,
      pageSize,
      rating: ratingFilter > 0 ? ratingFilter : undefined,
      search: search.trim() || undefined,
    });
    if (res.ok) {
      setRows(res.data.items);
      setTotal(res.data.total);
    } else {
      setErr(errorMessage(res.body, res.status));
    }
    setLoading(false);
  }, [page, pageSize, ratingFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này không? Điểm trung bình và tổng số đánh giá của tour sẽ được tự động tính toán lại.")) {
      return;
    }

    setDeletingId(id);
    const res = await deleteAdminReview(id);
    setDeletingId(null);

    if (res.ok) {
      setSuccessMsg("Đã xóa đánh giá thành công.");
      setTimeout(() => setSuccessMsg(null), 4000);
      load();
    } else {
      setErr(errorMessage(res.body, res.status));
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await fetchAdminReviews({
        page: 1,
        pageSize: 1000,
        rating: ratingFilter > 0 ? ratingFilter : undefined,
        search: search.trim() || undefined,
      });
      const dataRows = res.ok ? res.data.items : rows;

      const headers = [
        "Mã ĐG",
        "Khách hàng",
        "Email",
        "Tour",
        "Số sao",
        "Nội dung nhận xét",
        "Thời gian gửi",
      ];

      const csvData = dataRows.map((r) => [
        `#${r.id}`,
        r.user.fullName,
        r.user.email,
        r.tour.name,
        `${r.rating} / 5`,
        r.comment ?? "",
        r.createdAtUtc ? formatDateTimeVi(r.createdAtUtc) : "",
      ]);

      exportToCsv("danh-sach-danh-gia", headers, csvData);
    } catch {
      alert("Xuất dữ liệu thất bại.");
    }
  };

  return (
    <>
      <AdminHeader
        title="Quản lý đánh giá & bình luận"
        subtitle="Kiểm duyệt, lọc và xóa các đánh giá tour không phù hợp từ khách hàng."
      />

      <main className="flex-1 space-y-4 overflow-auto p-5 sm:p-6 text-slate-800 dark:text-slate-100">
        {/* Thanh công cụ tìm kiếm và lọc */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-1 items-center gap-2"
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên tour, khách hàng, nội dung..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 active:scale-95"
            >
              Tìm kiếm
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span>Lọc sao:</span>
              <select
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {RATING_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Thông báo */}
        {err && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <p>{err}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Bảng danh sách đánh giá */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200">
              <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-3.5">ID</th>
                  <th scope="col" className="px-5 py-3.5">Khách hàng</th>
                  <th scope="col" className="px-5 py-3.5">Tour</th>
                  <th scope="col" className="px-5 py-3.5">Đánh giá</th>
                  <th scope="col" className="px-5 py-3.5">Nhận xét</th>
                  <th scope="col" className="px-5 py-3.5">Thời gian</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      Đang tải danh sách đánh giá...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      Không có đánh giá nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                        #{r.id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {r.user.avatar ? (
                            <img
                              src={r.user.avatar}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-xs font-semibold text-white">
                              {r.user.fullName ? r.user.fullName.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white truncate max-w-[150px]">
                              {r.user.fullName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                              {r.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/tours/${r.tour.id}`}
                          className="font-medium text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-400 dark:hover:text-sky-300 max-w-[200px] truncate block"
                          title={r.tour.name}
                        >
                          {r.tour.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= r.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-200 dark:text-slate-700"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                            ({r.rating}/5)
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="line-clamp-2 text-slate-700 dark:text-slate-200 text-xs" title={r.comment ?? ""}>
                          {r.comment || <span className="italic text-slate-400">(Không có lời nhắn)</span>}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {r.createdAtUtc ? formatDateTimeVi(r.createdAtUtc) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60 active:scale-95 disabled:opacity-50"
                          title="Xóa đánh giá này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{deletingId === r.id ? "Đang xóa..." : "Xóa"}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-4">
            <AdminPagination
              total={total}
              page={page}
              pageSize={pageSize}
              itemsLabel="đánh giá"
              onPageChange={setPage}
              onPageSizeChange={(ps) => {
                setPageSize(ps);
                setPage(1);
              }}
            />
          </div>
        </div>
      </main>
    </>
  );
}
