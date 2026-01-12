import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function probe(tableName) {
    console.log(`\nProbing table: "${tableName}"`);
    try {
        const { count, error, data } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`Error: ${error.message}`);
        } else {
            console.log(`Count (head:true): ${count}`);
        }

        const { data: rows, error: rError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (rError) {
            console.log(`Select Error: ${rError.message}`);
        } else {
            console.log(`First row:`, rows && rows.length > 0 ? rows[0] : 'No rows');
            if (rows && rows.length > 0) {
                console.log('Keys:', Object.keys(rows[0]));
            }
        }

    } catch (e) {
        console.log(`Exception: ${e.message}`);
    }
}

async function main() {
    await probe('user');
    await probe('User');
    await probe('users');
    // Also check notice
    await probe('notice');
    await probe('Notice');
}

main();
