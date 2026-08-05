import { ArrowRight, Download, FilePenLine, Info, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  consumptions,
  creditEntries,
  financeProfiles,
  initialAuditLogs,
  rechargeAdjustmentLedgers,
  specialRecords,
} from "../data";
import type {
  AccountRecord,
  AccountType,
  AuditLogRecord,
  CreditEntryRecord,
  FinanceProfileRecord,
  FinanceRow,
  MonthlySummaryRecord,
  SpecialRecord,
  TabId,
} from "../types";
import { AuditHistoryDialog } from "./AuditHistoryDialog";
import { ExportDialog } from "./ExportDialog";
import { FilterBar } from "./FilterBar";
import { FinanceTable } from "./FinanceTable";
import { FinanceTabs, tabItems } from "./FinanceTabs";
import { ManualRecordDialog, type ManualRecordDraft } from "./ManualRecordDialog";
import { SummaryStrip, type SummaryItem } from "./SummaryStrip";

const currentMonth = "2026-07";
const pageSize = 5;
const now = "2026-07-31 15:18:22";
const money = (value: number) => new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(value);
const pointText = (value: number) => `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(value)} 点`;
const empty = (value?: string) => value?.trim() || "/";
const amount = (value: string | number) => typeof value === "number" ? value : 0;
const optionalAmount = (value?: string) => value ? Number(value) : "/";
const dateTime = (value?: string) => value ? value.replace("T", " ") + (value.length === 16 ? ":00" : "") : "2026-07-31 15:00:00";
const profileSnapshot = (financeProfileId: string) => financeProfiles.find((profile) => profile.id === financeProfileId);
const initialRecharges: CreditEntryRecord[] = creditEntries.map((item) => ({ ...item, customerType: item.customerType ?? profileSnapshot(item.financeProfileId)?.customerType ?? "/" }));
const initialConsumptions = consumptions.map((item) => ({ ...item, customerType: item.customerType ?? profileSnapshot(item.financeProfileId)?.customerType ?? "/" }));
const initialSpecials: SpecialRecord[] = specialRecords.map((item) => ({ ...item, customerType: item.customerType ?? profileSnapshot(item.financeProfileId)?.customerType ?? "/" }));

const tabScopeNotes: Record<TabId, string> = {
  profiles: "企业或商务身份只作为财务档案维护，不创建新的企业用户类型。同一线上账户同一时间只能归属一份有效财务档案，一份档案可以关联多个账户。",
  recharges: "资金事实与积分事实分开记录。线下款项登记后，必须关联算力账户中的真实积分调整流水，才算完成积分发放。",
  consumptions: "消费只同步线上积分流水。一笔消费可以同时扣减套餐、充值和赠送积分；没有确认的金额换算依据时，金额字段显示“/”。",
  monthly: "月度数据按当前筛选条件动态汇总，只统计未作废的有效记录；积分不自动折算人民币或收入。",
  special: "退款、清零和调账等涉及积分的事项必须关联真实积分流水；支付手续费按第三方商家后台账单、按月和渠道人工登记，不拆分到单笔订单。",
};

interface FinanceDataPageProps {
  accountRecords: AccountRecord[];
  additionalEntries: CreditEntryRecord[];
  onOpenCreditAccounts: () => void;
}

export function FinanceDataPage({ accountRecords, additionalEntries, onOpenCreditAccounts }: FinanceDataPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profiles");
  const [month, setMonth] = useState(currentMonth);
  const [accountType, setAccountType] = useState<"全部" | AccountType>("全部");
  const [accountQuery, setAccountQuery] = useState("");
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState(financeProfiles);
  const [recharges, setRecharges] = useState(initialRecharges);
  const [specials, setSpecials] = useState(initialSpecials);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(initialAuditLogs);
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const matchedAccounts = useMemo(() => {
    const query = accountQuery.trim().toLocaleLowerCase("zh-CN");
    return accountRecords.filter((account) => {
      const typeMatches = accountType === "全部" || account.accountType === accountType;
      const queryMatches = !query || [account.id, account.accountName, account.ownerName].join(" ").toLocaleLowerCase("zh-CN").includes(query);
      return typeMatches && queryMatches;
    });
  }, [accountQuery, accountRecords, accountType]);
  const accountIds = useMemo(() => new Set(matchedAccounts.map((account) => account.id)), [matchedAccounts]);
  const matches = useCallback((item: { month: string; accountId: string }) => item.month === month && accountIds.has(item.accountId), [accountIds, month]);
  const activeProfileFor = useCallback((accountId: string) => profiles.find((profile) => profile.recordStatus === "已生效" && profile.linkedAccountIds.includes(accountId)), [profiles]);

  const filteredProfiles = useMemo(() => profiles.filter((profile) => profile.linkedAccountIds.some((id) => accountIds.has(id))), [accountIds, profiles]);
  const allRecharges = useMemo(() => {
    const enrichedEntries = additionalEntries.map((item) => {
      const profile = profiles.find((candidate) => candidate.recordStatus === "已生效" && candidate.linkedAccountIds.includes(item.accountId));
      return { ...item, financeProfileId: profile?.id ?? item.financeProfileId, financeProfileName: profile?.customerName ?? item.financeProfileName, customerType: profile?.customerType ?? item.customerType ?? "/" };
    });
    return [...enrichedEntries, ...recharges];
  }, [additionalEntries, profiles, recharges]);
  const filteredRecharges = useMemo(() => allRecharges.filter(matches), [allRecharges, matches]);
  const filteredConsumptions = useMemo(() => initialConsumptions.filter(matches), [matches]);
  const filteredSpecial = useMemo(() => specials.filter((item) => item.month === month && (item.accountId === "/"
    ? accountType === "全部" && !accountQuery.trim()
    : accountIds.has(item.accountId))), [accountIds, accountQuery, accountType, month, specials]);

  const monthlySummary = useMemo<MonthlySummaryRecord>(() => {
    const validRecharges = filteredRecharges.filter((item) => item.status !== "已作废");
    const validSpecials = filteredSpecial.filter((item) => item.status !== "已作废");
    const giftAmount = validRecharges.reduce((sum, item) => sum + amount(item.giftAmount), 0);
    const feeAmount = validSpecials
      .filter((item) => item.type === "支付手续费" && item.status === "已完成")
      .reduce((sum, item) => sum + amount(item.principalAmount), 0);
    return {
      id: `MONTH-${month}`,
      month,
      newRechargePrincipal: validRecharges.reduce((sum, item) => sum + (item.receiptStatus === "已收款" ? amount(item.actualAmount) : 0), 0),
      giftAmount: giftAmount || "/",
      uncollectedRechargeAmount: validRecharges.reduce((sum, item) => sum + (item.receiptStatus === "待收款" ? amount(item.actualAmount) : 0), 0),
      principalConsumptionAmount: "/",
      giftConsumptionAmount: "/",
      paymentFeeAmount: feeAmount || "/",
      note: "按当前筛选动态汇总；金额与积分分离，无法由积分可靠形成的金额指标显示 /",
    };
  }, [filteredRecharges, filteredSpecial, month]);
  const filteredMonthly = useMemo(() => [monthlySummary], [monthlySummary]);

  const rowsByTab: Record<TabId, FinanceRow[]> = { profiles: filteredProfiles, recharges: filteredRecharges, consumptions: filteredConsumptions, monthly: filteredMonthly, special: filteredSpecial };
  const counts: Record<TabId, number> = { profiles: filteredProfiles.length, recharges: filteredRecharges.length, consumptions: filteredConsumptions.length, monthly: filteredMonthly.length, special: filteredSpecial.length };

  const summaries = useMemo<Record<TabId, SummaryItem[]>>(() => ({
    profiles: [
      { label: "财务档案", value: `${filteredProfiles.length} 份`, hint: "一份档案可关联多个线上对象" },
      { label: "人工维护", value: `${filteredProfiles.filter((item) => item.source === "人工录入").length} 份`, hint: "沿用总后台角色权限" },
      { label: "待补齐字段", value: `${filteredProfiles.filter((item) => [item.contractNo, item.unifiedCreditCode].includes("/")).length} 份`, hint: "缺失值统一显示 /" },
    ],
    recharges: [
      { label: "已完成充值", value: `${filteredRecharges.filter((item) => item.status === "已完成").length} 条`, hint: "资金与积分事实均已闭环" },
      { label: "已收款待发放", value: `${filteredRecharges.filter((item) => item.status === "已收款待发放").length} 条`, hint: "需去算力账户调整并关联流水" },
      { label: "实际充值积分", value: pointText(filteredRecharges.reduce((sum, item) => sum + item.rechargePoints, 0)), hint: "只取真实积分流水，不按金额换算" },
    ],
    consumptions: [
      { label: "套餐积分消耗", value: pointText(filteredConsumptions.reduce((sum, item) => sum + item.planPoints, 0)), hint: "同笔消费可包含三类积分" },
      { label: "充值积分消耗", value: pointText(filteredConsumptions.reduce((sum, item) => sum + item.rechargePoints, 0)), hint: "按积分流水汇总" },
      { label: "赠送积分消耗", value: pointText(filteredConsumptions.reduce((sum, item) => sum + item.giftPoints, 0)), hint: "未确认金额口径时不换算" },
    ],
    monthly: [
      { label: "会计月份", value: month, hint: "按当前条件动态汇总" },
      { label: "新增充值本金", value: money(monthlySummary.newRechargePrincipal), hint: "线上订单与人工收款记录合计" },
      { label: "未回款充值", value: money(monthlySummary.uncollectedRechargeAmount), hint: "来自待收款记录" },
    ],
    special: [
      { label: "特殊业务记录", value: `${filteredSpecial.length} 条`, hint: "系统同步与人工录入" },
      { label: "待闭环", value: `${filteredSpecial.filter((item) => ["待处理", "资金已处理待积分"].includes(item.status)).length} 条`, hint: "资金或积分事实尚未完成" },
      { label: "支付手续费", value: filteredSpecial.some((item) => item.type === "支付手续费" && item.status === "已完成") ? money(filteredSpecial.filter((item) => item.type === "支付手续费" && item.status === "已完成").reduce((sum, item) => sum + amount(item.principalAmount), 0)) : "/", hint: "商家后台按月、按渠道录入" },
    ],
  }), [filteredConsumptions, filteredProfiles, filteredRecharges, filteredSpecial, month, monthlySummary]);

  useEffect(() => setPage(1), [activeTab, month, accountType, accountQuery]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedAccountName = !accountQuery.trim()
    ? "全部账户"
    : matchedAccounts.length === 1
      ? matchedAccounts[0].accountName
      : matchedAccounts.length
        ? `匹配账户（${matchedAccounts.length}）`
        : "无匹配账户";
  const manualTabs: TabId[] = ["profiles", "recharges", "special"];
  const manualLabel: Partial<Record<TabId, string>> = { profiles: "新增财务档案", recharges: "录入线下充值", special: "录入特殊业务" };
  const unavailableAccountIds = useMemo(() => profiles
    .filter((profile) => profile.recordStatus === "已生效" && profile.id !== editingId)
    .flatMap((profile) => profile.linkedAccountIds), [editingId, profiles]);

  const editingDraft = useMemo<ManualRecordDraft | undefined>(() => {
    if (!editingId) return undefined;
    if (activeTab === "profiles") {
      const item = profiles.find((record) => record.id === editingId);
      if (!item) return undefined;
      return {
        customerType: item.customerType,
        customerName: item.customerName,
        unifiedCreditCode: item.unifiedCreditCode === "/" ? "" : item.unifiedCreditCode,
        contactName: item.contactName === "/" ? "" : item.contactName,
        contactPhone: item.contactPhone === "/" ? "" : item.contactPhone,
        accountStatus: item.accountStatus,
        contractNo: item.contractNo === "/" ? "" : item.contractNo,
        serviceStart: item.serviceStart === "/" ? "" : item.serviceStart,
        serviceEnd: item.serviceEnd === "/" ? "" : item.serviceEnd,
        packageCycle: item.packageCycle,
        contractPrepaidCap: typeof item.contractPrepaidCap === "number" ? String(item.contractPrepaidCap) : "",
        unitPriceStandard: item.unitPriceStandard === "/" ? "" : item.unitPriceStandard,
        invoiceNeeded: item.invoiceNeeded,
        historicalInvoicedAmount: typeof item.historicalInvoicedAmount === "number" ? String(item.historicalInvoicedAmount) : "",
        uninvoicedPrepaidBalance: typeof item.uninvoicedPrepaidBalance === "number" ? String(item.uninvoicedPrepaidBalance) : "",
        linkedAccountIds: item.linkedAccountIds,
      };
    }
    if (activeTab === "recharges") {
      const item = recharges.find((record) => record.id === editingId);
      if (!item) return undefined;
      return {
        accountId: item.accountId === "/" ? "" : item.accountId,
        occurredAt: item.occurredAt.slice(0, 16).replace(" ", "T"),
        principalAmount: typeof item.actualAmount === "number" ? String(item.actualAmount) : "",
        giftAmount: typeof item.giftAmount === "number" ? String(item.giftAmount) : "",
        paymentMethod: item.paymentMethod,
        paymentReference: item.paymentReference === "/" ? "" : item.paymentReference,
        discountType: item.discountType,
        activityBatch: item.activityBatch === "/" ? "" : item.activityBatch,
        receiptStatus: item.receiptStatus,
        contractNo: item.contractNo === "/" ? "" : item.contractNo,
        pointsLedgerId: item.pointsLedgerId === "/" ? "" : item.pointsLedgerId,
      };
    }
    if (activeTab === "special") {
      const item = specials.find((record) => record.id === editingId);
      if (!item) return undefined;
      return {
        accountId: item.accountId,
        occurredAt: item.occurredAt.slice(0, 16).replace(" ", "T"),
        principalAmount: typeof item.principalAmount === "number" ? String(item.principalAmount) : "",
        giftAmount: typeof item.giftAmount === "number" ? String(item.giftAmount) : "",
        specialType: item.type,
        paymentChannel: item.paymentChannel === "/" ? "" : item.paymentChannel,
        fundStatus: item.fundStatus,
        pointsLedgerId: item.pointsLedgerId === "/" ? "" : item.pointsLedgerId,
        relatedRecordId: item.relatedRecordId === "/" ? "" : item.relatedRecordId,
        reason: item.reason === "/" ? "" : item.reason,
        attachment: item.attachment === "/" ? "" : item.attachment,
      };
    }
    return undefined;
  }, [activeTab, editingId, profiles, recharges, specials]);

  const appendAudit = (recordId: string, action: AuditLogRecord["action"], detail: string) => {
    setAuditLogs((current) => [{ id: `AUD-${Date.now()}-${current.length}`, recordId, action, operator: "Wsq", occurredAt: now, detail }, ...current]);
  };

  const saveManualRecord = (draft: ManualRecordDraft) => {
    if (activeTab === "profiles") {
      const linked = accountRecords.filter((item) => draft.linkedAccountIds?.includes(item.id));
      const recordId = editingId ?? `FIN-${String(profiles.length + 1).padStart(4, "0")}`;
      const record: FinanceProfileRecord = {
        id: recordId,
        customerType: draft.customerType === "个人" ? "个人" : "企业",
        customerName: empty(draft.customerName),
        unifiedCreditCode: empty(draft.unifiedCreditCode),
        contactName: empty(draft.contactName),
        contactPhone: empty(draft.contactPhone),
        accountStatus: empty(draft.accountStatus),
        contractNo: empty(draft.contractNo),
        serviceStart: empty(draft.serviceStart),
        serviceEnd: empty(draft.serviceEnd),
        packageCycle: empty(draft.packageCycle),
        contractPrepaidCap: optionalAmount(draft.contractPrepaidCap),
        unitPriceStandard: empty(draft.unitPriceStandard),
        invoiceNeeded: empty(draft.invoiceNeeded),
        historicalInvoicedAmount: optionalAmount(draft.historicalInvoicedAmount),
        uninvoicedPrepaidBalance: optionalAmount(draft.uninvoicedPrepaidBalance),
        linkedAccountIds: linked.map((item) => item.id),
        linkedAccountNames: linked.map((item) => item.accountName),
        source: "人工录入",
        operator: "Wsq",
        updatedAt: now,
        recordStatus: "已生效",
      };
      setProfiles((current) => editingId ? current.map((item) => item.id === editingId ? record : item) : [record, ...current]);
      appendAudit(recordId, editingId ? "修改" : "创建", `${editingId ? "更新" : "创建"}财务档案，关联 ${linked.map((item) => item.id).join("、") || "/"}`);
    }

    if (activeTab === "recharges") {
      const account = accountRecords.find((item) => item.id === draft.accountId);
      if (!account) return;
      const ledger = rechargeAdjustmentLedgers.find((item) => item.id === draft.pointsLedgerId && item.accountId === account.id && item.delta > 0);
      const profile = activeProfileFor(account.id);
      const receiptStatus = draft.receiptStatus === "待收款" ? "待收款" : "已收款";
      const recordId = editingId ?? `OFF-${month.replace("-", "")}-${String(recharges.length + 1).padStart(3, "0")}`;
      const previousLedgerId = editingId ? recharges.find((item) => item.id === editingId)?.pointsLedgerId : undefined;
      const record: CreditEntryRecord = {
        id: recordId,
        recordSource: "人工充值记录",
        accountId: account.id,
        accountName: account.accountName,
        accountType: account.accountType,
        financeProfileId: profile?.id ?? "/",
        financeProfileName: profile?.customerName ?? "/",
        customerType: profile?.customerType ?? "/",
        month,
        businessType: "线下购买",
        actualAmount: optionalAmount(draft.principalAmount),
        giftAmount: optionalAmount(draft.giftAmount),
        paymentMethod: empty(draft.paymentMethod),
        paymentReference: empty(draft.paymentReference),
        discountType: empty(draft.discountType),
        activityBatch: empty(draft.activityBatch),
        receiptStatus,
        contractNo: empty(draft.contractNo),
        planName: "/",
        planPoints: 0,
        rechargePoints: ledger?.delta ?? 0,
        giftPoints: 0,
        pointsLedgerId: ledger?.id ?? "/",
        pointsDeliveryStatus: ledger ? "已发放" : "待发放",
        occurredAt: dateTime(draft.occurredAt),
        operator: "Wsq",
        status: receiptStatus === "待收款" ? "待收款" : ledger ? "已完成" : "已收款待发放",
        reason: "财务人工登记；积分由算力账户调整后关联",
        source: "人工录入",
        updatedAt: now,
      };
      setRecharges((current) => editingId ? current.map((item) => item.id === editingId ? record : item) : [record, ...current]);
      appendAudit(recordId, editingId ? "修改" : "创建", `${editingId ? "更新" : "登记"}线下充值，收款状态：${receiptStatus}`);
      if (ledger && previousLedgerId !== ledger.id) appendAudit(recordId, "关联积分流水", `关联 ${ledger.id}，实际充值积分 ${ledger.delta.toLocaleString("zh-CN")} 点`);
    }

    if (activeTab === "special") {
      const specialType = (draft.specialType ?? "退款业务") as SpecialRecord["type"];
      const isPaymentFee = specialType === "支付手续费";
      const account = accountRecords.find((item) => item.id === draft.accountId);
      if (!isPaymentFee && !account) return;
      const profile = account ? activeProfileFor(account.id) : undefined;
      const ledger = account ? rechargeAdjustmentLedgers.find((item) => item.id === draft.pointsLedgerId && item.accountId === account.id) : undefined;
      const fundStatus = (isPaymentFee ? "已支付" : draft.fundStatus ?? "待处理") as SpecialRecord["fundStatus"];
      const pointsRequired = ["退款业务", "过期清零", "调账 / 冲红"].includes(specialType);
      const status: SpecialRecord["status"] = fundStatus === "待处理"
        ? "待处理"
        : pointsRequired && !ledger
          ? "资金已处理待积分"
          : "已完成";
      const recordId = editingId ?? `MAN-${month.replace("-", "")}-${String(specials.length + 1).padStart(3, "0")}`;
      const previousLedgerId = editingId ? specials.find((item) => item.id === editingId)?.pointsLedgerId : undefined;
      const record: SpecialRecord = {
        id: recordId,
        accountId: account?.id ?? "/",
        accountName: account?.accountName ?? "/",
        accountType: account?.accountType ?? "/",
        financeProfileId: profile?.id ?? "/",
        financeProfileName: profile?.customerName ?? "/",
        customerType: profile?.customerType ?? "/",
        month,
        type: specialType,
        occurredAt: dateTime(draft.occurredAt),
        planPoints: 0,
        rechargePoints: ledger?.delta ?? 0,
        giftPoints: 0,
        principalAmount: optionalAmount(draft.principalAmount),
        giftAmount: isPaymentFee ? "/" : optionalAmount(draft.giftAmount),
        relatedRecordType: !isPaymentFee && draft.relatedRecordId ? "关联原记录" : "/",
        relatedRecordId: isPaymentFee ? "/" : empty(draft.relatedRecordId),
        pointsLedgerId: ledger?.id ?? "/",
        paymentChannel: isPaymentFee ? empty(draft.paymentChannel) : "/",
        fundStatus,
        reason: empty(draft.reason),
        attachment: empty(draft.attachment),
        operator: "Wsq",
        source: "人工录入",
        updatedAt: now,
        status,
      };
      setSpecials((current) => editingId ? current.map((item) => item.id === editingId ? record : item) : [record, ...current]);
      appendAudit(recordId, editingId ? "修改" : "创建", isPaymentFee
        ? `${editingId ? "更新" : "登记"}${month} ${empty(draft.paymentChannel)}手续费合计`
        : `${editingId ? "更新" : "登记"}${specialType}，资金状态：${fundStatus}`);
      if (ledger && previousLedgerId !== ledger.id) appendAudit(recordId, "关联积分流水", `关联 ${ledger.id}，积分变动 ${ledger.delta.toLocaleString("zh-CN")} 点`);
    }
    setManualOpen(false);
    setEditingId(null);
    setToast(editingId ? "记录已更新，变更信息已保留" : "人工记录已保存");
  };

  const editRecord = (tab: TabId, id: string) => {
    setActiveTab(tab);
    setEditingId(id);
    setManualOpen(true);
  };
  const voidRecord = (tab: TabId, id: string) => {
    if (tab === "profiles") setProfiles((current) => current.map((item) => item.id === id ? { ...item, recordStatus: "已作废", operator: "Wsq", updatedAt: now } : item));
    if (tab === "recharges") setRecharges((current) => current.map((item) => item.id === id ? { ...item, status: "已作废", operator: "Wsq", updatedAt: now } : item));
    if (tab === "special") setSpecials((current) => current.map((item) => item.id === id ? { ...item, status: "已作废", operator: "Wsq", updatedAt: now } : item));
    appendAudit(id, "作废", "人工记录已作废，原数据继续保留并可查询");
    setToast("记录已作废，原数据与操作轨迹仍保留");
  };

  return <>
    <section className="page-heading operation-heading">
      <div><div className="eyebrow"><LockKeyhole size={14} />沿用总后台角色与权限配置</div><h1>财务数据看板</h1><p>按财务原始表格管理客户资料、资金记录、积分事实、月度汇总及特殊业务，支持系统同步、人工维护和 Excel 导出</p></div>
      <div className="heading-actions">{manualTabs.includes(activeTab) && <button className="secondary-button" onClick={() => { setEditingId(null); setManualOpen(true); }}><FilePenLine size={16} />{manualLabel[activeTab]}</button>}<button className="primary-button export-button" onClick={() => setExportOpen(true)}><Download size={16} />导出 Excel</button></div>
    </section>
    <section className="scope-notice dependency-notice">
      <ShieldCheck size={16} /><p><strong>闭环规则：</strong>财务看板只记录资金和业务事实，不直接修改积分。需要积分变动时，先在算力账户完成调整，再回到对应记录关联真实积分流水。</p>
      <button className="inline-link" onClick={onOpenCreditAccounts}>去算力账户<ArrowRight size={13} /></button><span><RefreshCw size={13} />示例更新时间 2026-07-31 15:18</span>
    </section>
    <section className="scope-notice boundary-notice"><Info size={16} /><p><strong>身份与口径边界：</strong>企业、渠道等只作为财务或商务档案，不改变线上“用户 / 团队 / 算力账户”模型。人民币金额和积分分别记录，没有确认规则时不自动换算。</p></section>
    <FilterBar month={month} accountType={accountType} accountQuery={accountQuery} accounts={accountRecords} onMonthChange={setMonth} onAccountTypeChange={setAccountType} onAccountQueryChange={setAccountQuery} onReset={() => { setMonth(currentMonth); setAccountType("全部"); setAccountQuery(""); }} />
    <SummaryStrip items={summaries[activeTab]} />
    <section className="data-panel">
      <FinanceTabs activeTab={activeTab} counts={counts} onChange={setActiveTab} />
      <header className="data-panel-heading"><div><h2>{tabItems.find((item) => item.id === activeTab)?.label}</h2><p>{month} · {accountType}账户 · {selectedAccountName}</p></div><span className="record-count">共 {rowsByTab[activeTab].length} 条</span></header>
      <aside className="tab-scope-note"><Info size={14} /><span>{tabScopeNotes[activeTab]}</span></aside>
      <FinanceTable activeTab={activeTab} rows={rowsByTab[activeTab]} page={page} pageSize={pageSize} onPageChange={setPage} onEdit={editRecord} onVoid={voidRecord} onHistory={(_, id) => setHistoryRecordId(id)} />
    </section>
    <ExportDialog open={exportOpen} month={month} accountType={accountType} accountName={selectedAccountName} activeTab={activeTab} rowCount={rowsByTab[activeTab].length} totalRowCount={Object.values(counts).reduce((sum, value) => sum + value, 0)} onClose={() => setExportOpen(false)} />
    <ManualRecordDialog open={manualOpen} tab={activeTab} accounts={accountRecords} ledgers={rechargeAdjustmentLedgers} unavailableAccountIds={unavailableAccountIds} initialDraft={editingDraft} onClose={() => { setManualOpen(false); setEditingId(null); }} onSave={saveManualRecord} />
    <AuditHistoryDialog open={Boolean(historyRecordId)} recordId={historyRecordId ?? ""} logs={auditLogs} onClose={() => setHistoryRecordId(null)} />
    {toast && <div className="floating-toast" role="status">{toast}</div>}
  </>;
}
