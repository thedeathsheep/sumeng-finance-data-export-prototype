import { FilePenLine, Link2, Paperclip, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AccountRecord, RechargeAdjustmentLedger, TabId } from "../types";

export interface ManualRecordDraft {
  customerType?: string;
  customerName?: string;
  unifiedCreditCode?: string;
  contactName?: string;
  contactPhone?: string;
  accountStatus?: string;
  contractNo?: string;
  serviceStart?: string;
  serviceEnd?: string;
  packageCycle?: string;
  contractPrepaidCap?: string;
  unitPriceStandard?: string;
  invoiceNeeded?: string;
  historicalInvoicedAmount?: string;
  uninvoicedPrepaidBalance?: string;
  linkedAccountIds?: string[];
  accountId?: string;
  occurredAt?: string;
  principalAmount?: string;
  giftAmount?: string;
  paymentMethod?: string;
  paymentReference?: string;
  discountType?: string;
  activityBatch?: string;
  receiptStatus?: string;
  pointsLedgerId?: string;
  specialType?: string;
  fundStatus?: string;
  relatedRecordId?: string;
  refundAt?: string;
  refundReference?: string;
  reason?: string;
  attachment?: string;
}

interface ManualRecordDialogProps {
  open: boolean;
  tab: TabId;
  accounts: AccountRecord[];
  ledgers: RechargeAdjustmentLedger[];
  unavailableAccountIds: string[];
  initialDraft?: ManualRecordDraft;
  onClose: () => void;
  onSave: (draft: ManualRecordDraft) => void;
}

const titleByTab: Partial<Record<TabId, string>> = {
  profiles: "新增财务档案",
  recharges: "录入线下充值",
  special: "补充退款资料",
};

export function ManualRecordDialog({ open, tab, accounts, ledgers, unavailableAccountIds, initialDraft, onClose, onSave }: ManualRecordDialogProps) {
  const [draft, setDraft] = useState<ManualRecordDraft>({});
  const closeRef = useRef<HTMLButtonElement>(null);
  const title = tab === "special" ? "补充线下退款资料" : initialDraft ? `编辑${titleByTab[tab]?.replace("新增", "").replace("录入", "") ?? "人工记录"}` : titleByTab[tab] ?? "人工录入";
  const selectable = useMemo(() => accounts.filter((item) => item.status !== "到期停用"), [accounts]);

  useEffect(() => {
    if (!open) return;
    const defaults = tab === "profiles"
      ? { customerType: "企业", packageCycle: "年", invoiceNeeded: "是", accountStatus: "正常使用", linkedAccountIds: [] }
      : tab === "recharges"
        ? { paymentMethod: "对公转账", discountType: "普通充值", receiptStatus: "已收款", occurredAt: "2026-07-31T15:00" }
        : { specialType: "后台手动扣减", fundStatus: "无需资金处理", occurredAt: "2026-07-31T15:00" };
    setDraft({ ...defaults, ...initialDraft });
    window.setTimeout(() => closeRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [initialDraft, open, onClose, tab]);

  if (!open) return null;
  const update = (key: keyof ManualRecordDraft, value: string | string[]) => setDraft((current) => ({ ...current, [key]: value }));
  const toggleAccount = (id: string) => {
    const current = draft.linkedAccountIds ?? [];
    update("linkedAccountIds", current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const isRefund = tab === "special" && draft.specialType === "退款业务";
  const requiredReady = tab === "profiles"
    ? Boolean(draft.customerName && draft.linkedAccountIds?.length)
    : tab === "special"
      ? Boolean(isRefund && draft.accountId && draft.occurredAt && draft.pointsLedgerId && draft.refundAt && draft.principalAmount && draft.refundReference)
      : Boolean(draft.accountId && draft.occurredAt);
  const availableLedgers = ledgers.filter((ledger) => ledger.accountId === draft.accountId && (tab !== "recharges" || ledger.delta > 0));

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section className="operation-dialog manual-dialog" role="dialog" aria-modal="true" aria-labelledby="manual-dialog-title">
        <header>
          <div><span className="dialog-icon"><FilePenLine size={19} /></span><div><h2 id="manual-dialog-title">{title}</h2><p>人工数据将标记来源，并自动保留操作人与更新时间</p></div></div>
          <button ref={closeRef} className="icon-button" aria-label="关闭" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="operation-body">
          {tab === "profiles" && <>
            <section className="form-section">
              <div className="form-section-heading"><span>1</span><div><h3>财务主体资料</h3><p>这是财务管理身份，不会创建企业用户</p></div></div>
              <div className="form-grid">
                <label className="field"><span>客户类型</span><select value={draft.customerType ?? "企业"} onChange={(event) => update("customerType", event.target.value)}><option>个人</option><option>企业</option></select></label>
                <label className="field"><span>企业 / 个人账户全称 *</span><input value={draft.customerName ?? ""} onChange={(event) => update("customerName", event.target.value)} /></label>
                <label className="field"><span>统一社会信用代码</span><input value={draft.unifiedCreditCode ?? ""} placeholder="个人可不填" onChange={(event) => update("unifiedCreditCode", event.target.value)} /></label>
                <label className="field"><span>联系人</span><input value={draft.contactName ?? ""} onChange={(event) => update("contactName", event.target.value)} /></label>
                <label className="field"><span>联系方式</span><input value={draft.contactPhone ?? ""} onChange={(event) => update("contactPhone", event.target.value)} /></label>
                <label className="field"><span>账户状态</span><select value={draft.accountStatus ?? "正常使用"} onChange={(event) => update("accountStatus", event.target.value)}><option>正常使用</option><option>冻结</option><option>注销</option><option>到期停用</option></select></label>
              </div>
            </section>
            <section className="form-section">
              <div className="form-section-heading"><span>2</span><div><h3>合同与开票资料</h3><p>套餐周期仅支持月、年两个标准选项</p></div></div>
              <div className="form-grid">
                <label className="field"><span>合同编号</span><input value={draft.contractNo ?? ""} onChange={(event) => update("contractNo", event.target.value)} /></label>
                <label className="field"><span>套餐周期</span><select value={draft.packageCycle ?? "年"} onChange={(event) => update("packageCycle", event.target.value)}><option>月</option><option>年</option></select></label>
                <label className="field"><span>服务开始日期</span><input type="date" value={draft.serviceStart ?? ""} onChange={(event) => update("serviceStart", event.target.value)} /></label>
                <label className="field"><span>服务结束日期</span><input type="date" value={draft.serviceEnd ?? ""} onChange={(event) => update("serviceEnd", event.target.value)} /></label>
                <label className="field"><span>合同总预存上限</span><input type="number" min="0" value={draft.contractPrepaidCap ?? ""} onChange={(event) => update("contractPrepaidCap", event.target.value)} /></label>
                <label className="field"><span>收费单价标准</span><input value={draft.unitPriceStandard ?? ""} onChange={(event) => update("unitPriceStandard", event.target.value)} /></label>
                <label className="field"><span>是否需要发票</span><select value={draft.invoiceNeeded ?? "是"} onChange={(event) => update("invoiceNeeded", event.target.value)}><option>是</option><option>否</option></select></label>
                <label className="field"><span>历史已开票金额</span><input type="number" min="0" value={draft.historicalInvoicedAmount ?? ""} onChange={(event) => update("historicalInvoicedAmount", event.target.value)} /></label>
                <label className="field"><span>未开票预收余额</span><input type="number" min="0" value={draft.uninvoicedPrepaidBalance ?? ""} onChange={(event) => update("uninvoicedPrepaidBalance", event.target.value)} /></label>
              </div>
            </section>
            <section className="form-section">
              <div className="form-section-heading"><span>3</span><div><h3>关联线上对象 *</h3><p>一份财务档案可关联多个用户、团队或算力账户</p></div></div>
              <div className="account-check-grid">
                {selectable.map((account) => {
                  const selected = (draft.linkedAccountIds ?? []).includes(account.id);
                  const unavailable = unavailableAccountIds.includes(account.id) && !selected;
                  return <label key={account.id} className={`${selected ? "account-check selected" : "account-check"}${unavailable ? " unavailable" : ""}`}><input type="checkbox" disabled={unavailable} checked={selected} onChange={() => toggleAccount(account.id)} /><span><strong>{account.accountName}</strong><small>{unavailable ? "已关联其他有效财务档案" : `${account.accountType} · ${account.id}`}</small></span></label>;
                })}
              </div>
            </section>
          </>}

          {tab === "recharges" && <>
            <section className="form-section">
              <div className="form-section-heading"><span>1</span><div><h3>归属与收款</h3><p>记录线下款项最终进入的线上算力账户</p></div></div>
              <div className="form-grid">
                <label className="field"><span>关联账户 *</span><select value={draft.accountId ?? ""} onChange={(event) => update("accountId", event.target.value)}><option value="">请选择</option>{selectable.map((item) => <option key={item.id} value={item.id}>{item.accountName} · {item.id}</option>)}</select></label>
                <label className="field"><span>充值发生时间 *</span><input type="datetime-local" value={draft.occurredAt ?? ""} onChange={(event) => update("occurredAt", event.target.value)} /></label>
                <label className="field"><span>充值本金金额</span><input type="number" min="0" value={draft.principalAmount ?? ""} onChange={(event) => update("principalAmount", event.target.value)} /></label>
                <label className="field"><span>赠送金额（人民币）</span><input type="number" min="0" value={draft.giftAmount ?? ""} placeholder="没有财务金额口径可不填" onChange={(event) => update("giftAmount", event.target.value)} /></label>
                <label className="field"><span>支付渠道</span><select value={draft.paymentMethod ?? "对公转账"} onChange={(event) => update("paymentMethod", event.target.value)}><option>微信</option><option>支付宝</option><option>对公转账</option><option>线下刷卡</option><option>其他</option></select></label>
                <label className="field"><span>支付交易单号</span><input value={draft.paymentReference ?? ""} onChange={(event) => update("paymentReference", event.target.value)} /></label>
              </div>
            </section>
            <section className="form-section">
              <div className="form-section-heading"><span>2</span><div><h3>业务补充信息</h3><p>表格要求但线上订单未必具备的财务字段</p></div></div>
              <div className="form-grid">
                <label className="field"><span>充值优惠类型</span><select value={draft.discountType ?? "普通充值"} onChange={(event) => update("discountType", event.target.value)}><option>普通充值</option><option>活动赠额</option><option>代金券抵扣充值</option></select></label>
                <label className="field"><span>活动批次</span><input value={draft.activityBatch ?? ""} onChange={(event) => update("activityBatch", event.target.value)} /></label>
                <label className="field"><span>收款状态</span><select value={draft.receiptStatus ?? "已收款"} onChange={(event) => update("receiptStatus", event.target.value)}><option>已收款</option><option>待收款</option></select></label>
                <label className="field"><span>合同编号</span><input value={draft.contractNo ?? ""} onChange={(event) => update("contractNo", event.target.value)} /></label>
              </div>
            </section>
            <section className="form-section">
              <div className="form-section-heading"><span>3</span><div><h3>关联积分发放流水</h3><p>财务记录不直接修改积分；请先在算力账户完成调整，再关联真实流水</p></div></div>
              <div className="form-grid">
                <label className="field field-span-2"><span>积分调整流水</span><select value={draft.pointsLedgerId ?? ""} onChange={(event) => update("pointsLedgerId", event.target.value)}><option value="">暂未发放 / 稍后关联</option>{availableLedgers.map((ledger) => <option key={ledger.id} value={ledger.id}>{ledger.id} · {ledger.direction} {Math.abs(ledger.delta).toLocaleString("zh-CN")} 点 · {ledger.occurredAt}</option>)}</select></label>
              </div>
              {draft.receiptStatus === "已收款" && !draft.pointsLedgerId && <p className="workflow-hint">保存后状态为“已收款待发放”；关联积分流水后自动变为“已完成”。</p>}
            </section>
          </>}

          {tab === "special" && <section className="form-section">
            <div className="form-section-heading"><span>1</span><div><h3>后台手动扣减记录</h3><p>账户、扣减时间、积分流水和三类积分扣减值来自系统，不允许在财务看板修改</p></div></div>
            <div className="form-grid">
              <label className="field"><span>业务分类</span><select value={draft.specialType ?? "后台手动扣减"} onChange={(event) => update("specialType", event.target.value)}><option>后台手动扣减</option><option>退款业务</option></select></label>
              <label className="field"><span>积分扣减时间</span><input type="datetime-local" value={draft.occurredAt ?? ""} disabled /></label>
              <label className="field"><span>关联账户</span><input value={accounts.find((item) => item.id === draft.accountId)?.accountName ?? draft.accountId ?? "/"} disabled /></label>
              <label className="field"><span>积分扣减流水</span><input value={draft.pointsLedgerId ?? "/"} disabled /></label>
              <div className="fee-scope-note field-span-2"><strong>数据边界</strong><span>修改业务分类只补充财务资料，不会修改、重做或冲销原积分流水。</span></div>
            </div>
            {isRefund ? <>
              <div className="form-section-heading section-divider"><span>2</span><div><h3>线下退款资料</h3><p>所有退款均通过线下对公转账完成</p></div></div>
              <div className="form-grid">
                <label className="field"><span>退款日期 *</span><input type="date" value={draft.refundAt ?? ""} onChange={(event) => update("refundAt", event.target.value)} /></label>
                <label className="field"><span>退款金额 *</span><input type="number" min="0" value={draft.principalAmount ?? ""} onChange={(event) => update("principalAmount", event.target.value)} /></label>
                <label className="field"><span>对公转账流水号 *</span><input value={draft.refundReference ?? ""} onChange={(event) => update("refundReference", event.target.value)} /></label>
                <label className="field"><span>资金状态</span><input value="已退款" disabled /></label>
                <label className="field field-span-2"><span>退款原因</span><textarea rows={3} value={draft.reason ?? ""} onChange={(event) => update("reason", event.target.value)} /></label>
                <div className="field field-span-2"><span>退款凭证（可选）</span><label className="evidence-upload"><input type="file" onChange={(event) => { update("attachment", event.target.files?.[0]?.name ?? ""); event.currentTarget.value = ""; }} /><Upload size={16} /><span>{draft.attachment ? "重新选择文件" : "选择文件"}</span></label>{draft.attachment && <div className="selected-evidence"><Paperclip size={14} /><span>{draft.attachment}</span><button type="button" aria-label="移除已选凭证" onClick={() => update("attachment", "")}><Trash2 size={14} /></button></div>}</div>
              </div>
            </> : <p className="workflow-hint">请选择“退款业务”后补充线下退款资料。普通后台手动扣减无需财务重复录入。</p>}
          </section>}

          <aside className="audit-promise"><ShieldCheck size={16} /><span>{tab === "special" ? "保存后标记为“系统同步·人工补充”，并保留修改人、修改时间和原积分流水。" : "保存后记录“人工录入”、操作人和更新时间；后续修改形成变更记录，作废后原数据仍可查询。"}</span></aside>
        </div>
        <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" disabled={!requiredReady} onClick={() => onSave(draft)}><Link2 size={15} />{tab === "special" ? "保存退款资料" : initialDraft ? "保存修改" : "保存记录"}</button></footer>
      </section>
    </div>
  );
}
