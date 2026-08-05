import {
  BarChart3,
  Bot,
  ChevronDown,
  CircleUserRound,
  Coins,
  CreditCard,
  Database,
  FileBarChart,
  LayoutDashboard,
  Menu,
  Package,
  Search,
  Settings,
  Sparkles,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import type { PageId } from "../types";

const navigation = [
  { label: "数据总览", icon: LayoutDashboard },
  { label: "用户管理", icon: UsersRound },
  { label: "订单管理", icon: CreditCard },
  { label: "套餐管理", icon: Package },
  { label: "模型管理", icon: Bot },
  { label: "资源统计", icon: BarChart3 },
  { label: "数据配置", icon: Database },
];

interface AdminShellProps {
  children: ReactNode;
  mobileNavOpen: boolean;
  onToggleNav: () => void;
  activePage: PageId;
  onPageChange: (page: PageId) => void;
}

export function AdminShell({
  children,
  mobileNavOpen,
  onToggleNav,
  activePage,
  onPageChange,
}: AdminShellProps) {
  const selectPage = (page: PageId) => {
    onPageChange(page);
    if (mobileNavOpen) onToggleNav();
  };

  return (
    <div className="admin-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark"><Sparkles size={17} /></span>
          <span className="brand-name">SumengAI</span>
          <button
            className="icon-button mobile-only"
            aria-label="关闭导航"
            onClick={onToggleNav}
          >
            <X size={18} />
          </button>
        </div>
        <nav aria-label="后台主导航">
          <p className="nav-heading">管理中心</p>
          <ul className="nav-list">
            {navigation.slice(0, 5).map(({ label, icon: Icon }) => (
              <li key={label}>
                <button className="nav-item">
                  <Icon size={17} />
                  <span>{label}</span>
                  {label === "模型管理" && <span className="nav-tag">12</span>}
                </button>
              </li>
            ))}
            <li className="nav-group nav-group-open">
              <div className={`nav-item ${activePage === "credits" ? "nav-parent-active" : ""}`}>
                <Coins size={17} />
                <span>积分管理</span>
                <ChevronDown className="nav-chevron" size={14} />
              </div>
              <div className="nav-children">
                <button
                  className={`nav-child ${activePage === "credits" ? "nav-child-active" : ""}`}
                  aria-current={activePage === "credits" ? "page" : undefined}
                  onClick={() => selectPage("credits")}
                >
                  <span className="nav-child-dot" />
                  算力账户
                </button>
              </div>
            </li>
            <li>
              <button
                className={`nav-item ${activePage === "finance" ? "nav-item-active" : ""}`}
                aria-current={activePage === "finance" ? "page" : undefined}
                onClick={() => selectPage("finance")}
              >
                <FileBarChart size={17} />
                <span>财务数据</span>
              </button>
            </li>
            {navigation.slice(5).map(({ label, icon: Icon }) => (
              <li key={label}>
                <button className="nav-item">
                  <Icon size={17} />
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item"><Settings size={17} /><span>系统设置</span></button>
          <button className="profile-button">
            <span className="profile-avatar">A</span>
            <span className="profile-copy"><strong>管理员</strong><small>财务管理员</small></span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="关闭导航"
          onClick={onToggleNav}
        />
      )}

      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            aria-label="打开导航"
            onClick={onToggleNav}
          >
            <Menu size={19} />
          </button>
          <label className="global-search">
            <Search size={16} />
            <span className="sr-only">全局搜索</span>
            <input placeholder="搜索用户、订单或任务 ID" />
            <kbd>⌘ K</kbd>
          </label>
          <div className="topbar-actions">
            <button className="topbar-credit"><WalletCards size={16} />企业版</button>
            <button className="avatar-button" aria-label="查看当前账号">
              <CircleUserRound size={20} />
            </button>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
