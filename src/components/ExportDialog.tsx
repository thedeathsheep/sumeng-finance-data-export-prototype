import { AlertCircle, CheckCircle2, FileSpreadsheet, LoaderCircle, RotateCw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AccountType, TabId } from "../types";
import { tabItems } from "./FinanceTabs";

type ExportState = "confirm" | "loading" | "success" | "error";

interface ExportDialogProps {
  open: boolean;
  month: string;
  accountType: "全部" | AccountType;
  accountName: string;
  activeTab: TabId;
  rowCount: number;
  totalRowCount: number;
  onClose: () => void;
}

export function ExportDialog({ open, month, accountType, accountName, activeTab, rowCount, totalRowCount, onClose }: ExportDialogProps) {
  const [state, setState] = useState<ExportState>("confirm");
  const [selectedSheets, setSelectedSheets] = useState<TabId[]>(tabItems.map((item) => item.id));
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setState("confirm");
    setSelectedSheets(tabItems.map((item) => item.id));
    window.setTimeout(() => closeRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const fileName = useMemo(() => `平台财务数据_${month}${accountName === "全部账户" ? "" : `_${accountName}`}.xlsx`, [accountName, month]);
  if (!open) return null;
  const activeLabel = tabItems.find((item) => item.id === activeTab)?.label;
  const toggleSheet = (id: TabId) => setSelectedSheets((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const startExport = () => { setState("loading"); window.setTimeout(() => setState("success"), 900); };

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <section className="export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
      <header><span className="dialog-icon"><FileSpreadsheet size={20} /></span><div><h2 id="export-title">导出财务数据</h2><p>系统导出文件包含 5 个工作表，字段与当前页面口径一致</p></div><button ref={closeRef} className="icon-button" aria-label="关闭导出弹窗" onClick={onClose}><X size={18} /></button></header>
      {state === "confirm" && <>
        <div className="export-scope"><div><span>业务月份</span><strong>{month}</strong></div><div><span>账户范围</span><strong>{accountType} · {accountName}</strong></div><div><span>当前视图</span><strong>{activeLabel} · {rowCount} 条</strong></div><div><span>全部记录</span><strong>{totalRowCount} 条</strong></div></div>
        <div className="workbook-list workbook-checklist"><p>选择 Excel 工作表（默认全选）</p>{tabItems.map((item) => <label key={item.id} className={selectedSheets.includes(item.id) ? "sheet-selected" : ""}><input type="checkbox" checked={selectedSheets.includes(item.id)} onChange={() => toggleSheet(item.id)} /><span><strong>{item.label}</strong><small>{item.description}</small></span></label>)}</div>
        <aside className="dialog-note">页面显示“/”的字段，Excel 同样输出“/”；已作废记录保留状态但不进入有效汇总；系统不会使用积分补算人民币金额。</aside>
      </>}
      {state === "loading" && <div className="dialog-state" aria-live="polite"><LoaderCircle className="spin" size={32} /><h3>正在整理导出数据</h3><p>正在生成 {selectedSheets.length} 个工作表…</p></div>}
      {state === "success" && <div className="dialog-state" aria-live="polite"><CheckCircle2 className="state-success" size={36} /><h3>导出文件已生成</h3><p>{fileName} · {selectedSheets.length} 个工作表</p><small>原型仅演示交互，不会下载真实财务文件。</small></div>}
      {state === "error" && <div className="dialog-state" aria-live="polite"><AlertCircle className="state-error" size={36} /><h3>导出失败</h3><p>文件生成服务暂时不可用，请稍后重试。</p></div>}
      <footer>{state === "confirm" && <><button className="text-button danger-demo" onClick={() => setState("error")}>查看失败状态</button><div><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" disabled={!selectedSheets.length} onClick={startExport}>开始导出（{selectedSheets.length}）</button></div></>}{state === "loading" && <button className="secondary-button" disabled>正在生成…</button>}{state === "success" && <button className="primary-button" onClick={onClose}>完成</button>}{state === "error" && <><button className="secondary-button" onClick={onClose}>关闭</button><button className="primary-button" onClick={startExport}><RotateCw size={15} />重试</button></>}</footer>
    </section>
  </div>;
}
