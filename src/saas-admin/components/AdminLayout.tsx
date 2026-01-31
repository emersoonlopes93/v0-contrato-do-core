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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b flex items-center justify-between px-4 z-10">
        <div className="font-semibold">SaaS Admin</div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              window.location.replace('/login');
            }}
            className="rounded px-3 py-2 bg-red-600 text-white hover:bg-red-700"
            style={{ minHeight: 44 }}
          >
            Sair
          </button>
        </div>
      </header>

      <div className="pt-14 flex">
        {/* Sidebar for desktop */}
        {!isMobile && (
          <aside className="w-64 bg-white border-r min-h-[calc(100vh-56px)] p-4 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`block rounded px-3 py-2 hover:bg-gray-100 ${
                  window.location.pathname === item.href ? 'bg-gray-200 font-medium' : ''
                }`}
              >
                {item.label}
              </a>
            ))}
          </aside>
        )}
        <main className="flex-1 p-4">{children}</main>
      </div>

      {/* Bottom navigation for mobile */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t grid grid-cols-3">
          {navItems.slice(0, 3).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center hover:bg-gray-100 ${
                window.location.pathname === item.href ? 'font-medium' : ''
              }`}
              style={{ minHeight: 44 }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
