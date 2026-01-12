<?php
// Configuration
$supabaseUrl = 'https://eytqcpbvmceyoccnvkqu.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dHFjcGJ2bWNleW9jY252a3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIxNTA1NSwiZXhwIjoyMDgzNzkxMDU1fQ.93Kg9mQBkrR1GF3D988r11Qs3s1Gct-uobJA3RmasGA';

$message = '';
$success = false;

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $department = $_POST['department'] ?? null;
    $designation = $_POST['designation'] ?? '';
    
    if (empty($email) || empty($password)) {
        $message = 'Email and password are required.';
    } else {
        // Hash the password
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        
        // Prepare data for Supabase
        $userData = [
            'universityemail' => $email,
            'usertype' => 'Admin',
            'department' => $department ?: null,
            'designation' => $designation ?: null,
            'batch' => null,
            'passwordhash' => $passwordHash
        ];
        
        // Make API request to Supabase
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/User');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($userData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'apikey: ' . $supabaseKey,
            'Authorization: Bearer ' . $supabaseKey,
            'Prefer: return=representation'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            $success = true;
            $message = 'Admin user created successfully!';
            $responseData = json_decode($response, true);
            if ($responseData && isset($responseData[0]['userid'])) {
                $message .= ' User ID: ' . $responseData[0]['userid'];
            }
        } else {
            $message = 'Error creating user. HTTP Code: ' . $httpCode;
            $errorData = json_decode($response, true);
            if ($errorData && isset($errorData['message'])) {
                $message .= ' - ' . $errorData['message'];
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Admin User - Test Page</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            width: 100%;
            max-width: 500px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
            font-size: 14px;
        }
        input, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        input:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }
        .required {
            color: #e74c3c;
        }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        button:active {
            transform: translateY(0);
        }
        .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .info-box {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 12px;
            margin-top: 20px;
            border-radius: 4px;
            font-size: 13px;
            color: #1565C0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Create Admin User</h1>
        <p class="subtitle">Test page for creating admin users in Supabase</p>
        
        <?php if ($message): ?>
            <div class="message <?php echo $success ? 'success' : 'error'; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>
        
        <form method="POST">
            <div class="form-group">
                <label for="email">University Email <span class="required">*</span></label>
                <input type="email" id="email" name="email" required placeholder="admin@university.edu">
            </div>
            
            <div class="form-group">
                <label for="password">Password <span class="required">*</span></label>
                <input type="password" id="password" name="password" required placeholder="Enter secure password">
            </div>
            
            <div class="form-group">
                <label for="department">Department (Optional)</label>
                <input type="text" id="department" name="department" placeholder="e.g., Computer Science">
            </div>
            
            <div class="form-group">
                <label for="designation">Designation (Optional)</label>
                <input type="text" id="designation" name="designation" placeholder="e.g., System Administrator">
            </div>
            
            <button type="submit">Create Admin User</button>
        </form>
        
        <div class="info-box">
            <strong>Note:</strong> This is a test page. The password will be hashed using bcrypt before storing in the database. UserType is automatically set to 'Admin'.
        </div>
    </div>
</body>
</html>