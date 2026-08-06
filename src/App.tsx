import { useState } from "react";
import { AdminShell } from "./components/AdminShell";
import { CreditAccountsPage } from "./components/CreditAccountsPage";
import { FinanceDataPage } from "./components/FinanceDataPage";
import { accounts } from "./data";
import type {
  CreditEntryRecord,
  PageId,
  RechargeAdjustmentLedger,
  SpecialRecord,
} from "./types";

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("finance");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountRecords, setAccountRecords] = useState(accounts);
  const [generatedEntries, setGeneratedEntries] = useState<CreditEntryRecord[]>(
    [],
  );
  const [generatedSpecials, setGeneratedSpecials] = useState<SpecialRecord[]>(
    [],
  );

  const routeAdjustment = (ledger: RechargeAdjustmentLedger) => {
    if (ledger.direction === "增加") {
      setGeneratedEntries((current) => [
        {
          id: ledger.id,
          recordSource: "后台充值积分调整",
          accountId: ledger.accountId,
          accountName: ledger.accountName,
          accountType: ledger.accountType,
          financeProfileId: "/",
          financeProfileName: "/",
          customerType: "/",
          month: ledger.occurredAt.slice(0, 7),
          businessNature:
            ledger.businessNature as CreditEntryRecord["businessNature"],
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
          status: "有效",
          reason: ledger.reason,
          source: "系统同步",
          lastModifiedBy: "/",
          updatedAt: ledger.occurredAt,
        },
        ...current,
      ]);
      return;
    }

    const isRefund = ledger.businessNature === "退款扣回";
    setGeneratedSpecials((current) => [
      {
        id: `SPC-${ledger.id.replace(/^[A-Z]+-/, "")}`,
        accountId: ledger.accountId,
        accountName: ledger.accountName,
        accountType: ledger.accountType,
        financeProfileId: "/",
        financeProfileName: "/",
        customerType: "/",
        month: ledger.occurredAt.slice(0, 7),
        type: "积分扣减",
        businessNature:
          ledger.businessNature as SpecialRecord["businessNature"],
        occurredAt: ledger.occurredAt,
        planPoints: 0,
        rechargePoints: ledger.delta,
        giftPoints: 0,
        relatedRecordType: "/",
        relatedRecordId: "/",
        pointsLedgerId: ledger.id,
        handlingStatus: isRefund ? "退款待补充" : "无需处理",
        fundStatus: isRefund ? "待退款确认" : "不涉及资金",
        refundAmount: "/",
        refundDate: "/",
        transferReference: "/",
        refundReason: "/",
        refundReasonNote: "/",
        refundEvidence: "/",
        manualAmount: "/",
        pointsImpactNote: "/",
        reason: ledger.reason,
        operator: ledger.operator,
        source: "系统同步",
        lastModifiedBy: "/",
        updatedAt: ledger.occurredAt,
        status: "有效",
      },
      ...current,
    ]);
  };

  return (
    <AdminShell
      activePage={activePage}
      onPageChange={setActivePage}
      mobileNavOpen={mobileNavOpen}
      onToggleNav={() => setMobileNavOpen((open) => !open)}
    >
      {activePage === "credits" ? (
        <CreditAccountsPage
          accounts={accountRecords}
          onAccountsChange={setAccountRecords}
          onAdjustment={routeAdjustment}
        />
      ) : (
        <FinanceDataPage
          accountRecords={accountRecords}
          additionalEntries={generatedEntries}
          additionalSpecials={generatedSpecials}
          onOpenCreditAccounts={() => setActivePage("credits")}
        />
      )}
    </AdminShell>
  );
}
