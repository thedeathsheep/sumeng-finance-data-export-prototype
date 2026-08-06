import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { AccountRecord, AccountType, CustomerType, RecordSource, RecordStatus } from "../types";

export type CustomerTypeFilter = "全部" | CustomerType | "未关联";

interface FilterBarProps {
  month: string;
  accountType: "全部" | AccountType;
  customerType: CustomerTypeFilter;
  accountQuery: string;
  businessQuery: string;
  source: "全部" | RecordSource;
  recordStatus: "全部" | RecordStatus;
  accounts: AccountRecord[];
  onMonthChange: (value: string) => void;
  onAccountTypeChange: (value: "全部" | AccountType) => void;
  onCustomerTypeChange: (value: CustomerTypeFilter) => void;
  onAccountQueryChange: (value: string) => void;
  onBusinessQueryChange: (value: string) => void;
  onSourceChange: (value: "全部" | RecordSource) => void;
  onRecordStatusChange: (value: "全部" | RecordStatus) => void;
  onReset: () => void;
}

export function FilterBar(props: FilterBarProps) {
  const { month, accountType, customerType, accountQuery, businessQuery, source, recordStatus, accounts } = props;
  return <section className="filter-bar finance-filter-bar" aria-label="财务数据筛选">
    <div className="filter-title"><SlidersHorizontal size={16} /><span>筛选条件</span></div>
    <label className="field"><span>业务月份</span><input type="month" value={month} onChange={(event) => props.onMonthChange(event.target.value)} /></label>
    <label className="field"><span>线上对象类型</span><select value={accountType} onChange={(event) => props.onAccountTypeChange(event.target.value as "全部" | AccountType)}><option>全部</option><option>用户</option><option>团队</option></select></label>
    <label className="field"><span>客户类型</span><select value={customerType} onChange={(event) => props.onCustomerTypeChange(event.target.value as CustomerTypeFilter)}><option>全部</option><option>个人</option><option>企业</option><option>未关联</option></select></label>
    <label className="field field-wide"><span>账户 / 财务主体</span><input type="search" list="account-options" value={accountQuery} placeholder="搜索名称或 ID" onChange={(event) => props.onAccountQueryChange(event.target.value)} /><datalist id="account-options">{accounts.map((account) => <option key={account.id} value={account.accountName}>{account.id} · {account.accountType}</option>)}</datalist></label>
    <label className="field"><span>业务类型 / 性质</span><input type="search" value={businessQuery} placeholder="例如：退款扣回" onChange={(event) => props.onBusinessQueryChange(event.target.value)} /></label>
    <label className="field"><span>数据来源</span><select value={source} onChange={(event) => props.onSourceChange(event.target.value as "全部" | RecordSource)}><option>全部</option><option>系统同步</option><option>人工维护</option></select></label>
    <label className="field"><span>记录状态</span><select value={recordStatus} onChange={(event) => props.onRecordStatusChange(event.target.value as "全部" | RecordStatus)}><option>全部</option><option>有效</option><option>已作废</option></select></label>
    <button className="secondary-button reset-button" onClick={props.onReset}><RotateCcw size={15} />重置</button>
  </section>;
}
