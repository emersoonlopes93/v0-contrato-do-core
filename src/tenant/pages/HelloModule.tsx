'use client';

import React from "react"
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { withModuleGuard } from '../components/ModuleGuard';
import { useSession } from '../context/SessionContext';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type { HelloMessageDTO } from '@/src/types/hello';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

function isHelloMessageDTO(value: unknown): value is HelloMessageDTO {
  if (!isRecord(value)) return false;
  return typeof value.message === 'string' && typeof value.createdAt === 'string';
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
function HelloModulePageContent() {
  const { user, accessToken } = useSession();
  const [messages, setMessages] = useState<HelloMessageDTO[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadMessages = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/v1/tenant/hello/list', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const raw: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        if (isApiErrorResponse(raw)) {
          throw new Error(raw.message);
        }
        throw new Error('Falha ao carregar mensagens');
      }

      if (!isApiSuccessResponse<unknown[]>(raw)) {
        throw new Error('Resposta inválida');
      }

      const list = Array.isArray(raw.data) ? raw.data : [];
      const normalized: HelloMessageDTO[] = list.filter(isHelloMessageDTO);

      setMessages(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newMessage.trim() || !accessToken) return;

    setIsSending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/v1/tenant/hello/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      const raw: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        if (isApiErrorResponse(raw)) {
          throw new Error(raw.message);
        }
        throw new Error('Falha ao enviar mensagem');
      }

      if (!isApiSuccessResponse<unknown>(raw)) {
        throw new Error('Resposta inválida');
      }

      await loadMessages();
      setSuccess('Mensagem enviada com sucesso');
      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar');
    } finally {
      setIsSending(false);
    }
  };
 
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Hello Module</h1>
        <p className="text-muted-foreground">Exemplo de módulo plugável</p>
      </div>

      {/* Send Message Form */}
      <Card>
        <CardHeader>
          <CardTitle>Enviar Mensagem</CardTitle>
          <CardDescription>Envie uma mensagem via hello-module</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Input
                id="message"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="h-11"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && !error && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="h-11 w-full" disabled={isSending}>
              {isSending ? 'Enviando...' : 'Enviar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Mensagens</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma mensagem ainda
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, index) => (
              <Card key={`${msg.createdAt}-${index}`}>
                <CardContent className="pt-6">
                  <p className="text-sm">{msg.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Export with HOC protection
export const HelloModulePage = withModuleGuard(HelloModulePageContent, 'hello-module');
