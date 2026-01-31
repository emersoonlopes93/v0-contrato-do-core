import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '../context/SessionContext';

type ModuleCard = {
  title: string;
  description: string;
  href: string;
};

export function HomePage() {
  const { user, permissions, tenantId, activeModules } = useSession();

  if (!user) {
    return null;
  }

  const moduleRouteMap: Record<string, ModuleCard> = {
    'hello-module': {
      title: 'Hello Module',
      description: 'Exemplo de módulo plugável',
      href: '/tenant/hello',
    },
  };

  const moduleCards = activeModules
    .map((moduleId: string) => moduleRouteMap[moduleId])
    .filter((item: ModuleCard | undefined): item is ModuleCard => item !== undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo(a), {user.email}</p>
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
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Role:</span>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tenant ID:</span>
              <span className="font-mono text-xs">{tenantId}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Permissões:</h4>
            <div className="flex flex-wrap gap-2">
              {permissions.length > 0 ? (
                permissions.map((perm: string) => (
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

        {moduleCards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum módulo com interface disponível para este tenant.
          </p>
        ) : (
          moduleCards.map((module: ModuleCard) => (
            <Card key={module.href}>
              <CardHeader>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={module.href}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Acessar módulo →
                </a>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
