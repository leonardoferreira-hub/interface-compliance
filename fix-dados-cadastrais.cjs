const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gthtvpujwukbfgokghne.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aHR2cHVqd3VrYmZnb2tnaG5lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcwNTgyNiwiZXhwIjoyMDgzMjgxODI2fQ.a0jJvZ4-QD6D5D4Z8D5Z8D5Z8D5Z8'
);

async function main() {
  // Verificar colunas atuais
  const { data, error } = await supabase.from('investidores').select('*').limit(1);
  
  if (error) {
    console.log('Erro ao consultar:', error.message);
  } else {
    console.log('Colunas existentes:', data.length > 0 ? Object.keys(data[0]) : 'tabela vazia');
  }
}

main();
