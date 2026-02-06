import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  Puzzle, 
  Palette, 
  FileText,
  Menu,
  X,
  LogOut,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Tenants', icon: Building2 },
  { href: '/admin/plans', label: 'Plans', icon: CreditCard },
  { href: '/admin/modules', label: 'Modules', icon: Puzzle },
  { href: '/admin/white-label', label: 'White Label', icon: Palette },
  { href: '/admin/audit', label: 'Audit Logs', icon: FileText },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  React.useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  
  React.useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="saas-admin-app min-h-screen bg-gradient-to-br from-background-app via-background to-background-surface">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur-sm px-4 shadow-sm">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent transition-colors duration-200"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-semibold text-lg text-foreground">SaaS Admin</h1>
              <p className="text-xs text-muted-foreground">Painel de Controle</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              localStorage.removeItem('saas_admin_access_token');
              localStorage.removeItem('saas_admin_refresh_token');
              window.location.replace('/login');
            }}
            className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-danger-foreground hover:bg-danger/90 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar for desktop */}
        {!isMobile && (
          <aside className="min-h-[calc(100vh-64px)] w-72 border-r border-border/40 bg-background-surface/50 backdrop-blur-sm">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Navegação</h2>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = window.location.pathname === item.href;
                  
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4" />}
                      {!isActive && <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>
        )}
        
        {/* Mobile Sidebar Overlay */}
        {isMobile && isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="fixed top-16 left-0 z-50 h-[calc(100vh-64px)] w-72 border-r border-border/40 bg-background/95 backdrop-blur-sm shadow-xl">
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Navegação</h2>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = window.location.pathname === item.href;
                    
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight className="h-4 w-4" />}
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>
          </>
        )}
        
        <main className="flex-1 p-6 pb-20 md:pb-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      {isMobile && !isSidebarOpen && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/40 bg-background/95 backdrop-blur-sm">
          <div className="grid grid-cols-3 h-16">
            {navItems.slice(0, 3).map((item) => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.href;
              
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors duration-200 ${
                    isActive 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate px-1">{item.label}</span>
                </a>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
