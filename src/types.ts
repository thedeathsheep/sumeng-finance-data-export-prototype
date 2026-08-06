export type PageId = "credits" | "finance";
export type TabId =
  | "profiles"
  | "recharges"
  | "consumptions"
  | "monthly"
  | "special";
export type AccountType = "用户" | "团队";
export type CustomerType = "个人" | "企业";
export type RecordSource = "系统同步" | "人工维护";
export type RecordStatus = "有效" | "已作废";

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
  dataSource: "系统同步";
  activeMonths: string[];
}

export interface FinanceProfileRecord {
  id: string;
  customerType: CustomerType;
  customerName: string;
  unifiedCreditCode: string;
  contactName: string;
  contactPhone: string;
  accountStatus: "正常" | "冻结" | "注销" | "到期停用";
  contractNo: string;
  serviceStart: string;
  serviceEnd: string;
  packageCycle: "月" | "年";
  contractPrepaidCap: number | string;
  unitPriceStandard: string;
  invoiceNeeded: "是" | "否" | "/";
  historicalInvoicedAmount: number | string;
  uninvoicedPrepaidBalance: number | string;
  linkedAccountIds: string[];
  linkedAccountNames: string[];
  source: RecordSource;
  operator: string;
  lastModifiedBy: string;
  updatedAt: string;
  recordStatus: RecordStatus;
}

export type RechargeBusinessNature =
  | "线上购买"
  | "线下购买"
  | "套餐开通"
  | "免费升级"
  | "客户补偿"
  | "纠错增加"
  | "其他";

export interface CreditEntryRecord {
  id: string;
  recordSource: "线上充值订单" | "后台套餐变更" | "后台充值积分调整";
  accountId: string;
  accountName: string;
  accountType: AccountType;
  financeProfileId: string;
  financeProfileName: string;
  customerType: CustomerType | "/";
  month: string;
  businessNature: RechargeBusinessNature;
  actualAmount: number | string;
  giftAmount: number | string;
  paymentMethod: string;
  paymentReference: string;
  discountType: string;
  activityBatch: string;
  receiptStatus: "已收款" | "待收款" | "/";
  contractNo: string;
  planName: string;
  planPoints: number | string;
  rechargePoints: number | string;
  giftPoints: number | string;
  pointsLedgerId: string;
  pointsDeliveryStatus: "已发放" | "部分发放" | "发放失败" | "不涉及积分" | "/";
  occurredAt: string;
  operator: string;
  status: RecordStatus;
  reason: string;
  source: "系统同步";
  lastModifiedBy: string;
  updatedAt: string;
}

export interface ConsumptionRecord {
  id: string;
  accountId: string;
  accountName: string;
  accountType: AccountType;
  financeProfileId: string;
  financeProfileName: string;
  customerType: CustomerType | "/";
  month: string;
  occurredAt: string;
  scene: string;
  service: string;
  planPoints: number | string;
  rechargePoints: number | string;
  giftPoints: number | string;
  principalDeductionAmount: number | string;
  giftDeductionAmount: number | string;
  billingUnitPrice: string;
  measurementBasis: string;
  contractNo: string;
  relatedType: "任务" | "订单" | "作业" | "其他" | "/";
  relatedId: string;
  status: "消耗成功" | "已冲正";
  source: "系统同步";
  operator: string;
  lastModifiedBy: string;
  updatedAt: string;
  recordStatus: RecordStatus;
}

export interface MonthlySummaryRecord {
  id: string;
  month: string;
  newRechargePrincipal: number | string;
  giftAmount: number | string;
  uncollectedRechargeAmount: number | string;
  principalConsumptionAmount: number | string;
  giftConsumptionAmount: number | string;
  note: string;
}

export type DeductionBusinessNature = "退款扣回" | "纠错扣减" | "其他";
export type SpecialBusinessNature =
  | DeductionBusinessNature
  | "自动过期清零"
  | "系统调账或冲红"
  | "未支付取消";
export type RefundReason = "客户注销" | "服务终止" | "多扣费返还" | "其他";

export interface SpecialRecord {
  id: string;
  accountId: string;
  accountName: string;
  accountType: AccountType | "/";
  financeProfileId: string;
  financeProfileName: string;
  customerType: CustomerType | "/";
  month: string;
  type:
    | "后台手动扣减"
    | "退款业务"
    | "过期清零"
    | "调账 / 冲红"
    | "作废 / 取消未生效充值订单";
  businessNature: SpecialBusinessNature;
  occurredAt: string;
  planPoints: number | string;
  rechargePoints: number | string;
  giftPoints: number | string;
  relatedRecordType: string;
  relatedRecordId: string;
  pointsLedgerId: string;
  handlingStatus: "无需处理" | "退款待补充" | "退款已完成";
  fundStatus: "不涉及资金" | "待退款确认" | "已退款";
  refundAmount: number | string;
  refundDate: string;
  transferReference: string;
  refundReason: RefundReason | "/";
  refundReasonNote: string;
  refundEvidence: string;
  reason: string;
  operator: string;
  source: "系统同步";
  lastModifiedBy: string;
  updatedAt: string;
  status: RecordStatus;
}

export interface AuditLogRecord {
  id: string;
  recordId: string;
  action: "创建" | "修改" | "取消退款标记" | "作废";
  operator: string;
  occurredAt: string;
  detail: string;
}

export type RechargeDirection = "增加" | "扣减";
export type AdjustmentBusinessNature =
  | Exclude<RechargeBusinessNature, "线上购买" | "套餐开通">
  | DeductionBusinessNature;

export interface RechargeAdjustmentDraft {
  direction: RechargeDirection;
  amount: number;
  businessNature: AdjustmentBusinessNature;
  reason: string;
}

export interface RechargeAdjustmentLedger {
  id: string;
  accountId: string;
  accountName: string;
  accountType: AccountType;
  direction: RechargeDirection;
  businessNature: AdjustmentBusinessNature;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  source: "后台手动调整";
  reason: string;
  operator: string;
  occurredAt: string;
}

export interface RefundSupplementDraft {
  refundAmount: string;
  refundDate: string;
  transferReference: string;
  refundReason: RefundReason | "";
  refundReasonNote: string;
  refundEvidence: string;
}

export interface BusinessNatureChangeDraft {
  businessNature: DeductionBusinessNature;
  changeReason: string;
}

export type FinanceRow =
  | FinanceProfileRecord
  | CreditEntryRecord
  | ConsumptionRecord
  | MonthlySummaryRecord
  | SpecialRecord;
