const { Client } = require('pg');

const client = new Client({
  host: 'db.gthtvpujwukbfgokghne.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'BThhbtySBLX43Zc2',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    await client.connect();
    
    // Verificar triggers na tabela emissoes
    const triggers = await client.query(`
      SELECT tgname, tgenabled, pg_get_triggerdef(oid) as definition
      FROM pg_trigger 
      WHERE tgrelid = 'emissoes'::regclass
    `);
    console.log('Triggers:');
    triggers.rows.forEach(t => console.log(`  - ${t.tgname}: ${t.tgenabled}`));
    
    // Verificar constraints
    const constraints = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'emissoes'::regclass
    `);
    console.log('\nConstraints:');
    constraints.rows.forEach(c => {
      const type = c.contype === 'p' ? 'PRIMARY KEY' : c.contype === 'f' ? 'FOREIGN KEY' : c.contype === 'u' ? 'UNIQUE' : c.contype;
      console.log(`  - ${c.conname} (${type})`);
    });
    
    // Tentar inserir uma emissão de teste
    console.log('\n--- Teste de INSERT ---');
    try {
      await client.query('BEGIN');
      const result = await client.query(`
        INSERT INTO emissoes (
          numero_emissao, volume, nome_operacao, status, 
          demandante_proposta, empresa_destinataria, oferta
        ) VALUES (
          'TEST-001', 100000, 'Teste', 'rascunho',
          'Teste', 'Teste', 'Teste'
        ) RETURNING id
      `);
      await client.query('ROLLBACK');
      console.log('✅ INSERT de teste funcionou:', result.rows[0].id);
    } catch (e) {
      await client.query('ROLLBACK');
      console.log('❌ INSERT falhou:', e.message);
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
