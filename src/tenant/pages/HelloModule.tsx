'use client';

import React from "react"
import { useSession } from '../context/SessionContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { withModuleGuard } from '../components/ModuleGuard';

/**
 * Hello Module Page - Example
 * 
 * Demonstrates:
 * - API integration with /api/v1/tenant/hello
 * - Module permission check
 * - Mobile-first form
 * - Loading states
 */

interface HelloMessage {
  id: string;
  message: string;
  createdAt: string;
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
  const { user } = useSession();
  const [messages, setMessages] = useState<HelloMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    setError('');
    try {
      // TODO: Call /api/v1/tenant/hello with Authorization header
      // Mocking for now as the backend might not be running or reachable during build/test
      // const response = await fetch('/api/v1/tenant/hello', {
      //   headers: {
      //     Authorization: `Bearer ${accessToken}`,
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error('Falha ao carregar mensagens');
      // }

      // const data = await response.json();
      // setMessages(data.messages || []);
      
      // Mock data
      setMessages([
          { id: '1', message: 'Hello from mock!', createdAt: new Date().toISOString() }
      ]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    setError('');

    try {
      // const response = await fetch('/api/v1/tenant/hello', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${accessToken}`,
      //   },
      //   body: JSON.stringify({ message: newMessage }),
      // });

      // if (!response.ok) {
      //   throw new Error('Falha ao enviar mensagem');
      // }

      // const data = await response.json();
      // setMessages([data.message, ...messages]);
      
      // Mock success
       const mockMsg = { id: Date.now().toString(), message: newMessage, createdAt: new Date().toISOString() };
       setMessages([mockMsg, ...messages]);

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
            {messages.map((msg) => (
              <Card key={msg.id}>
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
