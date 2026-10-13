"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import {
  FileSpreadsheet,
  Plus,
  Search,
  AlertCircle,
  TicketPercent,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import type { AdminVoucherRow, TourListItem } from "@/lib/api-types";
import {
  fetchAdminVouchers,
  createAdminVoucher,
  updateAdminVoucher,
  toggleAdminVoucher,
  deleteAdminVoucher,
  fetchTours,
  unwrapTourList,
} from "@/lib/admin-api";
import { AdminPagination } from "@/components/admin-pagination";
import { exportToCsv } from "@/lib/export-excel";
import { errorMessage, formatDateVi, formatVnd } from "@/lib/format";

type VoucherFormData = {
  id?: number;
  code: string;
  discountType: "FIXED" | "PERCENT";
  fixedOff: string;
  percentOff: string;
  maxDiscountAmount: string;
  tourId: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
};

const initialFormData: VoucherFormData = {
  code: "",
  discountType: "FIXED",
  fixedOff: "100000",
  percentOff: "10",
  maxDiscountAmount: "500000",
  tourId: "",
  validFrom: "",
  validTo: "",
  isActive: true,
};

export default function AdminVouchersPage() {
  const [rows, setRows] = useState<AdminVoucherRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Tours for select box
  const [tours, setTours] = useState<TourListItem[]>([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<AdminVoucherRow | null>(null);
  const [formData, setFormData] = useState<VoucherFormData>(initialFormData);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const loadTours = useCallback(async () => {
    try {
      const res = await fetchTours({ page: "1", pageSize: "100" });
      if (res.ok) {
        setTours(unwrapTourList(res.data).items);
      }
    } catch {
      // ignore
    }
  }, []);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const res = await fetchAdminVouchers({
      page,
      pageSize,
      search: search.trim() || undefined,
      isActive:
        statusFilter === "active"
          ? true
          : statusFilter === "inactive"
          ? false
          : undefined,
    });
    if (res.ok) {
      setRows(res.data.items);
      setTotal(res.data.total);
    } else {
      setErr(errorMessage(res.body, res.status));
    }
    setLoading(false);
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    load();
    loadTours();
  }, [load, loadTours]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggle = async (id: number) => {
    const res = await toggleAdminVoucher(id);
    if (res.ok) {
      setSuccessMsg(res.data.message);
      setTimeout(() => setSuccessMsg(null), 3000);
      load();
    } else {
      setErr(errorMessage(res.body, res.status));
    }
  };

  const handleDelete = async (voucher: AdminVoucherRow) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${voucher.code}" không?`)) {
      return;
    }
    const res = await deleteAdminVoucher(voucher.id);
    if (res.ok) {
      setSuccessMsg(`Đã xóa mã "${voucher.code}" thành công.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      load();
    } else {
      setErr(errorMessage(res.body, res.status));
    }
  };

  const openCreateModal = () => {
    setEditingVoucher(null);
    setFormData(initialFormData);
    setFormErr(null);
    setModalOpen(true);
  };

  const openEditModal = (voucher: AdminVoucherRow) => {
    setEditingVoucher(voucher);
    const hasFixed = voucher.fixedOff != null && voucher.fixedOff > 0;
    setFormData({
      id: voucher.id,
      code: voucher.code,
      discountType: hasFixed ? "FIXED" : "PERCENT",
      fixedOff: voucher.fixedOff ? String(voucher.fixedOff) : "",
      percentOff: voucher.percentOff ? String(voucher.percentOff) : "",
      maxDiscountAmount: voucher.maxDiscountAmount ? String(voucher.maxDiscountAmount) : "",
      tourId: voucher.tourId ? String(voucher.tourId) : "",
      validFrom: voucher.validFromUtc ? voucher.validFromUtc.slice(0, 10) : "",
      validTo: voucher.validToUtc ? voucher.validToUtc.slice(0, 10) : "",
      isActive: voucher.isActive,
    });
    setFormErr(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);

    const code = formData.code.trim().toUpperCase();
    if (!code) {
      setFormErr("Vui lòng nhập mã giảm giá.");
      return;
    }

    const payload: any = {
      code,
      isActive: formData.isActive,
      tourId: formData.tourId ? Number(formData.tourId) : null,
      validFromUtc: formData.validFrom ? new Date(formData.validFrom).toISOString() : null,
      validToUtc: formData.validTo ? new Date(formData.validTo).toISOString() : null,
    };

    if (formData.discountType === "FIXED") {
      const fixed = Number(formData.fixedOff);
      if (!fixed || fixed <= 0) {
        setFormErr("Vui lòng nhập số tiền giảm cố định hợp lệ (lớn hơn 0).");
        return;
      }
      payload.fixedOff = fixed;
      payload.percentOff = null;
      payload.maxDiscountAmount = null;
    } else {
      const pct = Number(formData.percentOff);
      if (!pct || pct <= 0 || pct > 100) {
        setFormErr("Vui lòng nhập % giảm giá từ 1 đến 100.");
        return;
      }
      payload.percentOff = pct;
      payload.fixedOff = null;
      payload.maxDiscountAmount = formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null;
    }

    setFormSubmitting(true);
    let res;
    if (editingVoucher) {
      res = await updateAdminVoucher(editingVoucher.id, payload);
    } else {
      res = await createAdminVoucher(payload);
    }
    setFormSubmitting(false);

    if (res.ok) {
      setModalOpen(false);
      setSuccessMsg(editingVoucher ? "Đã cập nhật mã giảm giá!" : "Đã tạo mã giảm giá mới!");
      setTimeout(() => setSuccessMsg(null), 3000);
      load();
    } else {
      setFormErr(errorMessage(res.body, res.status));
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await fetchAdminVouchers({
        page: 1,
        pageSize: 1000,
        search: search.trim() || undefined,
        isActive:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
            ? false
            : undefined,
      });
      const dataRows = res.ok ? res.data.items : rows;

      const headers = [
        "Mã code",
        "Loại giảm",
        "Mức giảm",
        "Trần giảm giá",
        "Áp dụng cho tour",
        "Hiệu lực từ",
        "Hiệu lực đến",
        "Trạng thái",
      ];

      const csvData = dataRows.map((r) => [
        r.code,
        r.fixedOff ? "Số tiền cố định" : "Phần trăm (%)",
        r.fixedOff ? `${formatVnd(r.fixedOff)}` : `${r.percentOff}%`,
        r.maxDiscountAmount ? `${formatVnd(r.maxDiscountAmount)}` : "Không giới hạn",
        r.tour ? r.tour.name : "Tất cả các tour",
        r.validFromUtc ? formatDateVi(r.validFromUtc) : "Không giới hạn",
        r.validToUtc ? formatDateVi(r.validToUtc) : "Không giới hạn",
        r.isActive ? "Hoạt động" : "Tạm dừng",
      ]);

      exportToCsv("danh-sach-ma-giam-gia", headers, csvData);
    } catch {
      alert("Xuất dữ liệu thất bại.");
    }
  };

  const activeCount = rows.filter((r) => r.isActive).length;
  const inactiveCount = rows.filter((r) => !r.isActive).length;

  return (
    <>
      <AdminHeader
        title="Quản lý mã giảm giá (Vouchers)"
        subtitle="Tạo và cấu hình các mã khuyến mãi, voucher giảm giá cho tour du lịch."
      />

      <main className="flex-1 space-y-4 overflow-auto p-5 sm:p-6 text-slate-800 dark:text-slate-100">
        {/* Thẻ thống kê */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tổng số mã
                </p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20">
                <TicketPercent className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Đang hoạt động
                </p>
                <p className="mt-1.5 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {activeCount}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tạm dừng / Vô hiệu
                </p>
                <p className="mt-1.5 text-2xl font-bold text-slate-700 dark:text-slate-300">
                  {inactiveCount}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

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
                placeholder="Tìm mã code hoặc tên tour..."
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
              <span>Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm dừng</option>
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

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-indigo-500 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Tạo mã mới
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

        {/* Bảng danh sách mã giảm giá */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200">
              <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Mã Code</th>
                  <th scope="col" className="px-5 py-3.5">Mức giảm giá</th>
                  <th scope="col" className="px-5 py-3.5">Áp dụng cho</th>
                  <th scope="col" className="px-5 py-3.5">Thời hạn</th>
                  <th scope="col" className="px-5 py-3.5">Trạng thái</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      Đang tải danh sách mã giảm giá...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      Chưa có mã giảm giá nào. Nhấn &quot;Tạo mã mới&quot; để thêm.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
                            {r.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(r.code)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                            title="Sao chép mã"
                          >
                            {copiedCode === r.code ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {r.fixedOff ? (
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                            -{formatVnd(r.fixedOff)}
                            <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">
                              Giảm trực tiếp
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              -{r.percentOff}%
                            </span>
                            {r.maxDiscountAmount && (
                              <span className="block text-xs text-slate-500 dark:text-slate-400">
                                Tối đa {formatVnd(r.maxDiscountAmount)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        {r.tour ? (
                          <span className="font-medium text-slate-900 dark:text-white line-clamp-1" title={r.tour.name}>
                            {r.tour.name}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Tất cả các tour
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                        {r.validFromUtc || r.validToUtc ? (
                          <div className="space-y-0.5 text-slate-600 dark:text-slate-300">
                            <div>Từ: {r.validFromUtc ? formatDateVi(r.validFromUtc) : "Không giới hạn"}</div>
                            <div>Đến: {r.validToUtc ? formatDateVi(r.validToUtc) : "Không giới hạn"}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Vô thời hạn</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggle(r.id)}
                          className="flex items-center gap-1.5 transition active:scale-95"
                          title="Bấm để bật/tắt"
                        >
                          {r.isActive ? (
                            <>
                              <ToggleRight className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                Hoạt động
                              </span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-6 w-6 text-slate-400" />
                              <span className="text-xs font-medium text-slate-500">
                                Tạm dừng
                              </span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60"
                            title="Xóa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
              itemsLabel="mã giảm giá"
              onPageChange={setPage}
              onPageSizeChange={(ps) => {
                setPageSize(ps);
                setPage(1);
              }}
            />
          </div>
        </div>
      </main>

      {/* Modal Tạo / Sửa Voucher */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TicketPercent className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                {editingVoucher ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formErr && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <p>{formErr}</p>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4 text-slate-700 dark:text-slate-300">
              {/* Mã code */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Mã Voucher (Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: HE2026, GIAM100K..."
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Loại giảm giá */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Hình thức giảm giá
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discountType: "FIXED" })}
                    className={`rounded-xl border py-2.5 text-xs font-semibold transition ${
                      formData.discountType === "FIXED"
                        ? "border-sky-600 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/20 dark:text-sky-300"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    Số tiền cố định (VNĐ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discountType: "PERCENT" })}
                    className={`rounded-xl border py-2.5 text-xs font-semibold transition ${
                      formData.discountType === "PERCENT"
                        ? "border-sky-600 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/20 dark:text-sky-300"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    Phần trăm (%)
                  </button>
                </div>
              </div>

              {/* Số tiền hoặc % */}
              {formData.discountType === "FIXED" ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Số tiền giảm (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    placeholder="VD: 100000"
                    value={formData.fixedOff}
                    onChange={(e) =>
                      setFormData({ ...formData, fixedOff: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Phần trăm giảm (%) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      placeholder="VD: 15"
                      value={formData.percentOff}
                      onChange={(e) =>
                        setFormData({ ...formData, percentOff: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Trần giảm tối đa (VNĐ)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="VD: 500000 (tuỳ chọn)"
                      value={formData.maxDiscountAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, maxDiscountAmount: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Tour áp dụng */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Áp dụng cho Tour
                </label>
                <select
                  value={formData.tourId}
                  onChange={(e) => setFormData({ ...formData, tourId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Tất cả các tour (Áp dụng toàn bộ hệ thống)</option>
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (ID: #{t.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Thời gian hiệu lực */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Hiệu lực từ ngày
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, validFrom: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Hiệu lực đến ngày
                  </label>
                  <input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) =>
                      setFormData({ ...formData, validTo: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Kích hoạt */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <label
                  htmlFor="isActiveToggle"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Kích hoạt mã giảm giá này ngay bây giờ
                </label>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50"
                >
                  {formSubmitting
                    ? "Đang lưu..."
                    : editingVoucher
                    ? "Cập nhật"
                    : "Tạo voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
