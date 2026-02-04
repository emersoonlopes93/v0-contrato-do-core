import React from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/tenants', label: 'Tenants' },
  { href: '/admin/plans', label: 'Plans' },
  { href: '/admin/modules', label: 'Modules' },
  { href: '/admin/white-label', label: 'White Label' },
  { href: '/admin/audit', label: 'Audit Logs' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="min-h-screen bg-background-app">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 flex h-14 items-center justify-between border-b bg-background-surface px-4">
        <div className="font-semibold">SaaS Admin</div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              localStorage.removeItem('saas_admin_access_token');
              localStorage.removeItem('saas_admin_refresh_token');
              window.location.replace('/login');
            }}
            className="h-11 rounded-md bg-danger px-3 py-2 text-sm font-medium text-danger-foreground hover:brightness-95 active:brightness-90"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar for desktop */}
        {!isMobile && (
          <aside className="min-h-[calc(100vh-56px)] w-64 space-y-2 border-r bg-background-surface p-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`block rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                  window.location.pathname === item.href ? 'bg-primary-soft text-primary font-semibold' : ''
                }`}
              >
                {item.label}
              </a>
            ))}
          </aside>
        )}
        <main className="flex-1 p-4 pb-20 md:pb-4">{children}</main>
      </div>

      {/* Bottom navigation for mobile */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 grid h-16 grid-cols-3 border-t bg-background-surface">
          {navItems.slice(0, 3).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center text-sm hover:bg-accent hover:text-accent-foreground ${
                window.location.pathname === item.href ? 'font-medium' : ''
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
