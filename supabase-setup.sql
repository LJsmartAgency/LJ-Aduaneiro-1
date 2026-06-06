-- =====================================================================
-- ESTRUTURA PARA BANCO DE DADOS SUPABASE (POSTGRESQL) COM MULTI-TENANCY
-- Sistema Aduaneiro de Auditoria Inteligente e Cross-Check
-- =====================================================================
--
-- ESSE CODIGO PODE SER COPIADO E COLADO DIRETAMENTE NO "SQL EDITOR" DO SEU PAINEL SUPABASE.
-- Ele cria todas as tabelas, relacionamentos, indices de performance e as
-- restricoes de Seguranca de Nivel de Linha (Row-Level Security - RLS).
-- Com o RLS ativo, usuarios da Empresa A NAO conseguem ler nem alterar dados da Empresa B.

-- 1. Habilitar a extensao UUID para geracao de chaves primarias unicas (se nao houver)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Empresas de Importacao/Exportacao (Tenants)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nuit_cnpj TEXT, -- Identificacao fiscal (NUIT em Mocambique, CNPJ no Brasil)
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indice para buscas de empresas rapidas pelo nome
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);


-- 3. Perfis de Usuarios (Extensao dos usuarios do Supabase Auth para controle de Empresas e Níveis)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Operacional' CHECK (role IN ('Admin', 'Operacional')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);


-- 4. Tabela de Processos Aduaneiros (Importacoes e Exportacoes)
CREATE TABLE IF NOT EXISTS public.customs_processes (
    id TEXT PRIMARY KEY, -- Ex: IMP-2026-001
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    client TEXT NOT NULL, -- Importador/Consignatario ou Exportador Final
    intern_number TEXT,  -- Numero Interno do Despachante/Empresa
    type TEXT NOT NULL CHECK (type IN ('Importação', 'Exportação')),
    port TEXT NOT NULL CHECK (port IN ('Maputo', 'Beira', 'Nacala', 'Outro')),
    status TEXT NOT NULL DEFAULT 'OK' CHECK (status IN ('OK', 'Em Correção', 'Erro Crítico', 'Submetido')),
    risk TEXT NOT NULL DEFAULT 'Baixo' CHECK (risk IN ('Baixo', 'Médio', 'Alto')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    days_remaining INTEGER DEFAULT 15,
    cost_at_risk NUMERIC(12, 2) DEFAULT 0.00,
    
    -- Campos complexos em JSONB (Preserva a estrutura exata do front-end)
    documents JSONB DEFAULT '[]'::jsonb NOT NULL, -- Anexos de documentos
    extracted_fields JSONB DEFAULT '{}'::jsonb NOT NULL, -- Campos auditados e confiancas
    discrepancies JSONB DEFAULT '[]'::jsonb NOT NULL, -- Divergencias detectadas
    checklist JSONB DEFAULT '{"invoiceValidated": false, "blValidated": false, "weightConfirmed": false, "mapaLicenseConfirmed": false, "hsCodeConfirmed": false}'::jsonb NOT NULL, -- Checklist aduaneiro
    
    canal TEXT CHECK (canal IN ('Verde', 'Amarelo', 'Vermelho', 'Cinzento'))
);

-- Indices para performance de busca na tabela de processos por empresa
CREATE INDEX IF NOT EXISTS idx_processes_company ON public.customs_processes(company_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON public.customs_processes(status);


-- 5. Tabelas de Logs de Auditoria (Trilha de seguranca para compliance)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    process_id TEXT NOT NULL REFERENCES public.customs_processes(id) ON DELETE CASCADE,
    process_number TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL CHECK (user_role IN ('Admin', 'Operacional')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    action TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_process ON public.audit_logs(process_id);


-- =====================================================================
-- CONFIGURACAO DE SEGURANCA: ROW LEVEL SECURITY (RLS) - MULTI-EMPRESA
-- =====================================================================

-- Habilitando RLS em todas as tabelas necessarias
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customs_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Politicas para Perfis de Usuarios (profiles)
-- Cada usuario pode ver apenas o seu proprio perfil de login
CREATE POLICY "Usuarios podem ver o seu proprio perfil"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Atualizacao do proprio perfil
CREATE POLICY "Usuarios podem editar o seu proprio perfil"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);


-- 2. Politicas para Empresas (companies)
-- Usuarios podem ver apenas a empresa a que pertencem
CREATE POLICY "Usuarios podem ver apenas sua empresa"
ON public.companies
FOR SELECT
USING (id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));


-- 3. Politicas para Processos Aduaneiros (customs_processes)
-- Operacionais e Admins so podem ler processos da sua propria empresa
CREATE POLICY "Visualizar processos da propria empresa"
ON public.customs_processes
FOR SELECT
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Apenas usuarios autenticados da mesma empresa podem inserir processos
CREATE POLICY "inserir processos para a sua empresa"
ON public.customs_processes
FOR INSERT
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Apenas usuarios autenticados da mesma empresa podem atualizar processos em andamento
CREATE POLICY "Editar processos da propria empresa"
ON public.customs_processes
FOR UPDATE
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Apenas Admins da empresa podem excluir processos
CREATE POLICY "Apenas Admins podem deletar processos"
ON public.customs_processes
FOR DELETE
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND 
    'Admin' = (SELECT role FROM public.profiles WHERE id = auth.uid())
);


-- 4. Politicas para Auditorias e Logs (audit_logs)
CREATE POLICY "Ver registros de auditoria da empresa"
ON public.audit_logs
FOR SELECT
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Gravar logs de auditoria da empresa"
ON public.audit_logs
FOR INSERT
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));


-- =====================================================================
-- LOGICA COM GATILHO (TRIGGER): AUTO-CRIACAO DE PERFIL NO CADASTRO
-- =====================================================================
-- Esse script cria um gatilho de seguranca no Postgres. Sempre que um usuario se cadastrar
-- pelo Supabase Auth (no login da tela da empresa), o Supabase cria automaticamente
-- o perfil em public.profiles por baixo dos panos.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_company_id UUID;
    comp_name TEXT;
BEGIN
    -- Captura o nome da empresa vindo do metadata do cadastro ou cria uma nova empresa padrao
    comp_name := COALESCE(new.raw_user_meta_data->>'company_name', 'Agência Aduaneira Padrão');
    
    -- Verifica se já existe uma empresa com esse nome, ou cria
    INSERT INTO public.companies (name)
    VALUES (comp_name)
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO default_company_id FROM public.companies WHERE name = comp_name LIMIT 1;
    
    -- Se nao achar por conflito, pega a primeira disponivel ou gera uma padrão
    IF default_company_id IS NULL THEN
        INSERT INTO public.companies (name) VALUES ('Agência Global Import/Export') RETURNING id INTO default_company_id;
    END IF;

    -- Cria o perfil publico para o usuario autenticado
    INSERT INTO public.profiles (id, company_id, full_name, role)
    VALUES (
        new.id,
        default_company_id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Analista Aduaneiro'),
        COALESCE(new.raw_user_meta_data->>'role', 'Operacional')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativar o Trigger sempre que uma linha for criada na tabela padrao do Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =====================================================================
-- DADOS INICIAIS EXEMPLO (OPCIONAL PARA ATIVACAO)
-- =====================================================================
-- Note: O gatilho handle_new_user garante automacao quando subir em producao.
-- Para os dados estáticos funcionarem, as tabelas estao perfeitamente preparadas!
