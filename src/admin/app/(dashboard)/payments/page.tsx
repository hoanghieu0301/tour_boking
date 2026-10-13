"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { FileSpreadsheet } from "lucide-react";
import type { AdminPaymentRow, PaymentStatus } from "@/lib/api-types";
import { fetchAdminPayments } from "@/lib/admin-api";
import { AdminPagination } from "@/components/admin-pagination";
import { exportToCsv } from "@/lib/export-excel";
import {
  errorMessage,
  formatDateTimeVi,
  formatDateVi,
  formatVnd,
  labelBookingStatus,
  labelPaymentStatus,
} from "@/lib/format";

const PAYMENT_FILTER: { value: "" | PaymentStatus; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: labelPaymentStatus("PENDING") },
  { value: "SUCCESS", label: labelPaymentStatus("SUCCESS") },
  { value: "FAILED", label: labelPaymentStatus("FAILED") },
];

function payBadgeClass(s: PaymentStatus): string {
  switch (s) {
    case "SUCCESS":
      return "bg-emerald-50 text-emerald-800";
    case "PENDING":
      return "bg-amber-50 text-amber-800";
    case "FAILED":
      return "bg-red-50 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | PaymentStatus>("");

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const q: Record<string, string | undefined> = {
      page: String(page),
      pageSize: String(pageSize),
    };
    if (statusFilter) q.status = statusFilter;
    const res = await fetchAdminPayments(q);
    if (res.ok) {
      setRows(res.data.items);
      setTotal(res.data.total);
    } else setErr(errorMessage(res.body, res.status));
    setLoading(false);
  }, [statusFilter, page, pageSize]);

  const handleExportExcel = async () => {
    try {
      const q: Record<string, string | undefined> = {
        page: "1",
        pageSize: "1000",
      };
      if (statusFilter) q.status = statusFilter;
      const res = await fetchAdminPayments(q);
      const dataRows = res.ok ? res.data.items : rows;

      const headers = [
        "Mã GD",
        "Mã Booking",
        "Khách hàng",
        "Email",
        "Số tiền (VNĐ)",
        "Phương thức",
        "Mã GD cổng (VNPay)",
        "Trạng thái",
        "Thời gian",
      ];

      const exportData = dataRows.map((p) => [
        `#${p.id}`,
        `#${p.bookingId}`,
        p.booking?.contactName ?? "",
        p.booking?.contactEmail ?? "",
        p.amount,
        p.paymentMethod ?? "",
        p.transactionCode ?? "",
        labelPaymentStatus(p.status),
        p.paidAtUtc ? formatDateTimeVi(p.paidAtUtc) : "",
      ]);

      exportToCsv(
        `danh-sach-thanh-toan-${new Date().toISOString().slice(0, 10)}`,
        headers,
        exportData,
      );
    } catch (e) {
      console.error("Xuất Excel thất bại:", e);
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <AdminHeader title="Quản lý thanh toán" />
      <main className="flex-1 space-y-4 overflow-auto p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span>Trạng thái TT</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value as "" | PaymentStatus);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {PAYMENT_FILTER.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Tải lại
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleExportExcel()}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Xuất Excel</span>
          </button>
        </div>

        {err ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {err}
          </div>
        ) : null}

        {loading ? (
          <p className="py-12 text-center text-slate-500">Đang tải…</p>
        ) : rows.length === 0 && !err ? (
          <p className="py-12 text-center text-slate-500">
            Chưa có giao dịch thanh toán.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">ID TT</th>
                  <th className="px-4 py-3 font-medium">Booking</th>
                  <th className="px-4 py-3 font-medium">Tour</th>
                  <th className="px-4 py-3 font-medium">Khởi hành</th>
                  <th className="px-4 py-3 font-medium">Số tiền</th>
                  <th className="px-4 py-3 font-medium">Cổng / Mã GD</th>
                  <th className="px-4 py-3 font-medium">TT đơn</th>
                  <th className="px-4 py-3 font-medium">TT thanh toán</th>
                  <th className="px-4 py-3 font-medium">Trả lúc</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-sky-600">
                      #{row.id}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/bookings/${row.bookingId}`}
                        className="font-mono text-sky-600 hover:underline"
                      >
                        #{row.bookingId}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {row.booking.contactName ?? row.booking.contactEmail}
                      </div>
                    </td>
                    <td className="max-w-[180px] px-4 py-3 text-slate-700">
                      <span className="line-clamp-2">{row.booking.tourName}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateVi(row.booking.departureStartUtc)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">
                      {formatVnd(row.amount ?? row.booking.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{row.paymentGateway ?? "—"}</div>
                      <div className="font-mono text-slate-500">
                        {row.transactionCode ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">
                        {labelBookingStatus(row.booking.bookingStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${payBadgeClass(row.status)}`}
                      >
                        {labelPaymentStatus(row.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {formatDateTimeVi(row.paidAtUtc)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AdminPagination
              page={page}
              pageSize={pageSize}
              total={total}
              itemsLabel="giao dịch"
              onPageChange={setPage}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setPage(1);
              }}
            />
          </div>
        )}
      </main>
    </>
  );
}
