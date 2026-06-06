# Guia do Banco de Dados: Supabase & Vercel (Multi-Empresas)

Este documento explica como o banco de dados do seu sistema aduaneiro funciona atualmente, como estruturar o **Supabase** gratuitamente e como funciona a divisão segura entre várias empresas de importação e exportação simultâneas.

---

## 1. Como o Banco de Dados Funciona Atualmente?

No ambiente de desenvolvimento do **AI Studio**:
- O app armazena os dados localmente em arquivos JSON (`/data/processes.json` e `/data/logs.json`) gerenciados por um servidor **Express.js** (`server.ts`).
- **Problema no Vercel:** Quando você hospeda no Vercel, o sistema de arquivos dele é **"Efemero" (Read-Only)**. Isso significa que se você salvar um novo processo aduaneiro no JSON, esse dado sumirá assim que a função do servidor entrar em repouso (geralmente poucos minutos depois).
- **A Solução:** Integração com o **Supabase**. Ele atua como um banco de dados relacional (PostgreSQL) externo, gratuito e na nuvem, mantendo todos os processos e logs salvos a qualquer momento.

---

## 2. Como Funciona a Parte de Cada Empresa (Multi-Tenancy) e Login?

Para permitir que **várias empresas parceiras** utilizem o seu sistema com segurança, adotamos a arquitetura de **Multi-Tenancy por Nível de Linha**:

1. **Uma Tabela Global com separador:**
   Em vez de criar um banco de dados para cada empresa (o que seria caro e complexo), usamos apenas uma tabela chamada `customs_processes`. Cada linha de processo possui uma coluna obrigatória chamada `company_id`.

2. **Login Centralizado por Supabase Auth:**
   O Supabase oferece o serviço de autenticação gratuito pré-configurado. Quando um usuário faz login, o sistema detecta quem ele é e consulta o seu perfil (tabela `profiles`). 

3. **Row-Level Security (RLS) - Nenhuma empresa vê os dados de outra:**
   O PostgreSQL possui um recurso nativo de segurança avançada que ativamos no arquivo `supabase-setup.sql`. As regras dizem o seguinte:
   > *"Sempre que um usuário fizer um SELECT ou UPDATE na tabela de processos, retorne APENAS as linhas onde o `company_id` do processo é EXATAMENTE IGUAL ao `company_id` do usuário que está logado."*

Isso é feito diretamente dentro do banco de dados. Mesmo que um hacker tente acessar a API, o próprio banco de dados bloqueia o acesso cruzado de dados, garantindo privacidade militar para cada empresa que utilizar seu app.

---

## 3. Guia Prático - Como Configurar em 5 Minutos (Sem Código!)

Você não precisa escrever códigos complexos de banco de dados para iniciar. Siga estes passos simples:

### Passo 1: Criar sua Conta Gratuita no Supabase
1. Acesse o site do [Supabase](https://supabase.com/) e faça login usando sua conta do GitHub ou e-mail.
2. Clique em **New Project** (Novo Projeto).
3. Dê um nome ao seu projeto (ex: `Aduaneiro-Multi-Empresa`), crie uma senha forte para o banco de dados e selecione a região mais próxima (ex: `sa-east-1` de São Paulo para máxima velocidade).
4. Aguarde cerca de 1 a 2 minutos até que seu banco esteja pronto.

### Passo 2: Executar a Estrutura (SQL)
1. No menu lateral esquerdo do Supabase, clique no ícone **SQL Editor** (ícone de folha com terminal).
2. Clique em **New Query** (Nova consulta).
3. Abra o arquivo `supabase-setup.sql` que criamos na raiz do seu projeto, copie todo o seu conteúdo e cole-o no campo de texto do editor do Supabase.
4. Clique no botão azul **Run** (Executar) no canto inferior direito.
   - *Pronto! Em 2 segundos, todas as tabelas (`companies`, `profiles`, `customs_processes`, `audit_logs`), índices de busca e as regras rígidas de segurança (RLS) foram configurados automaticamente.*

### Passo 3: Configurar os Usuários no Visual
1. Para testar ou criar usuários, vá no menu **Authentication** no painel do Supabase.
2. Lá você pode gerenciar os logins das empresas diretamente por uma interface visual sem digitar nenhum código.
3. Você pode cadastrar os administradores e agentes de cada empresa, atribuindo nos metadados o nome da empresa correspondente.

---

## 4. Conectando no seu Código (Como Integrar)

Caso deseje ligar o seu frontend diretamente com o banco de dados Supabase na nuvem, substitua as consultas Mock/Locais pelo cliente oficial do Supabase:

```typescript
import { createClient } from '@supabase/supabase-js';

// URL e Chave pública que o Supabase fornece no painel Settings API
const supabaseUrl = 'SUA_SUPABASE_URL';
const supabaseKey = 'SUA_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// EXEMPLO: Buscar processos que pertencem apenas à empresa do usuário logado
async function carregarProcessos() {
  const { data, error } = await supabase
    .from('customs_processes')
    .select('*'); // O RLS garante que o usuário só baixa o que pertence à empresa dele!
    
  if (error) console.error(error);
  return data;
}
```

Dessa forma, seu aplicativo fica pronto para escala massiva global com o menor custo de infraestrutura possível!
