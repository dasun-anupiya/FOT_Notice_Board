// import fetch from 'node-fetch'; // Using native fetch

const API_URL = 'http://localhost:4000/api/polls';
const LOGIN_URL = 'http://localhost:4000/api/users/login';

async function loginAdmin() {
    const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ UniversityEmail: 'admin@example.com', Password: 'Password123' })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data.token;
}

async function getPolls(token) {
    const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    return data;
}

async function approvePoll(token, pollId) {
    const response = await fetch(`${API_URL}/${pollId}/action`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'publish' }) // Publish directly
    });
    const data = await response.json();
    console.log(`Poll ${pollId} published:`, data);
}

async function main() {
    try {
        const token = await loginAdmin();
        console.log('Admin logged in');

        const polls = await getPolls(token);

        if (!Array.isArray(polls)) {
            console.error('Polls is not an array:', polls);
            return;
        }

        console.log(`Found ${polls.length} polls`);

        for (const poll of polls) {
            const status = poll.Status || poll.status;
            const id = poll.PollID || poll.pollid || poll.poll_id || poll.id;

            if (status !== 'Published') {
                console.log(`Approving/Publishing poll ${id} (Status: ${status})`);
                await approvePoll(token, id);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
