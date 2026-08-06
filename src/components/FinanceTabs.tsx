import type { TabId } from "../types";

export const tabItems: Array<{ id: TabId; label: string; description: string }> = [
  { id: "profiles", label: "客户及财务档案", description: "主体、合同与开票资料" },
  { id: "recharges", label: "充值明细", description: "线上同步与线下补录" },
  { id: "consumptions", label: "消费明细", description: "积分消耗与计量依据" },
  { id: "monthly", label: "月度汇总", description: "财务月份汇总结果" },
  { id: "special", label: "特殊业务", description: "手动扣减与线下退款" },
];

interface FinanceTabsProps {
  activeTab: TabId;
  counts: Record<TabId, number>;
  onChange: (tab: TabId) => void;
}

export function FinanceTabs({ activeTab, counts, onChange }: FinanceTabsProps) {
  return (
    <div className="finance-tabs" role="tablist" aria-label="财务数据分类">
      {tabItems.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={activeTab === item.id}
          className={activeTab === item.id ? "tab-active" : ""}
          onClick={() => onChange(item.id)}
        >
          <span>{item.label}</span>
          <small>{item.description}</small>
          <em>{counts[item.id]}</em>
        </button>
      ))}
    </div>
  );
}
