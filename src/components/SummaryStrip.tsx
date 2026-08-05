import { ArrowDownToLine, BadgeDollarSign, Gift, UsersRound } from "lucide-react";

export interface SummaryItem {
  label: string;
  value: string;
  hint: string;
}

const icons = [BadgeDollarSign, Gift, ArrowDownToLine, UsersRound];

export function SummaryStrip({ items }: { items: SummaryItem[] }) {
  return (
    <section className="summary-strip" aria-label="筛选结果汇总">
      {items.map((item, index) => {
        const Icon = icons[index] ?? BadgeDollarSign;
        return (
          <article className="summary-card" key={item.label}>
            <div className="summary-icon"><Icon size={17} /></div>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.hint}</small>
            </div>
          </article>
        );
      })}
    </section>
  );
}
