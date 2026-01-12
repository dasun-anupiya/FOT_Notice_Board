
import { supabase } from './src/db/supabaseClient.js';

async function checkPollStatus() {
    console.log('Checking poll statuses...');

    const { data: polls, error } = await supabase.from('Poll').select('PollID, Question, Status, status, WhoCanResponse, StartDate, EndDate');

    if (error) {
        // Try lowercase table
        const { data: pollsLower, error: errorLower } = await supabase.from('poll').select('pollid, question, status, whocanresponse, startdate, enddate');
        if (errorLower) {
            console.error('Error fetching polls:', errorLower);
        } else {
            console.log('Polls (lowercase table):', JSON.stringify(pollsLower, null, 2));
        }
    } else {
        console.log('Polls (PascalCase table):', JSON.stringify(polls, null, 2));
    }
}

checkPollStatus();
