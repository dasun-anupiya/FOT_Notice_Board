import { supabase } from '../db/supabaseClient.js';

// Helper to group data
const groupBy = (array, key) => {
    return array.reduce((result, currentValue) => {
        (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
        return result;
    }, {});
};

// Helper to safely get property regardless of case
const getProp = (obj, key) => {
    if (!obj) return undefined;
    if (obj[key] !== undefined) return obj[key];
    if (obj[key.toLowerCase()] !== undefined) return obj[key.toLowerCase()];
    if (obj[key.toUpperCase()] !== undefined) return obj[key.toUpperCase()];
    // Try PascalCase
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    if (obj[pascal] !== undefined) return obj[pascal];
    return undefined;
};

// 1. User Reports

// 1.1 Users by Type and Department
export async function getUsersByType(req, res, next) {
    try {
        // Try to fetch from 'user' or 'User' table
        const { data, error } = await supabase
            .from('user') // Try lowercase first
            .select('*');

        if (error) {
            // Fallback to 'User'
            const { data: data2, error: error2 } = await supabase.from('User').select('*');
            if (error2) throw error2;
            processUsers(data2, res);
            return;
        }

        processUsers(data, res);

    } catch (err) {
        next(err);
    }
}

function processUsers(data, res) {
    const stats = {};
    data.forEach(user => {
        const type = getProp(user, 'UserType') || getProp(user, 'usertype') || 'Unknown';
        const dept = getProp(user, 'Department') || 'None';

        if (!stats[type]) stats[type] = {};
        if (!stats[type][dept]) stats[type][dept] = 0;
        stats[type][dept]++;
    });
    res.json(stats);
}

// 1.2 Recently Registered Users
export async function getRecentUsers(req, res, next) {
    try {
        let query = supabase.from('user').select('*').order('createdtimestamp', { ascending: false }).limit(20);
        let { data, error } = await query;

        if (error) {
            query = supabase.from('User').select('*').order('createdtimestamp', { ascending: false }).limit(20);
            const result = await query;
            data = result.data;
            error = result.error;
        }

        if (error) throw error;

        // Normalize keys
        const normalized = data.map(u => ({
            UserID: getProp(u, 'UserID'),
            UniversityEmail: getProp(u, 'UniversityEmail'),
            UserType: getProp(u, 'UserType'),
            CreatedTimestamp: getProp(u, 'createdtimestamp')
        }));

        res.json(normalized);
    } catch (err) {
        next(err);
    }
}

// 1.3 Inactive Users (No Recent Updates > 90 days)
export async function getInactiveUsers(req, res, next) {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        let { data, error } = await supabase
            .from('user')
            .select('*') // Select all to avoid column name errors
            .lt('lastupdatedtimestamp', ninetyDaysAgo.toISOString());

        if (error) {
            const result = await supabase
                .from('User')
                .select('*')
                .lt('lastupdatedtimestamp', ninetyDaysAgo.toISOString());
            data = result.data;
            error = result.error;
        }

        if (error) throw error;

        const normalized = data.map(u => ({
            UserID: getProp(u, 'UserID'),
            UniversityEmail: getProp(u, 'UniversityEmail'),
            LastUpdated: getProp(u, 'lastupdatedtimestamp')
        }));

        res.json(normalized);
    } catch (err) {
        next(err);
    }
}

// 2. Notice Reports

// 2.1 Notices by Status
export async function getNoticeStats(req, res, next) {
    try {
        let { data, error } = await supabase.from('notice').select('*');

        if (error) {
            const result = await supabase.from('Notice').select('*');
            data = result.data;
            error = result.error;
        }

        if (error) throw error;

        const stats = {};
        data.forEach(n => {
            const status = getProp(n, 'Status') || 'Unknown';
            stats[status] = (stats[status] || 0) + 1;
        });

        res.json(stats);
    } catch (err) {
        next(err);
    }
}

// 2.2 Active Notices
export async function getActiveNotices(req, res, next) {
    try {
        const now = new Date().toISOString();
        const today = now.split('T')[0];

        // Status might be case sensitive in query, so fetch all and filter JS side if safe, or rely on lowercase column
        // Standard column is 'status', standard value 'Published'
        let { data, error } = await supabase
            .from('notice')
            .select('*')
            .eq('status', 'Published')
            .lte('startdate', today)
            .gte('enddate', today);

        if (error) {
            // Try PascalCase columns
            const result = await supabase
                .from('Notice')
                .select('*')
                .eq('Status', 'Published')
                .lte('StartDate', today)
                .gte('EndDate', today);
            data = result.data;
            error = result.error;
        }

        if (error) throw error;

        res.json(data);
    } catch (err) {
        next(err);
    }
}

// 2.3 Notices by Creator
export async function getNoticesByCreator(req, res, next) {
    try {
        // fetch notices and users separately
        const { data: notices } = await supabase.from('notice').select('*')
            .then(r => r.error ? supabase.from('Notice').select('*') : r);

        const { data: users } = await supabase.from('user').select('*')
            .then(r => r.error ? supabase.from('User').select('*') : r);

        if (notices && users) {
            const stats = {};
            notices.forEach(n => {
                const uid = getProp(n, 'userid');
                const u = users.find(u => getProp(u, 'userid') === uid);
                const email = getProp(u, 'UniversityEmail') || 'Unknown';
                stats[email] = (stats[email] || 0) + 1;
            });
            const sorted = Object.entries(stats).map(([email, count]) => ({ email, count })).sort((a, b) => b.count - a.count);
            return res.json(sorted);
        }

        res.json([]);
    } catch (err) {
        next(err);
    }
}

// 3. Engagement Reports
export async function getEngagementStats(req, res, next) {
    try {
        // Fetch separately for safety
        const { data: responses } = await supabase.from('noticeresponse').select('*')
            .then(r => r.error ? supabase.from('NoticeResponse').select('*') : r);
        const { data: notices } = await supabase.from('notice').select('*')
            .then(r => r.error ? supabase.from('Notice').select('*') : r);
        const { data: users } = await supabase.from('user').select('*')
            .then(r => r.error ? supabase.from('User').select('*') : r);

        if (!responses || !notices || !users) {
            // Return empty if any fail, or partial
            return res.json({ notices: [], users: [] });
        }

        const noticeStatsObj = {};
        const userStatsObj = {};

        responses.forEach(r => {
            const nid = getProp(r, 'noticeid');
            const uid = getProp(r, 'userid');

            const n = notices.find(x => getProp(x, 'noticeid') === nid);
            const u = users.find(x => getProp(x, 'userid') === uid);

            const nTitle = getProp(n, 'title') || `Notice ${nid}`;
            noticeStatsObj[nTitle] = (noticeStatsObj[nTitle] || 0) + 1;

            const uEmail = getProp(u, 'universityemail') || 'Unknown';
            userStatsObj[uEmail] = (userStatsObj[uEmail] || 0) + 1;
        });

        const noticeStats = Object.entries(noticeStatsObj)
            .map(([title, count]) => ({ title, count }))
            .sort((a, b) => b.count - a.count);

        const userStats = Object.entries(userStatsObj)
            .map(([email, count]) => ({ email, count }))
            .sort((a, b) => b.count - a.count);

        res.json({ notices: noticeStats, users: userStats });
    } catch (err) {
        next(err);
    }
}

// 4 & 5. Polls
export async function getPollReport(req, res, next) {
    try {
        const { data: polls } = await supabase.from('poll').select('*')
            .then(r => r.error ? supabase.from('Poll').select('*') : r);

        const { data: responses } = await supabase.from('pollresponse').select('*')
            .then(r => r.error ? supabase.from('PollResponse').select('*') : r);

        if (!polls) throw new Error("Failed to fetch polls");

        // 4.1 Status
        const statusStats = {};
        polls.forEach(p => {
            const s = getProp(p, 'status') || 'Unknown';
            statusStats[s] = (statusStats[s] || 0) + 1;
        });

        // 5.1 Participation per poll
        const participation = {};
        if (responses) {
            responses.forEach(r => {
                const pid = getProp(r, 'pollid');
                participation[pid] = (participation[pid] || 0) + 1;
            });
        }

        const pollParticipation = polls.map(p => {
            const pid = getProp(p, 'pollid');
            return {
                id: pid,
                question: getProp(p, 'question'),
                responses: participation[pid] || 0
            };
        }).sort((a, b) => b.responses - a.responses);

        res.json({ status: statusStats, participation: pollParticipation });
    } catch (err) {
        next(err);
    }
}

// 7. System Summary
export async function getSystemSummary(req, res, next) {
    try {
        const getCount = async (primary, secondary) => {
            // Try primary
            let { count, error } = await supabase.from(primary).select('*', { count: 'exact', head: true });
            if (!error && count !== null) return count;

            // Try secondary
            if (secondary) {
                let res = await supabase.from(secondary).select('*', { count: 'exact', head: true });
                if (!res.error && res.count !== null) return res.count;
            }

            // Log failure
            console.warn(`Failed to get count for ${primary}/${secondary}:`, error?.message);
            return 0;
        };

        // Based on debug probe: 'user' failed, so 'User' (PascalCase) or '"User"' likely correct
        // 'Notice' worked.
        const userCount = await getCount('User', 'user');
        const noticeCount = await getCount('Notice', 'notice');
        const pollCount = await getCount('Poll', 'poll');
        const responseCount = await getCount('NoticeResponse', 'noticeresponse');

        res.json({
            users: userCount,
            notices: noticeCount,
            polls: pollCount,
            responses: responseCount
        });
    } catch (err) {
        next(err);
    }
}
