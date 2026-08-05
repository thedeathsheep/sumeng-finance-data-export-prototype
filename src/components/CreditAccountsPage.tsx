import { Coins, Filter, Gift, History, LockKeyhole, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { rechargeAdjustmentLedgers as initialLedgers } from "../data";
import type { AccountRecord, AccountType, RechargeAdjustmentDraft, RechargeAdjustmentLedger } from "../types";
import { RechargeAdjustmentDialog } from "./RechargeAdjustmentDialog";
import { StatusBadge } from "./StatusBadge";

const pointText = (value: number) => `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(value)} 点`;

interface CreditAccountsPageProps {
  accounts: AccountRecord[];
  onAccountsChange: (accounts: AccountRecord[]) => void;
  onAdjustment: (ledger: RechargeAdjustmentLedger) => void;
}

export function CreditAccountsPage({ accounts, onAccountsChange, onAdjustment }: CreditAccountsPageProps) {
  const [ledgers, setLedgers] = useState(initialLedgers);
  const [accountType, setAccountType] = useState<"全部" | AccountType>("全部");
  const [query, setQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | null>(null);
  const [message, setMessage] = useState("");

  const filteredAccounts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    return accounts.filter((account) => {
      const typeMatches = accountType === "全部" || account.accountType === accountType;
      const queryMatches = !normalized || [account.id, account.accountName, account.ownerName].join(" ").toLocaleLowerCase("zh-CN").includes(normalized);
      return typeMatches && queryMatches;
    });
  }, [accountType, accounts, query]);

  const addAdjustment = (account: AccountRecord, draft: RechargeAdjustmentDraft) => {
    const delta = draft.direction === "增加" ? draft.amount : -draft.amount;
    const balanceAfter = account.rechargePointsBalance + delta;
    onAccountsChange(accounts.map((item) => item.id === account.id ? { ...item, rechargePointsBalance: balanceAfter } : item));
    const ledger: RechargeAdjustmentLedger = {
      id: `CR-DEMO-${String(ledgers.length + 1).padStart(3, "0")}`,
      accountId: account.id,
      accountName: account.accountName,
      accountType: account.accountType,
      direction: draft.direction,
      delta,
      balanceBefore: account.rechargePointsBalance,
      balanceAfter,
      source: "后台手动调整",
      reason: draft.reason,
      operator: "管理员 Wsq",
      occurredAt: "2026-07-31 14:35:00",
    };
    setLedgers((current) => [ledger, ...current]);
    onAdjustment(ledger);
  };

  const showGiftMessage = () => {
    setMessage("“调整赠送积分”沿用现有后台能力，本次原型不改动其流程。");
    window.setTimeout(() => setMessage(""), 2800);
  };

  return <>
    <section className="page-heading">
      <div><div className="eyebrow"><LockKeyhole size={14} />仅具备积分调整权限的管理员可操作</div><h1>算力账户</h1><p>查看用户与团队的三类积分余额，并按账户调整充值积分</p></div>
    </section>

    <section className="scope-notice immutable-notice">
      <Coins size={16} />
      <p><strong>调整口径：</strong>“调整充值积分”只改变充值积分余额，不改变套餐积分或赠送积分，也不代表平台已经收款。</p>
      <span><History size={13} />所有调整均保留操作流水</span>
    </section>

    <section className="filter-bar">
      <div className="filter-title"><Filter size={15} />筛选</div>
      <label className="field"><span>账户类型</span><select value={accountType} onChange={(event) => setAccountType(event.target.value as "全部" | AccountType)}><option>全部</option><option>用户</option><option>团队</option></select></label>
      <label className="field field-wide"><span>账户名称 / ID / 归属人</span><span className="input-with-icon"><Search size={14} /><input value={query} placeholder="搜索账户" onChange={(event) => setQuery(event.target.value)} /></span></label>
      <button className="text-button reset-button" onClick={() => { setAccountType("全部"); setQuery(""); }}><RotateCcw size={14} />重置</button>
    </section>

    <section className="data-panel">
      <header className="data-panel-heading"><div><h2>账户列表</h2><p>用户与团队沿用同一积分调整规则</p></div><span className="record-count">共 {filteredAccounts.length} 个账户</span></header>
      <div className="table-scroll">
        <table className="credit-account-table">
          <thead><tr>{["账户 ID", "类型", "账户名称", "状态", "当前套餐", "套餐积分", "充值积分", "赠送积分", "操作"].map((header) => <th key={header}>{header}</th>)}</tr></thead>
          <tbody>{filteredAccounts.map((account) => <tr key={account.id}>
            <td>{account.id}</td><td><StatusBadge value={account.accountType} /></td><td><strong>{account.accountName}</strong><small className="table-subline">归属人：{account.ownerName}</small></td><td><StatusBadge value={account.status} /></td><td>{account.planName}</td><td>{pointText(account.planPointsBalance)}</td><td><strong className="recharge-balance">{pointText(account.rechargePointsBalance)}</strong></td><td>{pointText(account.giftPointsBalance)}</td><td><span className="row-actions"><button className="table-action recharge-action" onClick={() => setSelectedAccount(account)}><Coins size={13} />调整充值积分</button><button className="table-action" onClick={showGiftMessage}><Gift size={13} />调整赠送积分</button></span></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!filteredAccounts.length && <section className="empty-state"><h3>暂无匹配账户</h3><p>请调整账户类型或搜索条件。</p></section>}
    </section>

    <section className="data-panel ledger-panel">
      <header className="data-panel-heading"><div><h2>最近调整流水</h2><p>充值积分 · 来源：后台手动调整</p></div><span className="record-count">最近 {Math.min(ledgers.length, 5)} 条</span></header>
      <div className="table-scroll"><table><thead><tr>{["流水号", "账户", "方向", "变动积分", "调整前", "调整后", "调整原因", "操作人", "操作时间"].map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{ledgers.slice(0, 5).map((ledger) => <tr key={ledger.id}><td>{ledger.id}</td><td><strong>{ledger.accountName}</strong><small className="table-subline">{ledger.accountType} · {ledger.accountId}</small></td><td><StatusBadge value={ledger.direction} /></td><td className={ledger.delta >= 0 ? "money-positive" : "money-negative"}>{ledger.delta >= 0 ? "+" : ""}{pointText(ledger.delta)}</td><td>{pointText(ledger.balanceBefore)}</td><td>{pointText(ledger.balanceAfter)}</td><td><span className="reason-cell">{ledger.reason}</span></td><td>{ledger.operator}</td><td>{ledger.occurredAt}</td></tr>)}</tbody></table></div>
    </section>

    <RechargeAdjustmentDialog account={selectedAccount} onClose={() => setSelectedAccount(null)} onSubmit={addAdjustment} />
    {message && <div className="floating-toast" role="status">{message}</div>}
  </>;
}
