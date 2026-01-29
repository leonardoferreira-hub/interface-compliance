import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      investidores: {
        Row: {
          id: string;
          created_at: string;
          tipo: 'PF' | 'PJ' | 'INSTITUCIONAL';
          status: 'pendente' | 'aprovado' | 'rejeitado';
        };
      };
      emissao_investidores: {
        Row: {
          id: string;
          emissao_id: string;
          investidor_id: string | null;
          token_cadastro: string;
          status_cadastro: 'pendente' | 'preenchido' | 'aprovado';
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
