
import { supabase } from './src/db/supabaseClient.js';

async function publishPolls() {
    console.log('Publishing all polls...');

    // Try PascalCase
    const { data, error } = await supabase
        .from('Poll')
        .update({ Status: 'Published' })
        .neq('Status', 'Published')
        .select();

    if (error) {
        // Try lowercase
        const { data: dataLower, error: errorLower } = await supabase
            .from('poll')
            .update({ status: 'Published' })
            .neq('status', 'Published')
            .select();

        if (errorLower) {
            console.error('Error updating polls:', errorLower.message);
        } else {
            console.log(`Updated ${dataLower.length} polls to Published (lowercase table).`);
        }
    } else {
        console.log(`Updated ${data.length} polls to Published (PascalCase table).`);
    }
}

publishPolls();
