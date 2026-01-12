import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const layouts = [
    { layoutid: 1, layoutname: 'Simple Header', layoutfilelocation: 'layouts/simple_header.html' },
    { layoutid: 2, layoutname: 'Card Style', layoutfilelocation: 'layouts/card.html' },
    { layoutid: 3, layoutname: 'Banner Poster', layoutfilelocation: 'layouts/banner.html' }
];

async function seed() {
    console.log('Seeding layouts...');

    for (const layout of layouts) {
        const { data, error } = await supabase
            .from('layout')
            .upsert(layout)
            .select();

        if (error) {
            console.error(`Error upserting layout ${layout.layoutid}:`, error);
        } else {
            console.log(`Layout ${layout.layoutid} seeded.`);
        }
    }

    console.log('Done.');
}

seed();
