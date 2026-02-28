export type NavigationMode = 'essential' | 'professional';

export type NavigationCategory =
  | 'dashboard'
  | 'operacao'
  | 'cardapio'
  | 'entregas'
  | 'financeiro'
  | 'clientes'
  | 'pessoas'
  | 'integracoes'
  | 'configuracoes'
  | 'experiencia';

export interface NavigationMeta {
  category: NavigationCategory;
  priority: number;
  modes: NavigationMode[];
  isAdvanced?: boolean;
}
