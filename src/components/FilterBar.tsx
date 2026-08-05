import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { AccountRecord, AccountType } from "../types";

interface FilterBarProps {
  month: string;
  accountType: "全部" | AccountType;
  accountQuery: string;
  accounts: AccountRecord[];
  onMonthChange: (value: string) => void;
  onAccountTypeChange: (value: "全部" | AccountType) => void;
  onAccountQueryChange: (value: string) => void;
  onReset: () => void;
}

export function FilterBar({ month, accountType, accountQuery, accounts, onMonthChange, onAccountTypeChange, onAccountQueryChange, onReset }: FilterBarProps) {
  return <section className="filter-bar" aria-label="财务数据筛选">
    <div className="filter-title"><SlidersHorizontal size={16} /><span>筛选条件</span></div>
    <label className="field"><span>业务月份</span><input type="month" value={month} onChange={(event) => onMonthChange(event.target.value)} /></label>
    <label className="field"><span>线上对象类型</span><select value={accountType} onChange={(event) => onAccountTypeChange(event.target.value as "全部" | AccountType)}><option value="全部">全部</option><option value="用户">用户</option><option value="团队">团队</option></select></label>
    <label className="field field-wide"><span>关联用户 / 团队 / 算力账户</span><input type="search" list="account-options" value={accountQuery} placeholder="搜索名称或 ID" onChange={(event) => onAccountQueryChange(event.target.value)} /><datalist id="account-options">{accounts.map((account) => <option key={account.id} value={account.accountName}>{account.id} · {account.accountType}</option>)}</datalist></label>
    <button className="secondary-button reset-button" onClick={onReset}><RotateCcw size={15} />重置</button>
  </section>;
}
