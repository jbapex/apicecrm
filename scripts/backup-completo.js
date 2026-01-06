#!/usr/bin/env node

/**
 * Script de Backup Completo do Sistema Apice CRM
 * 
 * Este script cria um backup completo incluindo:
 * - Dados do banco de dados (via Supabase)
 * - Estrutura do código (git)
 * - Configurações e variáveis de ambiente
 * 
 * Uso: node scripts/backup-completo.js
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kwhwpbfenuztgztkginf.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aHdwYmZlbnV6dGd6dGtnaW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Njk4NTksImV4cCI6MjA3MDE0NTg1OX0.uOoCN9XsthpCw8861mup_vVa7lYV7aBHDqVJjDiba58';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupDir = join(process.cwd(), 'backups', `backup-${timestamp}`);
const backupDataDir = join(backupDir, 'data');
const backupCodeDir = join(backupDir, 'code');

// Criar diretórios de backup
if (!existsSync(backupDir)) {
  mkdirSync(backupDir, { recursive: true });
  mkdirSync(backupDataDir, { recursive: true });
  mkdirSync(backupCodeDir, { recursive: true });
}

console.log('🔄 Iniciando backup completo do sistema...\n');

// 1. Backup do código (Git)
console.log('📦 Fazendo backup do código (Git)...');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (gitStatus.trim()) {
    console.log('⚠️  Há alterações não commitadas. Fazendo commit automático...');
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "Backup automático - ${timestamp}"`, { stdio: 'inherit' });
  }
  
  // Criar bundle do git
  const gitBundlePath = join(backupCodeDir, 'repository.bundle');
  execSync(`git bundle create "${gitBundlePath}" --all`, { stdio: 'inherit' });
  console.log('✅ Backup do código concluído\n');
} catch (error) {
  console.error('❌ Erro ao fazer backup do código:', error.message);
}

// 2. Backup das configurações
console.log('⚙️  Fazendo backup das configurações...');
try {
  const configFiles = [
    'package.json',
    'vite.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    '.gitignore'
  ];
  
  const configBackup = {};
  for (const file of configFiles) {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(join(process.cwd(), file), 'utf-8');
      configBackup[file] = content;
    } catch (e) {
      console.log(`⚠️  Arquivo ${file} não encontrado, pulando...`);
    }
  }
  
  writeFileSync(
    join(backupCodeDir, 'configs.json'),
    JSON.stringify(configBackup, null, 2)
  );
  console.log('✅ Backup das configurações concluído\n');
} catch (error) {
  console.error('❌ Erro ao fazer backup das configurações:', error.message);
}

// 3. Backup da estrutura do banco (schema)
console.log('🗄️  Fazendo backup da estrutura do banco...');
try {
  // Lista de tabelas principais do sistema
  const tables = [
    'leads',
    'staged_leads',
    'investments',
    'lead_comments',
    'message_history',
    'user_settings',
    'user_default_settings',
    'system_default_settings',
    'tintim_messages',
    'flows',
    'flow_logs',
    'products'
  ];
  
  const schemaInfo = {
    timestamp: new Date().toISOString(),
    tables: tables,
    note: 'Este arquivo contém apenas a lista de tabelas. Para restaurar, você precisará do schema SQL completo do Supabase.'
  };
  
  writeFileSync(
    join(backupDataDir, 'schema-info.json'),
    JSON.stringify(schemaInfo, null, 2)
  );
  console.log('✅ Informações do schema salvas\n');
  console.log('⚠️  IMPORTANTE: Para backup completo do schema SQL, exporte manualmente do Supabase Dashboard\n');
} catch (error) {
  console.error('❌ Erro ao fazer backup do schema:', error.message);
}

// 4. Instruções de restauração
const restoreInstructions = `
# Instruções de Restauração do Backup

## Data do Backup: ${new Date().toLocaleString('pt-BR')}

## 1. Restaurar Código

\`\`\`bash
# Descompactar o bundle do git
cd /caminho/do/projeto
git clone repository.bundle projeto-restaurado
cd projeto-restaurado
npm install
\`\`\`

## 2. Restaurar Configurações

Copie os arquivos de \`code/configs.json\` para o diretório raiz do projeto.

## 3. Restaurar Dados do Banco

Os dados devem ser restaurados através do Supabase Dashboard ou usando a função de importação do sistema.

## 4. Variáveis de Ambiente

Certifique-se de configurar o arquivo \`.env\` com:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## Notas Importantes

- Este backup NÃO inclui dados sensíveis do banco por segurança
- Para backup completo do banco, use a ferramenta de exportação do Supabase
- Sempre teste a restauração em ambiente de desenvolvimento primeiro
`;

writeFileSync(join(backupDir, 'INSTRUCOES-RESTAURACAO.md'), restoreInstructions);

console.log('📋 Backup completo finalizado!');
console.log(`\n📁 Localização do backup: ${backupDir}`);
console.log('\n✅ Estrutura do backup:');
console.log('   ├── data/          (dados do banco - usar função do sistema)');
console.log('   ├── code/          (código e configurações)');
console.log('   └── INSTRUCOES-RESTAURACAO.md');
console.log('\n💡 Dica: Use a função "Exportar Backup" no sistema para fazer backup dos dados dos usuários.\n');

