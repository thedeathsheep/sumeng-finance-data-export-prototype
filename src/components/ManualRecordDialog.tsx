import { FilePenLine, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AccountRecord, CustomerType } from "../types";

export interface FinanceProfileDraft {
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
  contractPrepaidCap: string;
  unitPriceStandard: string;
  invoiceNeeded: "是" | "否";
  historicalInvoicedAmount: string;
  uninvoicedPrepaidBalance: string;
  linkedAccountIds: string[];
}

interface ManualRecordDialogProps {
  open: boolean;
  accounts: AccountRecord[];
  unavailableAccountIds: string[];
  initialDraft?: FinanceProfileDraft;
  onClose: () => void;
  onSave: (draft: FinanceProfileDraft) => void;
}

const defaults: FinanceProfileDraft = {
  customerType: "企业", customerName: "", unifiedCreditCode: "", contactName: "", contactPhone: "", accountStatus: "正常",
  contractNo: "", serviceStart: "", serviceEnd: "", packageCycle: "年", contractPrepaidCap: "", unitPriceStandard: "",
  invoiceNeeded: "是", historicalInvoicedAmount: "", uninvoicedPrepaidBalance: "", linkedAccountIds: [],
};

export function ManualRecordDialog({ open, accounts, unavailableAccountIds, initialDraft, onClose, onSave }: ManualRecordDialogProps) {
  const [draft, setDraft] = useState<FinanceProfileDraft>(defaults);
  const closeRef = useRef<HTMLButtonElement>(null);
  const selectable = useMemo(() => accounts.filter((item) => item.status !== "到期停用"), [accounts]);

  useEffect(() => {
    if (!open) return;
    setDraft(initialDraft ?? defaults);
    window.setTimeout(() => closeRef.current?.focus(), 0);
    const handleKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [initialDraft, onClose, open]);

  if (!open) return null;
  const update = <K extends keyof FinanceProfileDraft>(key: K, value: FinanceProfileDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const toggleAccount = (id: string) => update("linkedAccountIds", draft.linkedAccountIds.includes(id) ? draft.linkedAccountIds.filter((item) => item !== id) : [...draft.linkedAccountIds, id]);
  const invalidServicePeriod = Boolean(draft.serviceStart && draft.serviceEnd && draft.serviceEnd < draft.serviceStart);
  const ready = Boolean(draft.customerName.trim() && draft.linkedAccountIds.length && !invalidServicePeriod);

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <section className="operation-dialog manual-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title">
      <header><div><span className="dialog-icon"><FilePenLine size={19} /></span><div><h2 id="profile-dialog-title">{initialDraft ? "编辑财务档案" : "新增财务档案"}</h2><p>财务身份不改变线上用户、团队或算力账户类型</p></div></div><button ref={closeRef} className="icon-button" aria-label="关闭财务档案弹窗" onClick={onClose}><X size={18} /></button></header>
      <div className="operation-body">
        <section className="form-section">
          <div className="form-section-heading"><span>1</span><div><h3>主体资料</h3><p>客户类型固定为个人或企业</p></div></div>
          <div className="form-grid">
            <label className="field"><span>客户类型 *</span><select value={draft.customerType} onChange={(event) => update("customerType", event.target.value as CustomerType)}><option>个人</option><option>企业</option></select></label>
            <label className="field"><span>企业 / 个人账户全称 *</span><input value={draft.customerName} maxLength={100} onChange={(event) => update("customerName", event.target.value)} /></label>
            <label className="field"><span>统一社会信用代码</span><input value={draft.unifiedCreditCode} maxLength={18} placeholder="个人或未知可不填" onChange={(event) => update("unifiedCreditCode", event.target.value)} /></label>
            <label className="field"><span>联系人</span><input value={draft.contactName} maxLength={50} onChange={(event) => update("contactName", event.target.value)} /></label>
            <label className="field"><span>联系方式</span><input value={draft.contactPhone} maxLength={100} onChange={(event) => update("contactPhone", event.target.value)} /></label>
            <label className="field"><span>账户状态 *</span><select value={draft.accountStatus} onChange={(event) => update("accountStatus", event.target.value as FinanceProfileDraft["accountStatus"])}><option>正常</option><option>冻结</option><option>注销</option><option>到期停用</option></select></label>
          </div>
        </section>
        <section className="form-section">
          <div className="form-section-heading"><span>2</span><div><h3>合同与开票</h3><p>套餐周期使用月 / 年标准选项，服务期限使用日期控件</p></div></div>
          <div className="form-grid">
            <label className="field"><span>合同编号</span><input value={draft.contractNo} onChange={(event) => update("contractNo", event.target.value)} /></label>
            <label className="field"><span>套餐周期</span><select value={draft.packageCycle} onChange={(event) => update("packageCycle", event.target.value as "月" | "年")}><option>月</option><option>年</option></select></label>
            <label className="field"><span>服务起始日期</span><input type="date" value={draft.serviceStart} onChange={(event) => update("serviceStart", event.target.value)} /></label>
            <label className="field"><span>服务终止日期</span><input type="date" min={draft.serviceStart || undefined} value={draft.serviceEnd} onChange={(event) => update("serviceEnd", event.target.value)} />{invalidServicePeriod && <small className="field-error">终止日期不得早于起始日期</small>}</label>
            <label className="field"><span>合同总预存上限</span><input type="number" min="0" step="0.01" value={draft.contractPrepaidCap} onChange={(event) => update("contractPrepaidCap", event.target.value)} /></label>
            <label className="field"><span>收费单价标准</span><input value={draft.unitPriceStandard} placeholder="例如：10 元 / 调用" onChange={(event) => update("unitPriceStandard", event.target.value)} /></label>
            <label className="field"><span>是否需要发票</span><select value={draft.invoiceNeeded} onChange={(event) => update("invoiceNeeded", event.target.value as "是" | "否")}><option>是</option><option>否</option></select></label>
            <label className="field"><span>历史已开票金额</span><input type="number" min="0" step="0.01" value={draft.historicalInvoicedAmount} onChange={(event) => update("historicalInvoicedAmount", event.target.value)} /></label>
            <label className="field"><span>未开票预收余额</span><input type="number" min="0" step="0.01" value={draft.uninvoicedPrepaidBalance} onChange={(event) => update("uninvoicedPrepaidBalance", event.target.value)} /></label>
          </div>
        </section>
        <section className="form-section">
          <div className="form-section-heading"><span>3</span><div><h3>关联线上对象 *</h3><p>同一线上对象同一时间只能关联一份有效财务档案</p></div></div>
          <div className="account-check-grid">{selectable.map((account) => { const selected = draft.linkedAccountIds.includes(account.id); const unavailable = unavailableAccountIds.includes(account.id) && !selected; return <label key={account.id} className={`${selected ? "account-check selected" : "account-check"}${unavailable ? " unavailable" : ""}`}><input type="checkbox" disabled={unavailable} checked={selected} onChange={() => toggleAccount(account.id)} /><span><strong>{account.accountName}</strong><small>{unavailable ? "已关联其他有效档案" : `${account.accountType} · ${account.id}`}</small></span></label>; })}</div>
        </section>
        <aside className="audit-promise"><ShieldCheck size={16} /><span>保存后记录创建人、修改人和变更前后值；档案只能作废，不能物理删除。</span></aside>
      </div>
      <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" disabled={!ready} onClick={() => onSave(draft)}>{initialDraft ? "保存修改" : "创建档案"}</button></footer>
    </section>
  </div>;
}
