export type PageId = "credits" | "finance";
export type TabId = "profiles" | "recharges" | "consumptions" | "monthly" | "special";
export type AccountType = "用户" | "团队";
export type CustomerType = "个人" | "企业";
export type DataStatus = "系统同步" | "人工录入" | "暂无数据" | "已生效" | "已作废" | "待收款" | "已收款";
export type RecordSource = "系统同步" | "人工录入" | "系统同步·人工补充";

export interface AccountRecord {
  id: string;
  accountType: AccountType;
  accountName: string;
  contact: string;
  status: "正常" | "冻结" | "到期停用";
  ownerName: string;
  planName: string;
  planPointsBalance: number;
  rechargePointsBalance: number;
  giftPointsBalance: number;
  invoiceTitle: string;
  taxNumber: string;
  dataSource: RecordSource;
  activeMonths: string[];
}

export interface FinanceProfileRecord {
  id: string;
  customerType: CustomerType;
  customerName: string;
  unifiedCreditCode: string;
  contactName: string;
  contactPhone: string;
  accountStatus: string;
  contractNo: string;
  serviceStart: string;
  serviceEnd: string;
  packageCycle: string;
  contractPrepaidCap: number | string;
  unitPriceStandard: string;
  invoiceNeeded: string;
  historicalInvoicedAmount: number | string;
  uninvoicedPrepaidBalance: number | string;
  linkedAccountIds: string[];
  linkedAccountNames: string[];
  source: RecordSource;
  operator: string;
  updatedAt: string;
  recordStatus: "已生效" | "已作废";
}

export interface CreditEntryRecord {
  id: string;
  recordSource: "充值订单" | "积分调整流水" | "套餐变更记录" | "赠送积分流水" | "历史积分流水" | "人工充值记录";
  accountId: string;
  accountName: string;
  accountType: AccountType;
  financeProfileId: string;
  financeProfileName: string;
  customerType?: CustomerType | "/";
  month: string;
  businessType: string;
  actualAmount: number | string;
  giftAmount: number | string;
  paymentMethod: string;
  paymentReference: string;
  discountType: string;
  activityBatch: string;
  receiptStatus: "待收款" | "已收款" | string;
  contractNo: string;
  planName: string;
  planPoints: number;
  rechargePoints: number;
  giftPoints: number;
  pointsLedgerId: string;
  pointsDeliveryStatus: "待发放" | "已发放";
  occurredAt: string;
  operator: string;
  status: "待收款" | "已收款待发放" | "已完成" | "已冲正" | "历史类型未区分" | "已作废";
  reason: string;
  source: RecordSource;
  updatedAt: string;
}

export interface ConsumptionRecord {
  id: string;
  accountId: string;
  accountName: string;
  accountType: AccountType;
  financeProfileId: string;
  financeProfileName: string;
  customerType?: CustomerType | "/";
  month: string;
  occurredAt: string;
  scene: string;
  service: string;
  planPoints: number;
  rechargePoints: number;
  giftPoints: number;
  principalDeductionAmount: number | string;
  giftDeductionAmount: number | string;
  billingUnitPrice: string;
  measurementBasis: string;
  contractNo: string;
  relatedType: string;
  relatedId: string;
  status: "消耗成功" | "已冲正";
}

export interface MonthlySummaryRecord {
  id: string;
  month: string;
  newRechargePrincipal: number;
  giftAmount: number | string;
  uncollectedRechargeAmount: number;
  principalConsumptionAmount: number | string;
  giftConsumptionAmount: number | string;
  note: string;
}

export interface SpecialRecord {
  id: string;
  accountId: string;
  accountName: string;
  accountType: AccountType | "/";
  financeProfileId: string;
  financeProfileName: string;
  customerType?: CustomerType | "/";
  month: string;
  type: "后台手动扣减" | "退款业务" | "过期清零" | "调账 / 冲红" | "作废 / 取消订单";
  occurredAt: string;
  planPoints: number;
  rechargePoints: number;
  giftPoints: number;
  principalAmount: number | string;
  giftAmount: number | string;
  relatedRecordType: string;
  relatedRecordId: string;
  pointsLedgerId: string;
  refundAt?: string;
  refundReference?: string;
  fundStatus: "待处理" | "已退款" | "无需资金处理";
  reason: string;
  attachment: string;
  operator: string;
  source: RecordSource;
  updatedAt: string;
  status: "待处理" | "资金已处理待积分" | "已完成" | "已作废";
}

export interface AuditLogRecord {
  id: string;
  recordId: string;
  action: "创建" | "修改" | "关联积分流水" | "作废";
  operator: string;
  occurredAt: string;
  detail: string;
}

export type RechargeDirection = "增加" | "扣减";

export interface RechargeAdjustmentDraft {
  direction: RechargeDirection;
  amount: number;
  reason: string;
}

export interface RechargeAdjustmentLedger {
  id: string;
  accountId: string;
  accountName: string;
  accountType: AccountType;
  direction: RechargeDirection;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  source: "后台手动调整";
  reason: string;
  operator: string;
  occurredAt: string;
}

export type FinanceRow = FinanceProfileRecord | CreditEntryRecord | ConsumptionRecord | MonthlySummaryRecord | SpecialRecord;
