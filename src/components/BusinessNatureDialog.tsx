import { LockKeyhole, Tags, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  BusinessNatureChangeDraft,
  DeductionBusinessNature,
  SpecialRecord,
} from "../types";

interface BusinessNatureDialogProps {
  record: SpecialRecord | null;
  onClose: () => void;
  onSave: (recordId: string, draft: BusinessNatureChangeDraft) => void;
}

const natureOptions: DeductionBusinessNature[] = ["退款扣回", "纠错扣减", "其他"];

export function BusinessNatureDialog({ record, onClose, onSave }: BusinessNatureDialogProps) {
  const [businessNature, setBusinessNature] = useState<DeductionBusinessNature>("纠错扣减");
  const [changeReason, setChangeReason] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!record) return;
    setBusinessNature(record.businessNature as DeductionBusinessNature);
    setChangeReason("");
    window.setTimeout(() => closeRef.current?.focus(), 0);
  }, [record?.id]);

  useEffect(() => {
    if (!record) return;
    const handleKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, record]);

  if (!record) return null;
  const changed = businessNature !== record.businessNature;
  const complete = changed && (businessNature !== "其他" || Boolean(changeReason.trim()));

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
    >
      <section
        className="operation-dialog nature-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nature-dialog-title"
      >
        <header>
          <div>
            <span className="dialog-icon"><Tags size={19} /></span>
            <div>
              <h2 id="nature-dialog-title">修改业务性质</h2>
              <p>只修正财务分类，不改变原积分流水</p>
            </div>
          </div>
          <button ref={closeRef} className="icon-button" aria-label="关闭业务性质弹窗" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="operation-body">
          <aside className="immutable-warning">
            <LockKeyhole size={15} />
            <span><strong>系统事实不可修改：</strong>账户、发生时间、积分流水号和积分变动保持原值。</span>
          </aside>
          <dl className="immutable-facts">
            <div><dt>特殊业务记录编号</dt><dd>{record.id}</dd></div>
            <div><dt>积分流水号</dt><dd>{record.pointsLedgerId}</dd></div>
            <div><dt>当前业务性质</dt><dd>{record.businessNature}</dd></div>
            <div><dt>充值积分变动</dt><dd>{record.rechargePoints} 点</dd></div>
          </dl>
          <section className="form-section">
            <div className="form-section-heading">
              <span>1</span><div><h3>新的分类</h3><p>改为退款扣回后才会开放退款资料入口</p></div>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>新的业务性质 *</span>
                <select value={businessNature} onChange={(event) => setBusinessNature(event.target.value as DeductionBusinessNature)}>
                  {natureOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="field">
                <span>修改说明{businessNature === "其他" ? " *" : ""}</span>
                <input value={changeReason} maxLength={200} placeholder="说明本次分类修正原因" onChange={(event) => setChangeReason(event.target.value)} />
              </label>
            </div>
          </section>
        </div>
        <footer>
          <button className="secondary-button" onClick={onClose}>取消</button>
          <button className="primary-button" disabled={!complete} onClick={() => onSave(record.id, { businessNature, changeReason })}>确认修改</button>
        </footer>
      </section>
    </div>
  );
}
