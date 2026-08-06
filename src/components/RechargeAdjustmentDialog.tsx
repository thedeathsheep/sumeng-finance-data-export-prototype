import { AlertTriangle, CheckCircle2, Coins, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AccountRecord, AdjustmentBusinessNature, RechargeAdjustmentDraft, RechargeDirection } from "../types";

type DialogStep = "form" | "confirm" | "success";

interface RechargeAdjustmentDialogProps {
  account: AccountRecord | null;
  onClose: () => void;
  onSubmit: (account: AccountRecord, draft: RechargeAdjustmentDraft) => void;
}

const pointText = (value: number) => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(value);
const natureOptions: Record<RechargeDirection, AdjustmentBusinessNature[]> = {
  增加: ["线下购买", "免费升级", "客户补偿", "纠错增加", "其他"],
  扣减: ["退款扣回", "纠错扣减", "其他"],
};

export function RechargeAdjustmentDialog({ account, onClose, onSubmit }: RechargeAdjustmentDialogProps) {
  const [step, setStep] = useState<DialogStep>("form");
  const [direction, setDirection] = useState<RechargeDirection>("增加");
  const [amount, setAmount] = useState("");
  const [businessNature, setBusinessNature] = useState<AdjustmentBusinessNature | "">("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; businessNature?: string; reason?: string }>({});

  useEffect(() => {
    if (!account) return;
    setStep("form");
    setDirection("增加");
    setAmount("");
    setBusinessNature("");
    setReason("");
    setErrors({});
  }, [account]);

  useEffect(() => {
    if (!account) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [account, onClose]);

  const amountValue = Number(amount) || 0;
  const signedAmount = direction === "增加" ? amountValue : -amountValue;
  const balanceAfter = useMemo(
    () => (account?.rechargePointsBalance ?? 0) + signedAmount,
    [account, signedAmount],
  );

  if (!account) return null;

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!amount.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      nextErrors.amount = "请输入大于 0 的调整积分";
    } else if (!/^\d+$/.test(amount.trim())) {
      nextErrors.amount = "调整积分必须为整数";
    } else if (direction === "扣减" && Number(amount) > account.rechargePointsBalance) {
      nextErrors.amount = `最多可扣减 ${pointText(account.rechargePointsBalance)} 点`;
    }
    if (!businessNature) nextErrors.businessNature = "请选择业务性质";
    if (businessNature === "其他" && !reason.trim()) nextErrors.reason = "选择其他时必须填写调整说明";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setStep("confirm");
  };

  const submit = () => {
    if (!businessNature) return;
    onSubmit(account, { direction, amount: amountValue, businessNature, reason: reason.trim() });
    setStep("success");
  };

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="recharge-dialog" role="dialog" aria-modal="true" aria-labelledby="recharge-dialog-title">
        <header>
          <div>
            <span className="dialog-icon"><Coins size={20} /></span>
            <div>
              <h2 id="recharge-dialog-title">调整充值积分</h2>
              <p>{step === "form" ? "仅调整充值积分，不记录收款信息" : step === "confirm" ? "请核对账户、方向和调整后余额" : "调整已生效并生成流水"}</p>
            </div>
          </div>
          <button className="icon-button" aria-label="关闭调整弹窗" onClick={onClose}><X size={18} /></button>
        </header>

        {step === "form" && <>
          <div className="recharge-dialog-body">
            <section className="account-identity">
              <div><span>账户名称</span><strong>{account.accountName}</strong></div>
              <div><span>账户 ID</span><strong>{account.id}</strong></div>
              <div><span>账户类型</span><strong>{account.accountType}</strong></div>
              <div><span>当前充值积分</span><strong>{pointText(account.rechargePointsBalance)} 点</strong></div>
            </section>

            <label className="field field-full">
              <span>调整方向 *</span>
              <span className="direction-switch" role="group" aria-label="调整方向">
                {(["增加", "扣减"] as RechargeDirection[]).map((value) => (
                  <button key={value} type="button" className={direction === value ? "active" : ""} onClick={() => { setDirection(value); setBusinessNature(""); setErrors({}); }}>{value}</button>
                ))}
              </span>
            </label>

            <div className="recharge-form-grid">
              <label className="field">
                <span>调整积分 *</span>
                <input type="number" inputMode="numeric" min="1" step="1" value={amount} placeholder="请输入正整数" onChange={(event) => { setAmount(event.target.value); setErrors((current) => ({ ...current, amount: undefined })); }} />
                {errors.amount && <small className="field-error">{errors.amount}</small>}
              </label>
              <label className="field">
                <span>业务性质 *</span>
                <select aria-label="业务性质" value={businessNature} onChange={(event) => { setBusinessNature(event.target.value as AdjustmentBusinessNature); setErrors((current) => ({ ...current, businessNature: undefined, reason: undefined })); }}>
                  <option value="">请选择</option>
                  {natureOptions[direction].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                {errors.businessNature && <small className="field-error">{errors.businessNature}</small>}
              </label>
              <label className="field field-span-2">
                <span>调整说明{businessNature === "其他" ? " *" : ""} <em>{reason.length}/200</em></span>
                <textarea maxLength={200} value={reason} placeholder={businessNature === "其他" ? "请输入具体业务原因" : "选填，原文将保留在积分流水中"} onChange={(event) => { setReason(event.target.value); setErrors((current) => ({ ...current, reason: undefined })); }} />
                {errors.reason && <small className="field-error">{errors.reason}</small>}
              </label>
            </div>

            <section className="balance-preview" aria-label="调整后余额预览">
              <div><span>调整前</span><strong>{pointText(account.rechargePointsBalance)}</strong></div>
              <div><span>本次变动</span><strong className={signedAmount >= 0 ? "money-positive" : "money-negative"}>{signedAmount >= 0 ? "+" : ""}{pointText(signedAmount)}</strong></div>
              <div><span>调整后</span><strong>{pointText(Math.max(0, balanceAfter))}</strong></div>
            </section>
          </div>
          <footer><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={validate}>确认调整</button></footer>
        </>}

        {step === "confirm" && <>
          <div className="confirm-view recharge-confirm">
            <div className="confirm-shield"><ShieldCheck size={25} /></div>
            <h3>确认调整充值积分</h3>
            <p>请再次确认。本操作只改变充值积分余额。</p>
            <dl>
              <div><dt>账户</dt><dd>{account.accountType} · {account.accountName}（{account.id}）</dd></div>
              <div><dt>调整方向</dt><dd>{direction}</dd></div>
              <div><dt>业务性质</dt><dd>{businessNature}</dd></div>
              <div><dt>积分变动</dt><dd className={signedAmount >= 0 ? "money-positive" : "money-negative"}>{signedAmount >= 0 ? "+" : ""}{pointText(signedAmount)} 点</dd></div>
              <div><dt>调整前 / 后</dt><dd>{pointText(account.rechargePointsBalance)} → {pointText(balanceAfter)} 点</dd></div>
              <div><dt>调整说明</dt><dd>{reason.trim() || "/"}</dd></div>
            </dl>
            <div className="immutable-warning"><AlertTriangle size={15} />提交后将生成不可删除的积分流水；如需纠正，请新增一笔反向调整。</div>
          </div>
          <footer><button className="secondary-button" onClick={() => setStep("form")}>返回修改</button><button className="primary-button" onClick={submit}>确认并调整</button></footer>
        </>}

        {step === "success" && <>
          <div className="dialog-state">
            <CheckCircle2 className="state-success" size={46} />
            <h3>充值积分调整成功</h3>
            <p>{account.accountName} 的充值积分余额已更新为 {pointText(balanceAfter)} 点</p>
            <small>已生成后台手动调整流水，并自动同步至{direction === "增加" ? "充值明细" : "特殊业务"}</small>
          </div>
          <footer><button className="primary-button" onClick={onClose}>完成</button></footer>
        </>}
      </section>
    </div>
  );
}
