import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL
});

export async function supabaseFetch(url: string, options: any = {}) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const tableName = pathParts[pathParts.length - 1];
    const method = (options.method || 'GET').toUpperCase();
    
    let query = '';
    const values: any[] = [];
    let paramIndex = 1;

    // Parse select
    let selectStr = '*';
    const selectParam = urlObj.searchParams.get('select');
    if (selectParam) {
      selectStr = selectParam.split(',').map(s => s.trim() === '*' ? '*' : `"${s.trim()}"`).join(', ');
    }

    // Parse where clauses
    const whereClauses: string[] = [];
    for (const [key, value] of urlObj.searchParams.entries()) {
      if (['select', 'order', 'limit'].includes(key)) continue;
      
      // Handle eq, gt, lt, etc.
      if (value.startsWith('eq.')) {
        whereClauses.push(`"${key}" = $${paramIndex++}`);
        values.push(value.replace('eq.', ''));
      } else if (value.startsWith('gte.')) {
        whereClauses.push(`"${key}" >= $${paramIndex++}`);
        values.push(value.replace('gte.', ''));
      } else if (value.startsWith('lte.')) {
        whereClauses.push(`"${key}" <= $${paramIndex++}`);
        values.push(value.replace('lte.', ''));
      } else if (key === 'or') {
        // Simple OR parsing: or=(phone.eq.123,email.eq.abc)
        const inner = value.match(/\((.*?)\)/);
        if (inner && inner[1]) {
          const parts = inner[1].split(',');
          const orClauses = parts.map(p => {
            const [k, op, v] = p.split('.');
            if (op === 'eq') {
              values.push(v.replace(/"/g, ''));
              return `"${k}" = $${paramIndex++}`;
            }
            if (op === 'cs') {
              // cs stands for contains in array/jsonb
              values.push(v);
              return `"${k}" @> $${paramIndex++}`;
            }
            return '';
          }).filter(Boolean);
          if (orClauses.length > 0) {
            whereClauses.push(`(${orClauses.join(' OR ')})`);
          }
        }
      } else if (value.includes('eq.')) {
          // fallback
          whereClauses.push(`"${key}" = $${paramIndex++}`);
          values.push(value.replace('eq.', ''));
      }
    }

    let whereStr = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';

    if (method === 'GET') {
      let orderStr = '';
      const orderParam = urlObj.searchParams.get('order');
      if (orderParam) {
        const [col, dir] = orderParam.split('.');
        orderStr = ` ORDER BY "${col}" ${dir === 'desc' ? 'DESC' : 'ASC'}`;
      }
      
      let limitStr = '';
      const limitParam = urlObj.searchParams.get('limit');
      if (limitParam) {
        limitStr = ` LIMIT ${parseInt(limitParam)}`;
      }

      query = `SELECT ${selectStr} FROM "${tableName}"${whereStr}${orderStr}${limitStr}`;
      
    } else if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const keys = Object.keys(body);
      const vals = Object.values(body);
      
      const colStr = keys.map(k => `"${k}"`).join(', ');
      const valStr = vals.map(() => `$${paramIndex++}`).join(', ');
      values.push(...vals);
      
      // Prefer: resolution=merge-duplicates translates to ON CONFLICT DO UPDATE
      const prefer = options.headers?.['Prefer'] || options.headers?.['prefer'];
      let conflictStr = '';
      if (prefer === 'resolution=merge-duplicates') {
        // Get primary key for this table (naive approach: assume id or phone)
        const pk = keys.includes('id') ? 'id' : (keys.includes('phone') ? 'phone' : (keys.includes('device_id') ? 'device_id' : keys[0]));
        const updateSets = keys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
        conflictStr = ` ON CONFLICT ("${pk}") DO UPDATE SET ${updateSets}`;
      }
      
      query = `INSERT INTO "${tableName}" (${colStr}) VALUES (${valStr})${conflictStr} RETURNING *`;
      
    } else if (method === 'PATCH') {
      const body = JSON.parse(options.body || '{}');
      const keys = Object.keys(body);
      const vals = Object.values(body);
      
      const setStr = keys.map(k => `"${k}" = $${paramIndex++}`).join(', ');
      values.push(...vals);
      
      query = `UPDATE "${tableName}" SET ${setStr}${whereStr} RETURNING *`;
      
    } else if (method === 'DELETE') {
      query = `DELETE FROM "${tableName}"${whereStr} RETURNING *`;
    }

    // Execute query
    const res = await pool.query(query, values);

    // Format response to match fetch
    return {
      ok: true,
      status: 200,
      json: async (): Promise<any> => res.rows,
      text: async () => JSON.stringify(res.rows)
    };

  } catch (error) {
    console.error('supabaseFetch Error:', error);
    return {
      ok: false,
      status: 500,
      json: async (): Promise<any> => ({ error: error, message: error instanceof Error ? error.message : 'Unknown error' }),
      text: async () => 'Internal Server Error'
    };
  }
}
