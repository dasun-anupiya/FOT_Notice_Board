// import fetch from 'node-fetch'; // Using native fetch

const API_URL = 'http://localhost:4000/api/users';

async function registerUser(user) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`Successfully registered ${user.UserType}: ${user.UniversityEmail}`);
            return data;
        } else {
            console.error(`Failed to register ${user.UserType}:`, data.message);
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function main() {
    // Register Admin
    await registerUser({
        UniversityEmail: 'admin@example.com',
        Password: 'Password123',
        UserType: 'Admin',
        Department: 'IAT',
        Designation: 'Administrator'
    });

    // Register Student
    await registerUser({
        UniversityEmail: 'student@example.com',
        Password: 'Password123',
        UserType: 'Student',
        Department: 'IAT',
        Batch: '2024'
    });
}

main();
