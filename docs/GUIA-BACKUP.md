# 🔄 Guia de Backup - Apice CRM

## ⚠️ IMPORTANTE: Faça backup ANTES de qualquer mudança!

Este guia mostra como fazer backup completo do sistema antes de implementar níveis de acesso ou outras mudanças importantes.

## 📋 Métodos de Backup

### Método 1: Backup pelo Sistema (Recomendado para Dados)

1. **Acesse o sistema** e faça login
2. **Vá em Configurações** (ícone de engrenagem)
3. **Clique em "Exportar Backup"** na seção "Gerenciamento de Dados"
4. **Aguarde o download** do arquivo JSON
5. **Guarde o arquivo em local seguro**

O arquivo terá o formato: `apice_crm_backup_YYYY-MM-DD_[user-id].json`

**Este backup inclui:**
- ✅ Todos os leads
- ✅ Leads na caixa de entrada (staged_leads)
- ✅ Investimentos semanais
- ✅ Comentários dos leads
- ✅ Histórico de mensagens
- ✅ Configurações do usuário
- ✅ Templates salvos
- ✅ Produtos cadastrados
- ✅ Fluxos de automação
- ✅ Logs de fluxos

### Método 2: Backup do Código (Git)

```bash
# 1. Certifique-se de que todas as mudanças estão commitadas
git status

# 2. Se houver mudanças, faça commit
git add .
git commit -m "Backup antes de implementar níveis de acesso"

# 3. Crie uma tag de backup
git tag -a backup-pre-niveis-acesso -m "Backup antes de implementar sistema de níveis de acesso"

# 4. Envie para o GitHub
git push origin main
git push origin backup-pre-niveis-acesso

# 5. (Opcional) Crie um bundle completo
git bundle create backup-completo.bundle --all
```

### Método 3: Backup do Banco de Dados (Supabase)

1. **Acesse o Supabase Dashboard**
2. **Vá em Database > Backups**
3. **Crie um backup manual** ou aguarde o backup automático diário
4. **Exporte o schema SQL** (Database > SQL Editor > Export Schema)

### Método 4: Backup Completo (Script)

```bash
# Execute o script de backup completo
node scripts/backup-completo.js
```

Este script cria:
- 📦 Backup do código (Git bundle)
- ⚙️ Backup das configurações
- 📋 Informações do schema
- 📝 Instruções de restauração

## 🔍 Verificação do Backup

Antes de prosseguir, verifique:

- [ ] Arquivo JSON de backup baixado
- [ ] Código commitado e enviado ao GitHub
- [ ] Tag de backup criada
- [ ] Backup do Supabase disponível (se possível)
- [ ] Arquivo de backup guardado em local seguro

## 📦 Onde Guardar o Backup

**Recomendações:**
1. **Local**: Pasta segura no seu computador
2. **Nuvem**: Google Drive, Dropbox, OneDrive
3. **GitHub**: Repositório privado ou release
4. **Servidor**: Backup remoto (se disponível)

## 🔄 Restauração do Backup

### Restaurar Dados do Sistema

1. Acesse **Configurações > Gerenciamento de Dados**
2. Use a função de **Importar** (quando disponível)
3. Ou restaure manualmente via Supabase Dashboard

### Restaurar Código

```bash
# Se você criou uma tag
git checkout backup-pre-niveis-acesso

# Se você criou um bundle
git clone backup-completo.bundle projeto-restaurado
cd projeto-restaurado
npm install
```

## ⚠️ Checklist Antes de Implementar Níveis de Acesso

- [ ] ✅ Backup dos dados feito (JSON)
- [ ] ✅ Código commitado e enviado ao GitHub
- [ ] ✅ Tag de backup criada
- [ ] ✅ Backup guardado em local seguro
- [ ] ✅ Testado em ambiente de desenvolvimento (se possível)

## 📞 Em Caso de Problemas

Se algo der errado durante a implementação:

1. **NÃO ENTRE EM PÂNICO**
2. **Pare todas as mudanças**
3. **Restaure o backup do código** (git checkout)
4. **Verifique os dados no Supabase**
5. **Se necessário, restaure os dados do backup JSON**

## 📝 Notas Importantes

- ⚠️ **SEMPRE faça backup antes de mudanças importantes**
- ⚠️ **Teste em ambiente de desenvolvimento primeiro**
- ⚠️ **Mantenha múltiplas cópias do backup**
- ⚠️ **Verifique a integridade do backup antes de usar**

---

**Data do último backup recomendado:** Antes de implementar níveis de acesso
**Próximo backup:** Após implementação bem-sucedida

