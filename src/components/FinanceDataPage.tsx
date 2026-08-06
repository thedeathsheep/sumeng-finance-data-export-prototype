import {
  ArrowRight,
  Download,
  FilePenLine,
  Info,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  consumptions,
  creditEntries,
  financeProfiles,
  initialAuditLogs,
  specialRecords,
} from "../data";
import type {
  AccountRecord,
  AccountType,
  AuditLogRecord,
  BusinessNatureChangeDraft,
  CreditEntryRecord,
  FinanceProfileRecord,
  FinanceRow,
  ManualSpecialDraft,
  MonthlySummaryRecord,
  RecordSource,
  RecordStatus,
  RefundSupplementDraft,
  SpecialRecord,
  TabId,
} from "../types";
import { AuditHistoryDialog } from "./AuditHistoryDialog";
import { BusinessNatureDialog } from "./BusinessNatureDialog";
import { ExportDialog } from "./ExportDialog";
import { FilterBar, type CustomerTypeFilter } from "./FilterBar";
import { FinanceTable } from "./FinanceTable";
import { FinanceTabs, tabItems } from "./FinanceTabs";
import {
  ManualRecordDialog,
  type FinanceProfileDraft,
} from "./ManualRecordDialog";
import { RefundSupplementDialog } from "./RefundSupplementDialog";
import { SpecialRecordDialog } from "./SpecialRecordDialog";
import { SummaryStrip, type SummaryItem } from "./SummaryStrip";

const currentMonth = "2026-07";
const now = "2026-07-31 15:18:22";
const pageSize = 5;
const slash = (value?: string) => value?.trim() || "/";
const optionalMoney = (value: string) => (value ? Number(value) : "/");
const pointNumber = (value: string | number) =>
  typeof value === "number" ? value : 0;
const moneyText = (value: string | number) =>
  typeof value === "number"
    ? new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
      }).format(value)
    : "/";
const pointText = (value: number) => `${value.toLocaleString("zh-CN")} 点`;

const tabScopeNotes: Record<TabId, string> = {
  profiles:
    "企业或个人仅作为财务身份，不创建新的线上账号类型；历史业务记录保留发生时快照。",
  recharges:
    "充值明细只来自线上订单、套餐变更和后台充值积分增加；没有支付事实时，金额与支付字段显示“/”。",
  consumptions:
    "消费只同步真实积分流水；实际计费用量与积分计费标准取模型配置在消费发生时的快照，不换算人民币。",
  monthly:
    "月度汇总只使用可靠人民币事实；存在应计入但金额缺失的记录时，对应指标显示“/”并说明缺失数量。",
  special:
    "积分扣减自动生成特殊业务；线下或历史事实可人工补充，但不会联动积分余额、订单或退款。",
};

interface FinanceDataPageProps {
  accountRecords: AccountRecord[];
  additionalEntries: CreditEntryRecord[];
  additionalSpecials: SpecialRecord[];
  onOpenCreditAccounts: () => void;
}

function profileDraft(item: FinanceProfileRecord): FinanceProfileDraft {
  const text = (value: string | number) =>
    typeof value === "number" ? String(value) : value === "/" ? "" : value;
  return {
    customerType: item.customerType,
    customerName: item.customerName,
    unifiedCreditCode: text(item.unifiedCreditCode),
    contactName: text(item.contactName),
    contactPhone: text(item.contactPhone),
    accountStatus: item.accountStatus,
    contractNo: text(item.contractNo),
    serviceStart: text(item.serviceStart),
    serviceEnd: text(item.serviceEnd),
    packageCycle: item.packageCycle,
    contractPrepaidCap: text(item.contractPrepaidCap),
    unitPriceStandard: text(item.unitPriceStandard),
    invoiceNeeded: item.invoiceNeeded === "否" ? "否" : "是",
    historicalInvoicedAmount: text(item.historicalInvoicedAmount),
    uninvoicedPrepaidBalance: text(item.uninvoicedPrepaidBalance),
    linkedAccountIds: item.linkedAccountIds,
  };
}

function manualSpecialDraft(item: SpecialRecord): ManualSpecialDraft {
  return {
    financeProfileId: item.financeProfileId === "/" ? "" : item.financeProfileId,
    accountId: item.accountId === "/" ? "" : item.accountId,
    occurredAt: item.occurredAt.replace(" ", "T").slice(0, 16),
    businessNature: item.businessNature as ManualSpecialDraft["businessNature"],
    manualAmount: typeof item.manualAmount === "number" ? String(item.manualAmount) : "",
    pointsImpactNote: item.pointsImpactNote === "/" ? "" : item.pointsImpactNote,
    reason: item.reason === "/" ? "" : item.reason,
    evidence: item.refundEvidence === "/" ? "" : item.refundEvidence,
  };
}

export function FinanceDataPage({
  accountRecords,
  additionalEntries,
  additionalSpecials,
  onOpenCreditAccounts,
}: FinanceDataPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profiles");
  const [month, setMonth] = useState(currentMonth);
  const [accountType, setAccountType] = useState<"全部" | AccountType>("全部");
  const [customerType, setCustomerType] = useState<CustomerTypeFilter>("全部");
  const [accountQuery, setAccountQuery] = useState("");
  const [businessQuery, setBusinessQuery] = useState("");
  const [source, setSource] = useState<"全部" | RecordSource>("全部");
  const [recordStatus, setRecordStatus] = useState<"全部" | RecordStatus>(
    "全部",
  );
  const [page, setPage] = useState(1);
  const [profiles, setProfiles] = useState(financeProfiles);
  const [specials, setSpecials] = useState(specialRecords);
  const [auditLogs, setAuditLogs] =
    useState<AuditLogRecord[]>(initialAuditLogs);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [specialDialogOpen, setSpecialDialogOpen] = useState(false);
  const [editingSpecialId, setEditingSpecialId] = useState<string | null>(null);
  const [refundRecordId, setRefundRecordId] = useState<string | null>(null);
  const [natureRecordId, setNatureRecordId] = useState<string | null>(null);
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setSpecials((current) => {
      const known = new Set(current.map((item) => item.id));
      const incoming = additionalSpecials.filter((item) => !known.has(item.id));
      return incoming.length ? [...incoming, ...current] : current;
    });
  }, [additionalSpecials]);

  const activeProfileFor = useCallback(
    (accountId: string) =>
      profiles.find(
        (profile) =>
          profile.recordStatus === "有效" &&
          profile.linkedAccountIds.includes(accountId),
      ),
    [profiles],
  );
  const enrichRecharge = useCallback(
    (item: CreditEntryRecord) => {
      const profile = activeProfileFor(item.accountId);
      return {
        ...item,
        financeProfileId: profile?.id ?? item.financeProfileId,
        financeProfileName: profile?.customerName ?? item.financeProfileName,
        customerType: profile?.customerType ?? item.customerType,
        contractNo:
          item.contractNo === "/"
            ? (profile?.contractNo ?? "/")
            : item.contractNo,
      };
    },
    [activeProfileFor],
  );
  const enrichSpecial = useCallback(
    (item: SpecialRecord) => {
      const profile = activeProfileFor(item.accountId);
      return {
        ...item,
        financeProfileId: profile?.id ?? item.financeProfileId,
        financeProfileName: profile?.customerName ?? item.financeProfileName,
        customerType: profile?.customerType ?? item.customerType,
      };
    },
    [activeProfileFor],
  );
  const allRecharges = useMemo(
    () => [...additionalEntries, ...creditEntries].map(enrichRecharge),
    [additionalEntries, enrichRecharge],
  );
  const allSpecials = useMemo(
    () => specials.map(enrichSpecial),
    [enrichSpecial, specials],
  );

  const normalizedQuery = accountQuery.trim().toLocaleLowerCase("zh-CN");
  const normalizedBusiness = businessQuery.trim().toLocaleLowerCase("zh-CN");
  const matchedAccounts = useMemo(
    () =>
      accountRecords.filter((account) => {
        const typeMatches =
          accountType === "全部" || account.accountType === accountType;
        const monthMatches = account.activeMonths.includes(month);
        const queryMatches =
          !normalizedQuery ||
          [account.id, account.accountName, account.ownerName]
            .join(" ")
            .toLocaleLowerCase("zh-CN")
            .includes(normalizedQuery);
        return typeMatches && monthMatches && queryMatches;
      }),
    [accountRecords, accountType, month, normalizedQuery],
  );
  const accountIds = useMemo(
    () => new Set(matchedAccounts.map((item) => item.id)),
    [matchedAccounts],
  );
  const customerMatches = (value: string) =>
    customerType === "全部" ||
    (customerType === "未关联" ? value === "/" : value === customerType);
  const sourceMatches = (value: RecordSource) =>
    source === "全部" || source === value;
  const statusMatches = (value: RecordStatus) =>
    recordStatus === "全部" || recordStatus === value;

  const filteredProfiles = useMemo(
    () =>
      profiles.filter(
        (item) =>
          item.linkedAccountIds.some((id) => accountIds.has(id)) &&
          customerMatches(item.customerType) &&
          sourceMatches(item.source) &&
          statusMatches(item.recordStatus) &&
          (!normalizedQuery ||
            [item.id, item.customerName, ...item.linkedAccountNames]
              .join(" ")
              .toLocaleLowerCase("zh-CN")
              .includes(normalizedQuery)),
      ),
    [accountIds, customerType, normalizedQuery, profiles, recordStatus, source],
  );
  const filteredRecharges = useMemo(
    () =>
      allRecharges.filter(
        (item) =>
          item.month === month &&
          accountIds.has(item.accountId) &&
          customerMatches(item.customerType) &&
          sourceMatches(item.source) &&
          statusMatches(item.status) &&
          (!normalizedBusiness ||
            [item.recordSource, item.businessNature, item.reason]
              .join(" ")
              .toLocaleLowerCase("zh-CN")
              .includes(normalizedBusiness)),
      ),
    [
      accountIds,
      allRecharges,
      businessQuery,
      customerType,
      month,
      recordStatus,
      source,
    ],
  );
  const filteredConsumptions = useMemo(
    () =>
      consumptions.filter(
        (item) =>
          item.month === month &&
          accountIds.has(item.accountId) &&
          customerMatches(item.customerType) &&
          sourceMatches("系统同步") &&
          statusMatches("有效") &&
          (!normalizedBusiness ||
            [item.scene, item.service, item.actualBillingUsage, item.billingRateSnapshot]
              .join(" ")
              .toLocaleLowerCase("zh-CN")
              .includes(normalizedBusiness)),
      ),
    [accountIds, businessQuery, customerType, month, recordStatus, source],
  );
  const filteredSpecials = useMemo(
    () =>
      allSpecials.filter(
        (item) =>
          item.month === month &&
          (item.accountId === "/"
            ? accountType === "全部" && !normalizedQuery
            : accountIds.has(item.accountId)) &&
          customerMatches(item.customerType) &&
          sourceMatches(item.source) &&
          statusMatches(item.status) &&
          (!normalizedBusiness ||
            [item.type, item.businessNature, item.reason, item.refundReason]
              .join(" ")
              .toLocaleLowerCase("zh-CN")
              .includes(normalizedBusiness)),
      ),
    [
      accountIds,
      accountType,
      allSpecials,
      businessQuery,
      customerType,
      month,
      normalizedQuery,
      recordStatus,
      source,
    ],
  );

  const monthlySummary = useMemo<MonthlySummaryRecord>(() => {
    const valid = filteredRecharges.filter((item) => item.status === "有效");
    const missingPrincipal = valid.filter(
      (item) =>
        ["线上购买", "线下购买"].includes(item.businessNature) &&
        typeof item.actualAmount !== "number",
    );
    const knownPrincipal = valid
      .filter(
        (item) =>
          item.receiptStatus === "已收款" &&
          typeof item.actualAmount === "number",
      )
      .reduce((sum, item) => sum + pointNumber(item.actualAmount), 0);
    const missingGift = valid.filter(
      (item) =>
        item.businessNature === "线上购买" &&
        typeof item.giftAmount !== "number",
    );
    const knownGift = valid
      .filter((item) => typeof item.giftAmount === "number")
      .reduce((sum, item) => sum + pointNumber(item.giftAmount), 0);
    const notes = [
      `按当前筛选动态汇总`,
      `新增充值本金缺失 ${missingPrincipal.length} 条`,
      `赠送金额缺失 ${missingGift.length} 条`,
      "消费金额无可靠换算口径",
    ];
    return {
      id: `MONTH-${month}`,
      month,
      newRechargePrincipal: missingPrincipal.length ? "/" : knownPrincipal,
      giftAmount: missingGift.length ? "/" : knownGift,
      uncollectedRechargeAmount: "/",
      principalConsumptionAmount: "/",
      giftConsumptionAmount: "/",
      note: notes.join("；"),
    };
  }, [filteredRecharges, month]);

  const rowsByTab: Record<TabId, FinanceRow[]> = {
    profiles: filteredProfiles,
    recharges: filteredRecharges,
    consumptions: filteredConsumptions,
    monthly: [monthlySummary],
    special: filteredSpecials,
  };
  const counts: Record<TabId, number> = {
    profiles: filteredProfiles.length,
    recharges: filteredRecharges.length,
    consumptions: filteredConsumptions.length,
    monthly: 1,
    special: filteredSpecials.length,
  };
  const summaries: Record<TabId, SummaryItem[]> = {
    profiles: [
      {
        label: "财务档案",
        value: `${filteredProfiles.length} 份`,
        hint: "个人 / 企业财务身份",
      },
      {
        label: "有效档案",
        value: `${filteredProfiles.filter((item) => item.recordStatus === "有效").length} 份`,
        hint: "一份档案可关联多个线上对象",
      },
      {
        label: "待补齐",
        value: `${filteredProfiles.filter((item) => item.contractNo === "/" || item.unifiedCreditCode === "/").length} 份`,
        hint: "未知字段统一显示 /",
      },
    ],
    recharges: [
      {
        label: "充值记录",
        value: `${filteredRecharges.length} 条`,
        hint: "仅系统事件自动生成",
      },
      {
        label: "充值积分增加",
        value: pointText(
          filteredRecharges.reduce(
            (sum, item) => sum + pointNumber(item.rechargePoints),
            0,
          ),
        ),
        hint: "取真实积分流水",
      },
      {
        label: "已知充值本金",
        value: moneyText(
          filteredRecharges
            .filter((item) => typeof item.actualAmount === "number")
            .reduce((sum, item) => sum + pointNumber(item.actualAmount), 0),
        ),
        hint: "未知金额不计为 0",
      },
    ],
    consumptions: [
      {
        label: "套餐积分消耗",
        value: pointText(
          filteredConsumptions.reduce(
            (sum, item) => sum + pointNumber(item.planPoints),
            0,
          ),
        ),
        hint: "按积分流水拆分",
      },
      {
        label: "充值积分消耗",
        value: pointText(
          filteredConsumptions.reduce(
            (sum, item) => sum + pointNumber(item.rechargePoints),
            0,
          ),
        ),
        hint: "同笔可含三类积分",
      },
      {
        label: "赠送积分消耗",
        value: pointText(
          filteredConsumptions.reduce(
            (sum, item) => sum + pointNumber(item.giftPoints),
            0,
          ),
        ),
        hint: "不推算人民币",
      },
    ],
    monthly: [
      { label: "会计月份", value: month, hint: "随当前筛选动态计算" },
      {
        label: "新增充值总本金",
        value: moneyText(monthlySummary.newRechargePrincipal),
        hint: "不完整时显示 /",
      },
      {
        label: "金额完整性",
        value: String(
          monthlySummary.note.match(/缺失 0 条/g)?.length === 2
            ? "完整"
            : "存在缺失",
        ),
        hint: "详见口径说明",
      },
    ],
    special: [
      {
        label: "特殊业务",
        value: `${filteredSpecials.length} 条`,
        hint: "系统事实与人工补录",
      },
      {
        label: "退款待补充",
        value: `${filteredSpecials.filter((item) => item.handlingStatus === "退款待补充").length} 条`,
        hint: "需补充线下转账资料",
      },
      {
        label: "退款已完成",
        value: `${filteredSpecials.filter((item) => item.handlingStatus === "退款已完成").length} 条`,
        hint: "原积分流水保持不变",
      },
    ],
  };

  useEffect(
    () => setPage(1),
    [
      activeTab,
      month,
      accountType,
      customerType,
      accountQuery,
      businessQuery,
      source,
      recordStatus,
    ],
  );
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const appendAudit = (
    recordId: string,
    action: AuditLogRecord["action"],
    detail: string,
  ) =>
    setAuditLogs((current) => [
      {
        id: `AUD-${Date.now()}`,
        recordId,
        action,
        operator: "Wsq",
        occurredAt: now,
        detail,
      },
      ...current,
    ]);

  const saveProfile = (draft: FinanceProfileDraft) => {
    const linked = accountRecords.filter((item) =>
      draft.linkedAccountIds.includes(item.id),
    );
    const id =
      editingProfileId ?? `FIN-${String(profiles.length + 1).padStart(4, "0")}`;
    const existingProfile = profiles.find((item) => item.id === editingProfileId);
    const record: FinanceProfileRecord = {
      id,
      customerType: draft.customerType,
      customerName: draft.customerName.trim(),
      unifiedCreditCode: slash(draft.unifiedCreditCode),
      contactName: slash(draft.contactName),
      contactPhone: slash(draft.contactPhone),
      accountStatus: draft.accountStatus,
      contractNo: slash(draft.contractNo),
      serviceStart: slash(draft.serviceStart),
      serviceEnd: slash(draft.serviceEnd),
      packageCycle: draft.packageCycle,
      contractPrepaidCap: optionalMoney(draft.contractPrepaidCap),
      unitPriceStandard: slash(draft.unitPriceStandard),
      invoiceNeeded: draft.invoiceNeeded,
      historicalInvoicedAmount: optionalMoney(draft.historicalInvoicedAmount),
      uninvoicedPrepaidBalance: optionalMoney(draft.uninvoicedPrepaidBalance),
      linkedAccountIds: linked.map((item) => item.id),
      linkedAccountNames: linked.map((item) => item.accountName),
      source: "人工维护",
      operator: existingProfile?.operator ?? "Wsq",
      lastModifiedBy: "Wsq",
      updatedAt: now,
      recordStatus: "有效",
    };
    setProfiles((current) =>
      editingProfileId
        ? current.map((item) => (item.id === id ? record : item))
        : [record, ...current],
    );
    appendAudit(
      id,
      editingProfileId ? "修改" : "创建",
      `${editingProfileId ? "更新" : "创建"}财务档案，关联 ${linked.map((item) => item.id).join("、")}`,
    );
    setProfileDialogOpen(false);
    setEditingProfileId(null);
    setToast("财务档案已保存");
  };
  const saveBusinessNature = (
    id: string,
    draft: BusinessNatureChangeDraft,
  ) => {
    const previous = specials.find((item) => item.id === id);
    if (!previous) return;
    const isRefund = draft.businessNature === "退款扣回";
    const oldRefundSnapshot = previous.fundStatus === "已退款"
      ? `；原退款资料：金额 ${previous.refundAmount}，日期 ${previous.refundDate}，对公流水 ${previous.transferReference}，原因 ${previous.refundReason}，凭证 ${previous.refundEvidence}`
      : "";
    setSpecials((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              type: "积分扣减",
              businessNature: draft.businessNature,
              handlingStatus: isRefund ? "退款待补充" : "无需处理",
              fundStatus: isRefund ? "待退款确认" : "不涉及资金",
              refundAmount: "/",
              refundDate: "/",
              transferReference: "/",
              refundReason: "/",
              refundReasonNote: "/",
              refundEvidence: "/",
              lastModifiedBy: "Wsq",
              updatedAt: now,
            }
          : item,
      ),
    );
    appendAudit(
      id,
      "修改",
      `业务性质由“${previous.businessNature}”改为“${draft.businessNature}”${draft.changeReason.trim() ? `；修改说明：${draft.changeReason.trim()}` : ""}${oldRefundSnapshot}`,
    );
    setNatureRecordId(null);
    setRefundRecordId(null);
    setToast(isRefund ? "已改为退款扣回，请补充线下退款资料" : "业务性质已更新");
  };
  const saveRefund = (id: string, draft: RefundSupplementDraft) => {
    setSpecials((current) =>
      current.map((item) =>
        item.id === id && item.businessNature === "退款扣回"
          ? {
              ...item,
              type: "退款",
              handlingStatus: "退款已完成",
              fundStatus: "已退款",
              refundAmount: Number(draft.refundAmount),
              refundDate: draft.refundDate,
              transferReference: draft.transferReference.trim(),
              refundReason: draft.refundReason || "/",
              refundReasonNote: slash(draft.refundReasonNote),
              refundEvidence: slash(draft.refundEvidence),
              lastModifiedBy: "Wsq",
              updatedAt: now,
            }
          : item,
      ),
    );
    appendAudit(
      id,
      "修改",
      `补充线下退款资料，对公转账流水号 ${draft.transferReference.trim()}`,
    );
    setRefundRecordId(null);
    setToast("退款资料已补齐，资金状态已更新为已退款");
  };
  const saveManualSpecial = (draft: ManualSpecialDraft) => {
    const account = accountRecords.find((item) => item.id === draft.accountId);
    const profile = profiles.find((item) => item.id === draft.financeProfileId);
    const id = editingSpecialId ?? `SPC-MAN-${String(specials.filter((item) => item.source === "人工维护").length + 1).padStart(4, "0")}`;
    const existing = specials.find((item) => item.id === editingSpecialId);
    const record: SpecialRecord = {
      id,
      accountId: account?.id ?? "/",
      accountName: account?.accountName ?? "/",
      accountType: account?.accountType ?? "/",
      financeProfileId: profile?.id ?? "/",
      financeProfileName: profile?.customerName ?? "/",
      customerType: profile?.customerType ?? "/",
      month: draft.occurredAt.slice(0, 7),
      type: "手工补录",
      businessNature: draft.businessNature,
      occurredAt: `${draft.occurredAt.replace("T", " ")}:00`,
      planPoints: "/",
      rechargePoints: "/",
      giftPoints: "/",
      relatedRecordType: "/",
      relatedRecordId: "/",
      pointsLedgerId: "/",
      handlingStatus: "无需处理",
      fundStatus: "不涉及资金",
      refundAmount: "/",
      refundDate: "/",
      transferReference: "/",
      refundReason: "/",
      refundReasonNote: "/",
      refundEvidence: slash(draft.evidence),
      manualAmount: optionalMoney(draft.manualAmount),
      pointsImpactNote: slash(draft.pointsImpactNote),
      reason: draft.reason.trim(),
      operator: existing?.operator ?? "Wsq",
      source: "人工维护",
      lastModifiedBy: "Wsq",
      updatedAt: now,
      status: existing?.status ?? "有效",
    };
    setSpecials((current) =>
      editingSpecialId
        ? current.map((item) => (item.id === id ? record : item))
        : [record, ...current],
    );
    appendAudit(
      id,
      editingSpecialId ? "修改" : "创建",
      `${editingSpecialId ? "更新" : "新增"}人工特殊业务：${record.reason}`,
    );
    setSpecialDialogOpen(false);
    setEditingSpecialId(null);
    setToast("特殊业务已保存，仅更新财务资料");
  };
  const editRecord = (tab: TabId, id: string) => {
    if (tab === "profiles") {
      setEditingProfileId(id);
      setProfileDialogOpen(true);
    }
    if (tab === "special") {
      setEditingSpecialId(id);
      setSpecialDialogOpen(true);
    }
  };
  const voidRecord = (tab: TabId, id: string) => {
    if (tab === "profiles") {
      setProfiles((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, recordStatus: "已作废", lastModifiedBy: "Wsq", updatedAt: now }
            : item,
        ),
      );
      appendAudit(id, "作废", "财务档案已作废，历史业务快照不变");
    }
    if (tab === "special") {
      setSpecials((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, status: "已作废", lastModifiedBy: "Wsq", updatedAt: now }
            : item,
        ),
      );
      appendAudit(id, "作废", "人工特殊业务已作废，保留历史记录");
    }
  };
  const unavailableAccountIds = profiles
    .filter(
      (item) => item.recordStatus === "有效" && item.id !== editingProfileId,
    )
    .flatMap((item) => item.linkedAccountIds);
  const editingDraft = editingProfileId
    ? profileDraft(profiles.find((item) => item.id === editingProfileId)!)
    : undefined;
  const editingSpecialDraft = editingSpecialId
    ? manualSpecialDraft(specials.find((item) => item.id === editingSpecialId)!)
    : undefined;
  const selectedAccountName = !accountQuery.trim()
    ? "全部账户"
    : matchedAccounts.length === 1
      ? matchedAccounts[0].accountName
      : `匹配账户（${matchedAccounts.length}）`;
  const resetFilters = () => {
    setMonth(currentMonth);
    setAccountType("全部");
    setCustomerType("全部");
    setAccountQuery("");
    setBusinessQuery("");
    setSource("全部");
    setRecordStatus("全部");
  };

  return (
    <>
      <section className="page-heading operation-heading">
        <div>
          <div className="eyebrow">
            <LockKeyhole size={14} />
            沿用总后台角色与权限配置
          </div>
          <h1>财务数据看板</h1>
          <p>
            按财务原表查看客户资料、资金记录、积分事实、月度汇总和特殊业务，并导出
            Excel
          </p>
        </div>
        <div className="heading-actions">
          {activeTab === "profiles" && (
            <button
              className="secondary-button"
              onClick={() => {
                setEditingProfileId(null);
                setProfileDialogOpen(true);
              }}
            >
              <FilePenLine size={16} />
              新增财务档案
            </button>
          )}
          {activeTab === "special" && (
            <button
              className="secondary-button"
              onClick={() => {
                setEditingSpecialId(null);
                setSpecialDialogOpen(true);
              }}
            >
              <FilePenLine size={16} />
              新增特殊业务
            </button>
          )}
          <button
            className="primary-button export-button"
            onClick={() => setExportOpen(true)}
          >
            <Download size={16} />
            导出 Excel
          </button>
        </div>
      </section>
      <section className="scope-notice dependency-notice">
        <ShieldCheck size={16} />
        <p>
          <strong>自动闭环：</strong>
          后台增加充值积分后自动进入充值明细，扣减后自动进入特殊业务；人工补录只维护财务资料，不是人工入账。
        </p>
        <button className="inline-link" onClick={onOpenCreditAccounts}>
          去算力账户
          <ArrowRight size={13} />
        </button>
        <span>
          <RefreshCw size={13} />
          示例更新时间 2026-07-31 15:18
        </span>
      </section>
      <section className="scope-notice boundary-notice">
        <Info size={16} />
        <p>
          <strong>数据边界：</strong>
          财务身份不改变线上账号模型；人民币与积分独立记录；没有可靠来源时统一显示“/”。
        </p>
      </section>
      <FilterBar
        month={month}
        accountType={accountType}
        customerType={customerType}
        accountQuery={accountQuery}
        businessQuery={businessQuery}
        source={source}
        recordStatus={recordStatus}
        accounts={accountRecords}
        onMonthChange={setMonth}
        onAccountTypeChange={setAccountType}
        onCustomerTypeChange={setCustomerType}
        onAccountQueryChange={setAccountQuery}
        onBusinessQueryChange={setBusinessQuery}
        onSourceChange={setSource}
        onRecordStatusChange={setRecordStatus}
        onReset={resetFilters}
      />
      <SummaryStrip items={summaries[activeTab]} />
      <section className="data-panel">
        <FinanceTabs
          activeTab={activeTab}
          counts={counts}
          onChange={setActiveTab}
        />
        <header className="data-panel-heading">
          <div>
            <h2>{tabItems.find((item) => item.id === activeTab)?.label}</h2>
            <p>
              {month} · {accountType} · {customerType} · {selectedAccountName}
            </p>
          </div>
          <span className="record-count">
            共 {rowsByTab[activeTab].length} 条
          </span>
        </header>
        <aside className="tab-scope-note">
          <Info size={14} />
          <span>{tabScopeNotes[activeTab]}</span>
        </aside>
        <FinanceTable
          activeTab={activeTab}
          rows={rowsByTab[activeTab]}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onEdit={editRecord}
          onVoid={voidRecord}
          onHistory={(_, id) => setHistoryRecordId(id)}
          onSupplementRefund={setRefundRecordId}
          onChangeBusinessNature={setNatureRecordId}
        />
      </section>
      <ExportDialog
        open={exportOpen}
        month={month}
        accountType={accountType}
        accountName={selectedAccountName}
        activeTab={activeTab}
        rowCount={rowsByTab[activeTab].length}
        totalRowCount={Object.values(counts).reduce(
          (sum, value) => sum + value,
          0,
        )}
        onClose={() => setExportOpen(false)}
      />
      <ManualRecordDialog
        open={profileDialogOpen}
        accounts={accountRecords}
        unavailableAccountIds={unavailableAccountIds}
        initialDraft={editingDraft}
        onClose={() => {
          setProfileDialogOpen(false);
          setEditingProfileId(null);
        }}
        onSave={saveProfile}
      />
      <SpecialRecordDialog
        open={specialDialogOpen}
        profiles={profiles}
        accounts={accountRecords}
        initialDraft={editingSpecialDraft}
        onClose={() => {
          setSpecialDialogOpen(false);
          setEditingSpecialId(null);
        }}
        onSave={saveManualSpecial}
      />
      <RefundSupplementDialog
        record={allSpecials.find((item) => item.id === refundRecordId) ?? null}
        onClose={() => setRefundRecordId(null)}
        onSave={saveRefund}
      />
      <BusinessNatureDialog
        record={allSpecials.find((item) => item.id === natureRecordId) ?? null}
        onClose={() => setNatureRecordId(null)}
        onSave={saveBusinessNature}
      />
      <AuditHistoryDialog
        open={Boolean(historyRecordId)}
        recordId={historyRecordId ?? ""}
        logs={auditLogs}
        onClose={() => setHistoryRecordId(null)}
      />
      {toast && (
        <div className="floating-toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
