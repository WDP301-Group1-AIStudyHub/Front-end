import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStorageStore } from "../store/useStorageStore";
import { useToast } from "./useToast";
import { createPurchase, fetchTransaction } from "../services/storageApi";
import { formatStorageBytes } from "../utils/formatStorage";
import type { StoragePackage } from "../types/storage";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 20000;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

/**
 * Everything needed to buy a plan from anywhere in the app: the confirm target,
 * the order call, and the post-redirect polling. Shared so the dashboard and the
 * plans page cannot drift apart on a money-handling flow.
 */
export function useStoragePurchase(options: { onSettled?: () => void } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const storage = useStorageStore((state) => state.storage);
  const currentPackageId = useStorageStore((state) => state.currentPackageId);
  const loadStorage = useStorageStore((state) => state.loadStorage);
  const loadPackages = useStorageStore((state) => state.loadPackages);
  const setStorage = useStorageStore((state) => state.setStorage);

  const [target, setTarget] = useState<StoragePackage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollTimer = useRef<number | null>(null);

  const onSettledRef = useRef(options.onSettled);
  onSettledRef.current = options.onSettled;

  /** Returns null when the plan can be bought, or the reason it cannot. */
  const blockReason = useCallback(
    (pkg: StoragePackage): string | null => {
      if (pkg.id === currentPackageId) {
        return `${pkg.name} is already your current plan.`;
      }

      // A purchase REPLACES quota rather than adding to it, so buying anything
      // with less capacity than the current plan is always a paid
      // self-downgrade. This also covers returning to Free, since Free is
      // always the smallest plan.
      const currentPackage = storage?.package;
      if (currentPackage && pkg.capacityBytes < currentPackage.capacityBytes) {
        return `Downgrading from ${currentPackage.name} to ${pkg.name} isn't supported.`;
      }

      const committed =
        (storage?.usedBytes ?? 0) + (storage?.reservedBytes ?? 0);

      if (pkg.capacityBytes < committed) {
        return `Cannot switch to ${pkg.name}: you are using ${formatStorageBytes(committed)}, more than its ${formatStorageBytes(pkg.capacityBytes)} capacity.`;
      }

      return null;
    },
    [currentPackageId, storage],
  );

  // The gateway sends the user back with ?orderRef. Those params are only a
  // hint — the transaction endpoint is polled for the authoritative outcome,
  // which is also what covers an IPN delayed by a cold-starting host.
  const orderRefParam = searchParams.get("orderRef");

  useEffect(() => {
    if (!orderRefParam) {
      return;
    }

    const startedAt = Date.now();
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;

      try {
        const snapshot = await fetchTransaction(orderRefParam);
        setStorage(snapshot.storage);

        if (snapshot.transaction.status === "PENDING") {
          if (Date.now() - startedAt < POLL_TIMEOUT_MS) {
            pollTimer.current = window.setTimeout(poll, POLL_INTERVAL_MS);
            return;
          }
          // A pending payment is never reported as a failure.
          showToast({
            tone: "info",
            message:
              "Your payment is still being processed. Reload this page in a few minutes to see the result.",
          });
        } else if (snapshot.transaction.status === "COMPLETED") {
          showToast({
            tone: "success",
            message: `${snapshot.transaction.package.name} plan activated. New quota: ${formatStorageBytes(snapshot.transaction.package.capacityBytes)}.`,
          });
        } else {
          showToast({
            tone: "error",
            message: `Payment ${(STATUS_LABEL[snapshot.transaction.status] ?? snapshot.transaction.status).toLowerCase()}. You can try again.`,
          });
        }

        void loadPackages();
        onSettledRef.current?.();
        setSearchParams({}, { replace: true });
      } catch {
        setSearchParams({}, { replace: true });
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (pollTimer.current) {
        window.clearTimeout(pollTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderRefParam]);

  const confirmPurchase = useCallback(async () => {
    if (!target) return;

    setIsSubmitting(true);
    try {
      const order = await createPurchase(target.id);

      if (!order.requiresPayment) {
        showToast({
          tone: "success",
          message: `Switched to the ${order.package.name} plan.`,
        });
        setTarget(null);
        await loadStorage({ force: true });
        await loadPackages();
        onSettledRef.current?.();
        return;
      }

      // Hand off to the gateway's hosted page; we come back to this route.
      window.location.assign(order.paymentUrl);
    } catch (error) {
      showToast({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not create the order",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [loadPackages, loadStorage, showToast, target]);

  return {
    blockReason,
    confirmPurchase,
    isSubmitting,
    setTarget,
    target,
  };
}
