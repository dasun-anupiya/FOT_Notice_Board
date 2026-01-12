
import { supabase } from './src/db/supabaseClient.js';

async function inspectPolls() {
    console.log('--- Inspecting Polls ---');

    // Try lowercase first (seems consistent with previous logs)
    const { data: polls, error } = await supabase.from('poll').select('pollid, status, question');

    if (error || !polls) {
        // Try PascalCase
        const { data: pollsUpper, error: errorUpper } = await supabase.from('Poll').select('PollID, Status, Question');
        if (errorUpper) {
            console.error('Error:', errorUpper.message);
        } else {
            console.log('Polls (Poll):');
            pollsUpper.forEach(p => console.log(`ID: ${p.PollID}, Status: '${p.Status}', Question: ${p.Question}`));
        }
    } else {
        console.log('Polls (poll):');
        polls.forEach(p => console.log(`ID: ${p.pollid}, Status: '${p.status}', Question: ${p.question}`));
    }
    console.log('--- End Inspection ---');
}

inspectPolls();
