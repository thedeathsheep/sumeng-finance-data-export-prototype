import { Banknote, LockKeyhole, Paperclip, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RefundReason, RefundSupplementDraft, SpecialRecord } from "../types";

interface RefundSupplementDialogProps {
  record: SpecialRecord | null;
  onClose: () => void;
  onSave: (recordId: string, draft: RefundSupplementDraft) => void;
  onCancelRefund: (recordId: string) => void;
}

const refundReasons: RefundReason[] = ["客户注销", "服务终止", "多扣费返还", "其他"];

const initialDraft = (record: SpecialRecord): RefundSupplementDraft => ({
  refundAmount: typeof record.refundAmount === "number" ? String(record.refundAmount) : "",
  refundDate: record.refundDate === "/" ? "" : record.refundDate,
  transferReference: record.transferReference === "/" ? "" : record.transferReference,
  refundReason: record.refundReason === "/" ? "" : record.refundReason,
  refundReasonNote: record.refundReasonNote === "/" ? "" : record.refundReasonNote,
  refundEvidence: record.refundEvidence === "/" ? "" : record.refundEvidence,
});

export function RefundSupplementDialog({ record, onClose, onSave, onCancelRefund }: RefundSupplementDialogProps) {
  const [draft, setDraft] = useState<RefundSupplementDraft | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!record) return;
    setDraft(initialDraft(record));
    window.setTimeout(() => closeRef.current?.focus(), 0);
    const handleKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, record]);

  if (!record || !draft) return null;
  const update = (key: keyof RefundSupplementDraft, value: string) => setDraft((current) => current ? { ...current, [key]: value } : current);
  const complete = Number(draft.refundAmount) > 0
    && Boolean(draft.refundDate)
    && Boolean(draft.transferReference.trim())
    && Boolean(draft.refundReason)
    && (draft.refundReason !== "其他" || Boolean(draft.refundReasonNote.trim()));

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <section className="operation-dialog refund-dialog" role="dialog" aria-modal="true" aria-labelledby="refund-dialog-title">
      <header>
        <div><span className="dialog-icon"><Banknote size={19} /></span><div><h2 id="refund-dialog-title">补充退款资料</h2><p>仅登记已经通过线下对公转账处理的退款事实</p></div></div>
        <button ref={closeRef} className="icon-button" aria-label="关闭退款资料弹窗" onClick={onClose}><X size={18} /></button>
      </header>
      <div className="operation-body">
        <aside className="immutable-warning"><LockKeyhole size={15} /><span><strong>原积分事实不可修改：</strong>账户、扣减时间、积分流水和充值积分变动均来自系统。</span></aside>
        <dl className="immutable-facts">
          <div><dt>关联账户</dt><dd>{record.accountName}（{record.accountId}）</dd></div>
          <div><dt>扣减时间</dt><dd>{record.occurredAt}</dd></div>
          <div><dt>积分流水号</dt><dd>{record.pointsLedgerId}</dd></div>
          <div><dt>充值积分变动</dt><dd>{record.rechargePoints} 点</dd></div>
        </dl>
        <section className="form-section">
          <div className="form-section-heading"><span>1</span><div><h3>线下退款事实</h3><p>四项必填资料完整后，记录才会变为“已退款”</p></div></div>
          <div className="form-grid">
            <label className="field"><span>退款金额 *</span><input type="number" min="0.01" step="0.01" value={draft.refundAmount} onChange={(event) => update("refundAmount", event.target.value)} /></label>
            <label className="field"><span>退款日期 *</span><input type="date" value={draft.refundDate} onChange={(event) => update("refundDate", event.target.value)} /></label>
            <label className="field field-span-2"><span>对公转账流水号 *</span><input value={draft.transferReference} maxLength={100} onChange={(event) => update("transferReference", event.target.value)} /></label>
            <label className="field"><span>退款原因 *</span><select value={draft.refundReason} onChange={(event) => update("refundReason", event.target.value)}><option value="">请选择</option>{refundReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label>
            {draft.refundReason === "其他" && <label className="field"><span>退款原因说明 *</span><input value={draft.refundReasonNote} maxLength={200} onChange={(event) => update("refundReasonNote", event.target.value)} /></label>}
            <div className="field field-span-2"><span>退款凭证（选填）</span><label className="evidence-upload"><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => { update("refundEvidence", event.target.files?.[0]?.name ?? ""); event.currentTarget.value = ""; }} /><Upload size={16} /><span>{draft.refundEvidence || "选择 PDF、JPG 或 PNG"}</span></label>{draft.refundEvidence && <small className="selected-evidence"><Paperclip size={13} />{draft.refundEvidence}</small>}</div>
          </div>
        </section>
      </div>
      <footer>
        <button className="text-button" onClick={() => onCancelRefund(record.id)}>取消退款标记</button>
        <div><button className="secondary-button" onClick={onClose}>关闭</button><button className="primary-button" disabled={!complete} onClick={() => onSave(record.id, draft)}>确认退款完成</button></div>
      </footer>
    </section>
  </div>;
}
