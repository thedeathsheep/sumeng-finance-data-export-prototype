import { ClipboardPlus, Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  AccountRecord,
  FinanceProfileRecord,
  ManualSpecialDraft,
} from "../types";

interface SpecialRecordDialogProps {
  open: boolean;
  profiles: FinanceProfileRecord[];
  accounts: AccountRecord[];
  initialDraft?: ManualSpecialDraft;
  onClose: () => void;
  onSave: (draft: ManualSpecialDraft) => void;
}

const defaults: ManualSpecialDraft = {
  financeProfileId: "",
  accountId: "",
  occurredAt: "2026-07-31T15:18",
  businessNature: "历史事项补录",
  manualAmount: "",
  pointsImpactNote: "",
  reason: "",
  evidence: "",
};

export function SpecialRecordDialog({
  open,
  profiles,
  accounts,
  initialDraft,
  onClose,
  onSave,
}: SpecialRecordDialogProps) {
  const [draft, setDraft] = useState<ManualSpecialDraft>(defaults);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(initialDraft ?? defaults);
    window.setTimeout(() => closeRef.current?.focus(), 0);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [initialDraft, onClose, open]);

  if (!open) return null;
  const update = <K extends keyof ManualSpecialDraft>(
    key: K,
    value: ManualSpecialDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  const amountValid =
    !draft.manualAmount || Number(draft.manualAmount) >= 0;
  const ready = Boolean(draft.occurredAt && draft.reason.trim() && amountValid);

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="operation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="special-record-dialog-title"
      >
        <header>
          <div>
            <span className="dialog-icon"><ClipboardPlus size={19} /></span>
            <div>
              <h2 id="special-record-dialog-title">
                {initialDraft ? "编辑特殊业务" : "新增特殊业务"}
              </h2>
              <p>补充无法从线上系统取得的线下或历史财务事实</p>
            </div>
          </div>
          <button
            ref={closeRef}
            className="icon-button"
            aria-label="关闭特殊业务弹窗"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="operation-body">
          <aside className="immutable-warning">
            <Info size={15} />
            <span>
              仅补充财务资料，不会修改积分余额、订单或退款状态；涉及积分的实际操作仍须在对应算力账户完成。
            </span>
          </aside>
          <section className="form-section">
            <div className="form-section-heading">
              <span>1</span>
              <div><h3>关联对象</h3><p>无法确认时可以不选，列表和导出统一显示“/”</p></div>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>财务档案</span>
                <select value={draft.financeProfileId} onChange={(event) => update("financeProfileId", event.target.value)}>
                  <option value="">/</option>
                  {profiles.filter((item) => item.recordStatus === "有效").map((item) => (
                    <option key={item.id} value={item.id}>{item.customerName} · {item.id}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>算力账户</span>
                <select value={draft.accountId} onChange={(event) => update("accountId", event.target.value)}>
                  <option value="">/</option>
                  {accounts.map((item) => (
                    <option key={item.id} value={item.id}>{item.accountName} · {item.accountType}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <section className="form-section">
            <div className="form-section-heading">
              <span>2</span>
              <div><h3>业务事实</h3><p>人民币金额和积分说明彼此独立，未知可留空</p></div>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>发生时间 *</span>
                <input type="datetime-local" value={draft.occurredAt} onChange={(event) => update("occurredAt", event.target.value)} />
              </label>
              <label className="field">
                <span>业务性质 *</span>
                <select value={draft.businessNature} onChange={(event) => update("businessNature", event.target.value as ManualSpecialDraft["businessNature"])}>
                  <option>历史事项补录</option>
                  <option>线下事项补录</option>
                  <option>其他事项补录</option>
                </select>
              </label>
              <label className="field">
                <span>人民币金额（元）</span>
                <input type="number" min="0" step="0.01" value={draft.manualAmount} onChange={(event) => update("manualAmount", event.target.value)} />
              </label>
              <label className="field">
                <span>凭证文件名</span>
                <input value={draft.evidence} placeholder="例如：线下审批单.pdf" onChange={(event) => update("evidence", event.target.value)} />
              </label>
              <label className="field field-span-2">
                <span>积分影响说明</span>
                <input value={draft.pointsImpactNote} placeholder="仅描述已发生事实，不在此调整余额" onChange={(event) => update("pointsImpactNote", event.target.value)} />
              </label>
              <label className="field field-span-2">
                <span>事项说明 *</span>
                <textarea rows={3} value={draft.reason} onChange={(event) => update("reason", event.target.value)} />
              </label>
            </div>
          </section>
        </div>
        <footer>
          <button className="secondary-button" onClick={onClose}>取消</button>
          <button className="primary-button" disabled={!ready} onClick={() => onSave(draft)}>保存特殊业务</button>
        </footer>
      </section>
    </div>
  );
}
