import { useState } from "react";
import { AdminShell } from "./components/AdminShell";
import { CreditAccountsPage } from "./components/CreditAccountsPage";
import { FinanceDataPage } from "./components/FinanceDataPage";
import { accounts } from "./data";
import type { CreditEntryRecord, PageId, RechargeAdjustmentLedger } from "./types";

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("finance");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountRecords, setAccountRecords] = useState(accounts);
  const [generatedEntries, setGeneratedEntries] = useState<CreditEntryRecord[]>([]);

  const addFinanceEntry = (ledger: RechargeAdjustmentLedger) => {
    setGeneratedEntries((current) => [{
      id: ledger.id,
      recordSource: "积分调整流水",
      accountId: ledger.accountId,
      accountName: ledger.accountName,
      accountType: ledger.accountType,
      financeProfileId: "/",
      financeProfileName: "/",
      customerType: "/",
      month: "2026-07",
      businessType: "后台调整充值积分",
      actualAmount: "/",
      giftAmount: "/",
      paymentMethod: "/",
      paymentReference: "/",
      discountType: "/",
      activityBatch: "/",
      receiptStatus: "/",
      contractNo: "/",
      planName: "/",
      planPoints: 0,
      rechargePoints: ledger.delta,
      giftPoints: 0,
      pointsLedgerId: ledger.id,
      pointsDeliveryStatus: "已发放",
      occurredAt: ledger.occurredAt,
      operator: ledger.operator,
      status: "已完成",
      reason: ledger.reason,
      source: "系统同步",
      updatedAt: ledger.occurredAt,
    }, ...current]);
  };

  return (
    <AdminShell
      activePage={activePage}
      onPageChange={setActivePage}
      mobileNavOpen={mobileNavOpen}
      onToggleNav={() => setMobileNavOpen((open) => !open)}
    >
      {activePage === "credits"
        ? <CreditAccountsPage accounts={accountRecords} onAccountsChange={setAccountRecords} onAdjustment={addFinanceEntry} />
        : <FinanceDataPage accountRecords={accountRecords} additionalEntries={generatedEntries} onOpenCreditAccounts={() => setActivePage("credits")} />}
    </AdminShell>
  );
}
