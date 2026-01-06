# Sistema de Níveis de Acesso - Apice CRM

## 📋 Visão Geral

Este documento descreve como implementar um sistema de níveis de acesso (roles/permissions) no Apice CRM para controlar o que cada usuário pode fazer no sistema.

## 🎯 Níveis de Acesso Propostos

### 1. **Super Admin** (Nível 0)
- Acesso total ao sistema
- Pode gerenciar todos os usuários
- Pode acessar todas as configurações
- Pode ver dados de todos os usuários

### 2. **Admin** (Nível 1)
- Pode gerenciar leads próprios e da equipe
- Pode acessar relatórios gerais
- Pode configurar integrações
- Não pode gerenciar usuários

### 3. **Gerente** (Nível 2)
- Pode ver leads da equipe
- Pode ver relatórios da equipe
- Pode editar leads da equipe
- Não pode acessar configurações avançadas

### 4. **Vendedor** (Nível 3)
- Pode ver apenas seus próprios leads
- Pode criar e editar seus leads
- Pode ver seus próprios relatórios
- Acesso limitado

### 5. **Visualizador** (Nível 4)
- Apenas leitura
- Pode ver leads atribuídos
- Não pode editar ou criar
- Acesso muito limitado

## 🗄️ Estrutura do Banco de Dados

### Tabela: `user_roles`

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_level INTEGER NOT NULL DEFAULT 3, -- 0=Super Admin, 1=Admin, 2=Gerente, 3=Vendedor, 4=Visualizador
  role_name TEXT NOT NULL, -- 'super_admin', 'admin', 'gerente', 'vendedor', 'visualizador'
  permissions JSONB DEFAULT '{}', -- Permissões customizadas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_level ON user_roles(role_level);
```

### Tabela: `team_members` (Opcional - para hierarquia de equipes)

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_leader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## 🔐 Permissões por Funcionalidade

### Dashboard
- **Super Admin/Admin**: Ver todos os dados
- **Gerente**: Ver dados da equipe
- **Vendedor/Visualizador**: Ver apenas próprios dados

### Leads
- **Criar**: Super Admin, Admin, Gerente, Vendedor
- **Editar Próprios**: Todos (exceto Visualizador)
- **Editar da Equipe**: Super Admin, Admin, Gerente
- **Deletar**: Super Admin, Admin, Gerente
- **Ver Todos**: Super Admin, Admin, Gerente
- **Ver Próprios**: Todos

### Configurações
- **Acessar**: Super Admin, Admin
- **Editar**: Super Admin, Admin

### Relatórios
- **Ver Todos**: Super Admin, Admin
- **Ver da Equipe**: Gerente
- **Ver Próprios**: Vendedor, Visualizador

### Integrações
- **Configurar**: Super Admin, Admin
- **Ver**: Gerente (somente leitura)

### Usuários
- **Gerenciar**: Apenas Super Admin

## 💻 Implementação no Código

### 1. Criar Context de Permissões

```javascript
// src/contexts/PermissionsContext.jsx
import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';

const PermissionsContext = createContext();

export const usePermissions = () => useContext(PermissionsContext);

export const PermissionsProvider = ({ children }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    setUserRole(data || { role_level: 3, role_name: 'vendedor' });
    setLoading(false);
  };

  const hasPermission = (requiredLevel) => {
    if (!userRole) return false;
    return userRole.role_level <= requiredLevel;
  };

  const canEditLead = (leadUserId) => {
    if (!userRole) return false;
    // Super Admin e Admin podem editar qualquer lead
    if (userRole.role_level <= 1) return true;
    // Gerente pode editar leads da equipe
    if (userRole.role_level === 2) {
      // Verificar se o lead pertence à equipe
      return true; // Implementar lógica de equipe
    }
    // Vendedor só pode editar seus próprios leads
    return leadUserId === user.id;
  };

  const canDeleteLead = (leadUserId) => {
    return userRole?.role_level <= 2; // Super Admin, Admin, Gerente
  };

  const canAccessSettings = () => {
    return userRole?.role_level <= 1; // Super Admin, Admin
  };

  const canManageUsers = () => {
    return userRole?.role_level === 0; // Apenas Super Admin
  };

  const value = {
    userRole,
    loading,
    hasPermission,
    canEditLead,
    canDeleteLead,
    canAccessSettings,
    canManageUsers,
    isSuperAdmin: userRole?.role_level === 0,
    isAdmin: userRole?.role_level <= 1,
    isGerente: userRole?.role_level === 2,
    isVendedor: userRole?.role_level === 3,
    isVisualizador: userRole?.role_level === 4,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};
```

### 2. Componente de Proteção de Rota

```javascript
// src/components/common/ProtectedRoute.jsx
import { usePermissions } from '@/contexts/PermissionsContext';

export const ProtectedRoute = ({ 
  children, 
  requiredLevel, 
  fallback = null 
}) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!hasPermission(requiredLevel)) {
    return fallback || (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-red-500">Acesso Negado</h2>
        <p>Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  return children;
};
```

### 3. Hook para Filtrar Leads por Permissão

```javascript
// src/hooks/useLeadsWithPermissions.js
import { useMemo } from 'react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useLeadsWithPermissions = (leads) => {
  const { user } = useAuth();
  const { userRole, canEditLead, canDeleteLead } = usePermissions();

  const filteredLeads = useMemo(() => {
    if (!userRole) return [];
    
    // Super Admin e Admin veem todos
    if (userRole.role_level <= 1) {
      return leads;
    }
    
    // Gerente vê da equipe (implementar lógica de equipe)
    if (userRole.role_level === 2) {
      return leads; // Por enquanto retorna todos, implementar filtro de equipe
    }
    
    // Vendedor e Visualizador veem apenas próprios
    return leads.filter(lead => lead.user_id === user.id);
  }, [leads, userRole, user]);

  return {
    leads: filteredLeads,
    canEdit: canEditLead,
    canDelete: canDeleteLead,
  };
};
```

## 📝 Próximos Passos

1. ✅ Criar tabelas no Supabase
2. ✅ Implementar PermissionsContext
3. ✅ Adicionar proteção nas rotas
4. ✅ Atualizar queries para filtrar por permissão
5. ✅ Criar interface de gerenciamento de usuários (Super Admin)
6. ✅ Adicionar indicadores visuais de permissão
7. ✅ Testar todos os níveis de acesso

## 🔒 Segurança

- **Sempre validar permissões no backend** (Row Level Security no Supabase)
- **Nunca confiar apenas na validação do frontend**
- **Usar RLS policies no Supabase** para garantir segurança no banco

## 📚 Exemplo de RLS Policy

```sql
-- Exemplo: Leads só podem ser vistos pelo dono ou por usuários com nível adequado
CREATE POLICY "Leads visibility based on role"
ON leads FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role_level <= 2
  )
);
```

