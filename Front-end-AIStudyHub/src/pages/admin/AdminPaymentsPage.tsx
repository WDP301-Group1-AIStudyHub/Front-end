import { useCallback, useEffect, useState } from "react";
import { CreditCard, Eye, RefreshCw, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { AdminStatCard, StatusBadge, formatDateTime } from "./adminPageUtils";
import { LoadingState } from "@/components/shared/CelestialLoading";
import { useToast } from "@/hooks/useToast";
import {
  cancelAdminPayment,
  getAdminPayment,
  getAdminPaymentsOverview,
  listAdminPayments,
} from "@/services/adminStorageApi";
import type {
  AdminPaymentStatus,
  AdminPaymentTransaction,
  AdminPaymentsOverview,
} from "@/types/adminStorage";

const money = (value: number) =>
  `${new Intl.NumberFormat("vi-VN").format(value)} đ`;

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [overview, setOverview] = useState<AdminPaymentsOverview | null>(null);
  const [transactions, setTransactions] = useState<AdminPaymentTransaction[]>(
    [],
  );
  const [selected, setSelected] = useState<AdminPaymentTransaction | null>(
    null,
  );
  const [status, setStatus] = useState<AdminPaymentStatus | "">("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextOverview, nextTransactions] = await Promise.all([
        getAdminPaymentsOverview(),
        listAdminPayments({
          status: status || undefined,
          search: search || undefined,
          limit: 50,
        }),
      ]);
      setOverview(nextOverview);
      setTransactions(nextTransactions.items);
    } catch (error) {
      showToast({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Unable to load payments",
      });
    } finally {
      setLoading(false);
    }
  }, [search, showToast, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (orderRef: string) => {
    try {
      setSelected(await getAdminPayment(orderRef));
    } catch (error) {
      showToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load payment detail",
      });
    }
  };

  const cancel = async (transaction: AdminPaymentTransaction) => {
    const reason = window.prompt("Reason for cancelling this pending payment");
    if (!reason) return;
    setBusy(true);
    try {
      await cancelAdminPayment(transaction.orderRef, reason);
      showToast({ tone: "success", message: "Pending payment cancelled." });
      setSelected(null);
      await load();
    } catch (error) {
      showToast({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Unable to cancel payment",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Payment management"
        description="Audit payment status and cancel pending orders. Completed orders are read-only without refund integration."
        actions={
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon={<Wallet />}
          label="Completed revenue"
          value={loading ? "..." : money(overview?.totalRevenueVnd || 0)}
          tone="teal"
        />
        <AdminStatCard
          icon={<CreditCard />}
          label="Completed orders"
          value={loading ? "..." : String(overview?.completedCount || 0)}
          tone="blue"
        />
        <AdminStatCard
          icon={<CreditCard />}
          label="Pending orders"
          value={loading ? "..." : String(overview?.pendingOrders || 0)}
          tone="gold"
        />
        <AdminStatCard
          icon={<Wallet />}
          label="Transactions"
          value={loading ? "..." : String(overview?.totalTransactions || 0)}
          tone="mist"
        />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search user or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as AdminPaymentStatus | "")
              }
            >
              <option value="">All statuses</option>
              {(
                [
                  "PENDING",
                  "COMPLETED",
                  "FAILED",
                  "CANCELLED",
                  "EXPIRED",
                ] as AdminPaymentStatus[]
              ).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y text-left">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Package</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-5" colSpan={7}>
                      <LoadingState
                        label="Loading payment transactions..."
                        tone="sapphire"
                      />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      className="p-8 text-center text-muted-foreground"
                      colSpan={7}
                    >
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr className="border-b" key={transaction.orderRef}>
                      <td className="p-3 font-mono text-xs">
                        {transaction.orderRef}
                      </td>
                      <td className="p-3">
                        {transaction.user?.fullName || "Unknown"}
                        <span className="block text-xs text-muted-foreground">
                          {transaction.user?.email}
                        </span>
                      </td>
                      <td className="p-3">
                        {transaction.package.name}
                        <span className="block text-xs text-muted-foreground">
                          {transaction.provider} · {transaction.clientPlatform}
                        </span>
                      </td>
                      <td className="p-3">{money(transaction.amountVnd)}</td>
                      <td className="p-3">
                        <StatusBadge
                          severity={transaction.status.toLowerCase()}
                        >
                          {transaction.status}
                        </StatusBadge>
                      </td>
                      <td className="p-3">
                        {formatDateTime(transaction.createdAt)}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void openDetail(transaction.orderRef)}
                        >
                          <Eye /> View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Payment detail · {selected.orderRef}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(null)}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <span className="text-xs text-muted-foreground">User</span>
                <p>
                  {selected.user?.fullName} · {selected.user?.email}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Package snapshot
                </span>
                <p>
                  {selected.package.name} · {money(selected.amountVnd)}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Provider result
                </span>
                <p>
                  {selected.providerResponseCode || "—"}{" "}
                  {selected.bankCode ? `· ${selected.bankCode}` : ""}
                </p>
              </div>
            </div>
            <p>
              <span className="text-muted-foreground">Settled by:</span>{" "}
              {selected.settledBy || "—"} ·{" "}
              <span className="text-muted-foreground">Created:</span>{" "}
              {formatDateTime(selected.createdAt)}
            </p>
            {selected.failureReason ? (
              <p className="text-destructive">
                Failure reason: {selected.failureReason}
              </p>
            ) : null}
            {selected.status === "PENDING" ? (
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => void cancel(selected)}
              >
                Cancel pending transaction
              </Button>
            ) : (
              <p className="text-muted-foreground">
                Only PENDING transactions can be cancelled; completed orders
                have no refund action in this scope.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  );
}
