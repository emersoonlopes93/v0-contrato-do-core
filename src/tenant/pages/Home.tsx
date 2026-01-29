import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenantAuth } from '../hooks/use-tenant-auth';

/**
 * Home Page - Module Aware
 * 
 * - Shows enabled modules
 * - Shows user permissions
 * - Module-first cards with quick actions
 * - Mobile-optimized layout
 */

export function HomePage() {
  const { token } = useTenantAuth();

  if (!token) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo(a), {token.email}</p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Suas Informações</CardTitle>
          <CardDescription>Perfil e permissões</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="text-sm font-medium">{token.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Role:</span>
              <Badge variant="secondary">{token.role}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tenant ID:</span>
              <span className="font-mono text-xs">{token.tenantId}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Permissões:</h4>
            <div className="flex flex-wrap gap-2">
              {token.permissions.length > 0 ? (
                token.permissions.map((perm) => (
                  <Badge key={perm} variant="outline" className="text-xs">
                    {perm}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma permissão</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module-Aware Content */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Módulos Disponíveis</h2>

        {/* Example: Hello Module */}
        <Card>
          <CardHeader>
            <CardTitle>Hello Module</CardTitle>
            <CardDescription>Exemplo de módulo plugável</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/tenant/hello"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Acessar módulo →
            </a>
          </CardContent>
        </Card>

        {/* TODO: Render cards based on active modules */}
        {/* 
        {token.activeModules?.includes('delivery') && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
              <CardDescription>Gestão de entregas</CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/tenant/delivery" className="text-sm text-primary hover:underline">
                Acessar módulo →
              </a>
            </CardContent>
          </Card>
        )}
        */}
      </div>
    </div>
  );
}
