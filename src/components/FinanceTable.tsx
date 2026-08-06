import {
  Ban,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  History,
  Landmark,
  PencilLine,
} from "lucide-react";
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

const money = (value: number) =>
  new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(
    value,
  );
const placeholder = <span className="placeholder-value">/</span>;
const valueCell = (value: string | number) =>
  value === "" || value === "/" || value === null || value === undefined
    ? placeholder
    : value;
const moneyCell = (value: string | number) =>
  typeof value === "number" ? money(value) : valueCell(value);
const pointCell = (value: string | number, signed = true) => {
  if (typeof value !== "number") return valueCell(value);
  const normalized = Object.is(value, -0) ? 0 : value;
  return (
    <span
      className={
        normalized > 0
          ? "money-positive"
          : normalized < 0
            ? "money-negative"
            : "muted-value"
      }
    >
      {signed && normalized > 0 ? "+" : ""}
      {normalized.toLocaleString("zh-CN")} 点
    </span>
  );
};

interface FinanceTableProps {
  activeTab: TabId;
  rows: FinanceRow[];
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (tab: TabId, id: string) => void;
  onVoid: (tab: TabId, id: string) => void;
  onHistory: (tab: TabId, id: string) => void;
  onSupplementRefund: (id: string) => void;
  onChangeBusinessNature: (id: string) => void;
}

const headers: Record<TabId, string[]> = {
  profiles: [
    "财务档案编号",
    "客户类型",
    "企业 / 个人账户全称",
    "统一社会信用代码",
    "联系人",
    "联系方式",
    "账户状态",
    "合同编号",
    "服务起始日期",
    "服务终止日期",
    "套餐周期",
    "合同总预存上限",
    "收费单价标准",
    "是否需要发票",
    "历史已开票金额",
    "未开票预收余额",
    "关联线上对象",
    "数据来源",
    "原操作人",
    "最后修改人",
    "更新时间",
    "记录状态",
    "操作",
  ],
  recharges: [
    "充值订单号 / 记录编号",
    "记录来源",
    "业务性质",
    "财务档案编号",
    "财务主体",
    "客户类型",
    "充值发生日期（时间）",
    "会计月份",
    "账户归属类型",
    "账户 ID",
    "关联账户",
    "充值本金金额",
    "赠送金额",
    "支付渠道",
    "支付交易单号",
    "充值优惠类型",
    "活动批次",
    "收款状态",
    "合同编号",
    "套餐名称",
    "套餐积分",
    "充值积分",
    "赠送积分",
    "积分流水号",
    "积分状态",
    "调整说明",
    "数据来源",
    "原操作人",
    "最后修改人",
    "更新时间",
    "记录状态",
  ],
  consumptions: [
    "消费流水号",
    "财务档案编号",
    "财务主体",
    "客户类型",
    "消费时间",
    "会计月份",
    "账户归属类型",
    "账户 ID",
    "关联账户",
    "套餐积分扣减",
    "充值积分扣减",
    "赠送积分扣减",
    "本金抵扣金额",
    "赠送余额抵扣金额",
    "消费单价",
    "使用计量依据",
    "消费场景",
    "模型 / 服务",
    "合同编号",
    "关联业务类型",
    "关联业务 ID",
    "消费状态",
    "数据来源",
    "原操作人",
    "最后修改人",
    "更新时间",
    "记录状态",
  ],
  monthly: [
    "会计月份",
    "当月新增充值总本金",
    "当月赠送总金额",
    "当月赊销未回款充值总额",
    "当月本金消费总额",
    "当月赠送额度消耗总额",
    "口径说明",
  ],
  special: [
    "特殊业务记录编号",
    "业务类型",
    "业务性质",
    "财务档案编号",
    "财务主体",
    "客户类型",
    "发生时间",
    "会计月份",
    "账户归属类型",
    "账户 ID",
    "关联账户",
    "原记录类型",
    "原记录编号",
    "积分流水号",
    "套餐积分变动",
    "充值积分变动",
    "赠送积分变动",
    "处理状态",
    "资金状态",
    "退款金额",
    "退款日期",
    "对公转账流水号",
    "退款原因",
    "退款原因说明",
    "调整说明",
    "退款凭证",
    "数据来源",
    "原操作人",
    "最后修改人",
    "更新时间",
    "记录状态",
    "操作",
  ],
};

function profileActions(
  item: FinanceProfileRecord,
  handlers: FinanceTableProps,
) {
  return (
    <div className="row-actions">
      <button
        aria-label="编辑财务档案"
        title="编辑财务档案"
        disabled={item.recordStatus === "已作废"}
        onClick={() => handlers.onEdit("profiles", item.id)}
      >
        <PencilLine size={13} />
      </button>
      <button
        aria-label="查看变更记录"
        title="查看变更记录"
        onClick={() => handlers.onHistory("profiles", item.id)}
      >
        <History size={13} />
      </button>
      <button
        aria-label="作废财务档案"
        title="作废财务档案"
        disabled={item.recordStatus === "已作废"}
        onClick={() => handlers.onVoid("profiles", item.id)}
      >
        <Ban size={13} />
      </button>
    </div>
  );
}

function specialActions(item: SpecialRecord, handlers: FinanceTableProps) {
  if (
    !(["后台手动扣减", "退款业务"] as SpecialRecord["type"][]).includes(
      item.type,
    )
  )
    return placeholder;
  return (
    <div className="row-actions">
      <button aria-label="修改业务性质" title="修改业务性质" onClick={() => handlers.onChangeBusinessNature(item.id)}>
        <PencilLine size={13} />
      </button>
      {item.businessNature === "退款扣回" && (
        <button
          aria-label="补充退款资料"
          title="补充退款资料"
          onClick={() => handlers.onSupplementRefund(item.id)}
        >
          <Landmark size={13} />
        </button>
      )}
      <button
        aria-label="查看变更记录"
        title="查看变更记录"
        onClick={() => handlers.onHistory("special", item.id)}
      >
        <History size={13} />
      </button>
    </div>
  );
}

function cellsFor(tab: TabId, row: FinanceRow, handlers: FinanceTableProps) {
  if (tab === "profiles") {
    const item = row as FinanceProfileRecord;
    return [
      item.id,
      <StatusBadge value={item.customerType} />,
      <strong>{item.customerName}</strong>,
      valueCell(item.unifiedCreditCode),
      valueCell(item.contactName),
      valueCell(item.contactPhone),
      item.accountStatus,
      valueCell(item.contractNo),
      valueCell(item.serviceStart),
      valueCell(item.serviceEnd),
      item.packageCycle,
      moneyCell(item.contractPrepaidCap),
      valueCell(item.unitPriceStandard),
      valueCell(item.invoiceNeeded),
      moneyCell(item.historicalInvoicedAmount),
      moneyCell(item.uninvoicedPrepaidBalance),
      item.linkedAccountNames.join("、") || "/",
      <StatusBadge value={item.source} />,
      item.operator,
      valueCell(item.lastModifiedBy),
      item.updatedAt,
      <StatusBadge value={item.recordStatus} />,
      profileActions(item, handlers),
    ];
  }
  if (tab === "recharges") {
    const item = row as CreditEntryRecord;
    return [
      item.id,
      item.recordSource,
      <StatusBadge value={item.businessNature} />,
      valueCell(item.financeProfileId),
      valueCell(item.financeProfileName),
      valueCell(item.customerType),
      item.occurredAt,
      item.month,
      <StatusBadge value={item.accountType} />,
      item.accountId,
      <strong>{item.accountName}</strong>,
      moneyCell(item.actualAmount),
      moneyCell(item.giftAmount),
      valueCell(item.paymentMethod),
      valueCell(item.paymentReference),
      valueCell(item.discountType),
      valueCell(item.activityBatch),
      valueCell(item.receiptStatus),
      valueCell(item.contractNo),
      valueCell(item.planName),
      pointCell(item.planPoints),
      pointCell(item.rechargePoints),
      pointCell(item.giftPoints),
      valueCell(item.pointsLedgerId),
      <StatusBadge value={item.pointsDeliveryStatus} />,
      valueCell(item.reason),
      <StatusBadge value={item.source} />,
      item.operator,
      valueCell(item.lastModifiedBy),
      item.updatedAt,
      <StatusBadge value={item.status} />,
    ];
  }
  if (tab === "consumptions") {
    const item = row as ConsumptionRecord;
    return [
      item.id,
      valueCell(item.financeProfileId),
      valueCell(item.financeProfileName),
      valueCell(item.customerType),
      item.occurredAt,
      item.month,
      <StatusBadge value={item.accountType} />,
      item.accountId,
      <strong>{item.accountName}</strong>,
      pointCell(
        typeof item.planPoints === "number"
          ? -Math.abs(item.planPoints)
          : item.planPoints,
        false,
      ),
      pointCell(
        typeof item.rechargePoints === "number"
          ? -Math.abs(item.rechargePoints)
          : item.rechargePoints,
        false,
      ),
      pointCell(
        typeof item.giftPoints === "number"
          ? -Math.abs(item.giftPoints)
          : item.giftPoints,
        false,
      ),
      moneyCell(item.principalDeductionAmount),
      moneyCell(item.giftDeductionAmount),
      valueCell(item.billingUnitPrice),
      valueCell(item.measurementBasis),
      valueCell(item.scene),
      valueCell(item.service),
      valueCell(item.contractNo),
      valueCell(item.relatedType),
      valueCell(item.relatedId),
      <StatusBadge value={item.status} />,
      <StatusBadge value={item.source} />,
      item.operator,
      valueCell(item.lastModifiedBy),
      item.updatedAt,
      <StatusBadge value={item.recordStatus} />,
    ];
  }
  if (tab === "monthly") {
    const item = row as MonthlySummaryRecord;
    return [
      item.month,
      moneyCell(item.newRechargePrincipal),
      moneyCell(item.giftAmount),
      moneyCell(item.uncollectedRechargeAmount),
      moneyCell(item.principalConsumptionAmount),
      moneyCell(item.giftConsumptionAmount),
      item.note,
    ];
  }
  const item = row as SpecialRecord;
  return [
    item.id,
    <span className="special-type">{item.type}</span>,
    <StatusBadge value={item.businessNature} />,
    valueCell(item.financeProfileId),
    valueCell(item.financeProfileName),
    valueCell(item.customerType),
    item.occurredAt,
    item.month,
    <StatusBadge value={item.accountType} />,
    item.accountId,
    valueCell(item.accountName),
    valueCell(item.relatedRecordType),
    valueCell(item.relatedRecordId),
    valueCell(item.pointsLedgerId),
    pointCell(item.planPoints),
    pointCell(item.rechargePoints),
    pointCell(item.giftPoints),
    <StatusBadge value={item.handlingStatus} />,
    <StatusBadge value={item.fundStatus} />,
    moneyCell(item.refundAmount),
    valueCell(item.refundDate),
    valueCell(item.transferReference),
    valueCell(item.refundReason),
    valueCell(item.refundReasonNote),
    valueCell(item.reason),
    valueCell(item.refundEvidence),
    <StatusBadge value={item.source} />,
    item.operator,
    valueCell(item.lastModifiedBy),
    item.updatedAt,
    <StatusBadge value={item.status} />,
    specialActions(item, handlers),
  ];
}

export function FinanceTable(props: FinanceTableProps) {
  const { activeTab, rows, page, pageSize, onPageChange } = props;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  if (!rows.length)
    return (
      <section className="empty-state" role="status">
        <span>
          <FileSearch size={26} />
        </span>
        <h3>当前筛选条件下暂无数据</h3>
        <p>暂无数据的字段在页面及 Excel 中统一使用“/”占位。</p>
      </section>
    );
  return (
    <>
      <div className="table-scroll">
        <table className="finance-wide-table">
          <thead>
            <tr>
              {headers[activeTab].map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id}>
                {cellsFor(activeTab, row, props).map((cell, index) => (
                  <td key={`${row.id}-${headers[activeTab][index]}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="table-footer">
        <span>
          共 <strong>{rows.length}</strong> 条，第 {currentPage} / {totalPages}{" "}
          页
        </span>
        <div className="pagination">
          <button
            aria-label="上一页"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button className="page-current" aria-current="page">
            {currentPage}
          </button>
          {currentPage < totalPages && (
            <button onClick={() => onPageChange(currentPage + 1)}>
              {currentPage + 1}
            </button>
          )}
          <button
            aria-label="下一页"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </>
  );
}
