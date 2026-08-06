import { ChevronLeft, ChevronRight, FileSearch, History, PencilLine, Ban } from "lucide-react";
import type {
  ConsumptionRecord,
  CreditEntryRecord,
  FinanceProfileRecord,
  FinanceRow,
  MonthlySummaryRecord,
  SpecialRecord,
  TabId,
} from "../types";
import { StatusBadge } from "./StatusBadge";

const money = (value: number) => new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(value);
const points = (value: number) => `${value > 0 ? "+" : ""}${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(Object.is(value, -0) ? 0 : value)} 点`;
const pointCell = (value: number) => <span className={value > 0 ? "money-positive" : value < 0 ? "money-negative" : "muted-value"}>{points(value)}</span>;
const valueCell = (value: string | number) => value === "" || value === null || value === undefined ? <span className="placeholder-value">/</span> : value === "/" ? <span className="placeholder-value">/</span> : typeof value === "number" ? money(value) : value;

interface FinanceTableProps {
  activeTab: TabId;
  rows: FinanceRow[];
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (tab: TabId, id: string) => void;
  onVoid: (tab: TabId, id: string) => void;
  onHistory: (tab: TabId, id: string) => void;
}

const headers: Record<TabId, string[]> = {
  profiles: ["财务档案编号", "客户类型", "企业 / 个人账户全称", "统一社会信用代码", "联系人", "联系方式", "账户状态", "合同编号", "服务起始日期", "服务终止日期", "套餐周期", "合同总预存上限", "收费单价标准", "是否需要发票", "历史已开票金额", "未开票预收余额", "关联用户 / 团队 / 算力账户", "来源", "操作人", "更新时间", "记录状态", "操作"],
  recharges: ["充值订单号 / 记录编号", "财务主体", "客户类型", "发生日期", "充值本金金额", "赠送金额", "支付渠道", "支付交易单号", "充值优惠类型", "活动批次", "收款状态", "合同编号", "关联账户", "积分调整流水", "实际充值积分", "实际赠送积分", "积分状态", "来源", "操作人", "更新时间", "业务状态", "操作"],
  consumptions: ["消费流水号", "财务主体", "客户类型", "扣费时间", "本金抵扣金额", "赠送余额抵扣金额", "扣费单价", "使用计量依据", "关联合同编号", "关联账户", "套餐积分扣减", "充值积分扣减", "赠送积分扣减", "消费场景", "模型 / 服务", "关联类型", "关联 ID", "状态"],
  monthly: ["会计月份", "当月新增充值总本金", "当月赠送总金额", "当月赊销未回款充值总额", "当月本金消费总额", "当月赠送额度消耗总额", "口径说明"],
  special: ["记录编号", "业务类型", "财务主体", "客户类型", "发生月份", "发生时间", "关联账户", "积分扣减流水", "退款日期", "资金状态", "退款金额", "对公转账流水号", "套餐积分变动", "充值积分变动", "赠送积分变动", "原因 / 备注", "退款凭证", "来源", "操作人", "更新时间", "业务状态", "操作"],
};

function actionCell(tab: TabId, id: string, source: string, status: string, handlers: Pick<FinanceTableProps, "onEdit" | "onVoid" | "onHistory">) {
  if (source !== "人工录入") return <span className="placeholder-value">/</span>;
  return <div className="row-actions">
    <button aria-label="编辑" title="编辑" disabled={status === "已作废"} onClick={() => handlers.onEdit(tab, id)}><PencilLine size={13} /></button>
    <button aria-label="查看变更记录" title="查看变更记录" onClick={() => handlers.onHistory(tab, id)}><History size={13} /></button>
    <button aria-label="作废" title="作废" disabled={status === "已作废"} onClick={() => handlers.onVoid(tab, id)}><Ban size={13} /></button>
  </div>;
}

function specialActionCell(item: SpecialRecord, handlers: Pick<FinanceTableProps, "onEdit" | "onVoid" | "onHistory">) {
  if (!["后台手动扣减", "退款业务"].includes(item.type)) return <span className="placeholder-value">/</span>;
  const label = item.type === "退款业务" ? "编辑退款资料" : "标记为退款";
  return <div className="row-actions">
    <button aria-label={label} title={label} onClick={() => handlers.onEdit("special", item.id)}><PencilLine size={13} /></button>
    <button aria-label="查看变更记录" title="查看变更记录" onClick={() => handlers.onHistory("special", item.id)}><History size={13} /></button>
  </div>;
}

function cellsFor(tab: TabId, row: FinanceRow, handlers: Pick<FinanceTableProps, "onEdit" | "onVoid" | "onHistory">) {
  if (tab === "profiles") {
    const item = row as FinanceProfileRecord;
    return [item.id, <StatusBadge value={item.customerType} />, <strong>{item.customerName}</strong>, valueCell(item.unifiedCreditCode), valueCell(item.contactName), valueCell(item.contactPhone), item.accountStatus, valueCell(item.contractNo), valueCell(item.serviceStart), valueCell(item.serviceEnd), valueCell(item.packageCycle), valueCell(item.contractPrepaidCap), valueCell(item.unitPriceStandard), valueCell(item.invoiceNeeded), valueCell(item.historicalInvoicedAmount), valueCell(item.uninvoicedPrepaidBalance), item.linkedAccountNames.join("、") || "/", <StatusBadge value={item.source} />, item.operator, item.updatedAt, <StatusBadge value={item.recordStatus} />, actionCell(tab, item.id, item.source, item.recordStatus, handlers)];
  }
  if (tab === "recharges") {
    const item = row as CreditEntryRecord;
    return [item.id, valueCell(item.financeProfileName), valueCell(item.customerType ?? "/"), item.occurredAt, valueCell(item.actualAmount), valueCell(item.giftAmount), valueCell(item.paymentMethod), valueCell(item.paymentReference), valueCell(item.discountType), valueCell(item.activityBatch), valueCell(item.receiptStatus), valueCell(item.contractNo), <strong>{item.accountName}</strong>, valueCell(item.pointsLedgerId), pointCell(item.rechargePoints), pointCell(item.giftPoints), <StatusBadge value={item.pointsDeliveryStatus} />, <StatusBadge value={item.source} />, item.operator, item.updatedAt, <StatusBadge value={item.status} />, actionCell(tab, item.id, item.source, item.status, handlers)];
  }
  if (tab === "consumptions") {
    const item = row as ConsumptionRecord;
    return [item.id, valueCell(item.financeProfileName), valueCell(item.customerType ?? "/"), item.occurredAt, valueCell(item.principalDeductionAmount), valueCell(item.giftDeductionAmount), valueCell(item.billingUnitPrice), valueCell(item.measurementBasis), valueCell(item.contractNo), <strong>{item.accountName}</strong>, pointCell(-Math.abs(item.planPoints)), pointCell(-Math.abs(item.rechargePoints)), pointCell(-Math.abs(item.giftPoints)), item.scene, item.service, item.relatedType, item.relatedId, <StatusBadge value={item.status} />];
  }
  if (tab === "monthly") {
    const item = row as MonthlySummaryRecord;
    return [item.month, money(item.newRechargePrincipal), valueCell(item.giftAmount), money(item.uncollectedRechargeAmount), valueCell(item.principalConsumptionAmount), valueCell(item.giftConsumptionAmount), item.note];
  }
  const item = row as SpecialRecord;
  return [item.id, <span className="special-type">{item.type}</span>, valueCell(item.financeProfileName), valueCell(item.customerType ?? "/"), item.month, item.occurredAt, valueCell(item.accountName), valueCell(item.pointsLedgerId), valueCell(item.refundAt ?? "/"), <StatusBadge value={item.fundStatus} />, valueCell(item.principalAmount), valueCell(item.refundReference ?? "/"), pointCell(item.planPoints), pointCell(item.rechargePoints), pointCell(item.giftPoints), item.reason, valueCell(item.attachment), <StatusBadge value={item.source} />, item.operator, item.updatedAt, <StatusBadge value={item.status} />, specialActionCell(item, handlers)];
}

export function FinanceTable({ activeTab, rows, page, pageSize, onPageChange, onEdit, onVoid, onHistory }: FinanceTableProps) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const handlers = { onEdit, onVoid, onHistory };

  if (!rows.length) {
    return <section className="empty-state" role="status"><span><FileSearch size={26} /></span><h3>当前筛选条件下暂无数据</h3><p>暂无数据的表格字段在页面及 Excel 中统一使用“/”占位。</p></section>;
  }

  return <>
    <div className="table-scroll">
      <table className="finance-wide-table">
        <thead><tr>{headers[activeTab].map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{visibleRows.map((row) => <tr key={row.id}>{cellsFor(activeTab, row, handlers).map((cell, index) => <td key={`${row.id}-${headers[activeTab][index]}`}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
    <footer className="table-footer">
      <span>共 <strong>{rows.length}</strong> 条，第 {currentPage} / {totalPages} 页</span>
      <div className="pagination">
        <button aria-label="上一页" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}><ChevronLeft size={16} /></button>
        <button className="page-current" aria-current="page">{currentPage}</button>
        {currentPage < totalPages && <button onClick={() => onPageChange(currentPage + 1)}>{currentPage + 1}</button>}
        <button aria-label="下一页" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}><ChevronRight size={16} /></button>
      </div>
    </footer>
  </>;
}
