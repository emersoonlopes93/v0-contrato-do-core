# Guia de Desenvolvimento

Siga este guia para manter a consistência e a qualidade do código ao adicionar novas funcionalidades.

## ➕ Criando um Novo Módulo

1.  **Estrutura de Pastas**: Crie uma pasta em `./src/modules/[module-name]`.
    - `src/`: Lógica do módulo.
    - `src/manifest.ts`: Definição do módulo.
    - `src/module.ts`: Função de registro.
2.  **Manifesto**: Defina o ID, nome e permissões.
    ```typescript
    export const manifest = {
      id: asModuleId('meu-modulo'),
      name: 'Meu Novo Módulo',
      version: '1.0.0',
      permissions: [
        { slug: 'meu.read', name: 'Visualizar', description: '...' }
      ]
    };
    ```
3.  **Registro**: Exporte uma função `register(context: ModuleContext)`.
4.  **Habilitação**: Registre o módulo em `./src/api/v1/index.ts`.

## 🔒 Adicionando Permissões

As permissões devem ser registradas no manifesto do módulo. Elas seguem o padrão `modulo.acao`.
- Use o middleware `requirePermission('modulo.acao')` em suas rotas.

## 🧪 Executando Testes

Utilizamos Vitest para testes unitários e de integração.
```bash
# Executar todos os testes
npm run test

# Executar em modo watch
npx vitest
```
Os arquivos de teste devem terminar em `.test.ts` ou `.spec.ts`.

## 📏 Padrões de Código

- **TypeScript**: Use tipos fortes sempre que possível. Evite `any`.
- **Async/Await**: Prefira o uso de async/await em vez de promises brutas ou callbacks.
- **Isolamento**: Um módulo nunca deve importar arquivos de dentro de outro módulo diretamente. Use o `ModuleServiceRegistry` se precisar de funcionalidades de outro módulo.
- **Prisma**: Sempre gere o cliente após alterar o `schema.prisma`.

## 🚀 Deployment

O sistema está preparado para ser implantado como uma aplicação Node.js tradicional. Certifique-se de executar as migrações do Prisma (`npx prisma migrate deploy`) no seu pipeline de CI/CD.
