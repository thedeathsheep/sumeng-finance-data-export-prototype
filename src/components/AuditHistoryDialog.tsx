import { History, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { AuditLogRecord } from "../types";

interface AuditHistoryDialogProps {
  open: boolean;
  recordId: string | null;
  logs: AuditLogRecord[];
  onClose: () => void;
}

export function AuditHistoryDialog({ open, recordId, logs, onClose }: AuditHistoryDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => closeRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);
  if (!open || !recordId) return null;
  const currentLogs = logs.filter((item) => item.recordId === recordId).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <section className="audit-dialog" role="dialog" aria-modal="true" aria-labelledby="audit-dialog-title">
      <header><span className="dialog-icon"><History size={19} /></span><div><h2 id="audit-dialog-title">变更记录</h2><p>{recordId} · 创建、修改、关联流水和作废均永久保留</p></div><button ref={closeRef} className="icon-button" aria-label="关闭变更记录" onClick={onClose}><X size={18} /></button></header>
      <div className="audit-dialog-body">{currentLogs.length ? currentLogs.map((item) => <article key={item.id} className="audit-event"><span className="audit-event-dot" /><div><header><strong>{item.action}</strong><time>{item.occurredAt}</time></header><p>{item.detail}</p><small>操作人：{item.operator}</small></div></article>) : <div className="audit-empty">暂无变更记录</div>}</div>
      <footer><button className="primary-button" onClick={onClose}>完成</button></footer>
    </section>
  </div>;
}
