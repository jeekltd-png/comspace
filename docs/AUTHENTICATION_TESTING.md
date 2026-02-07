# Authentication Testing Guide

## Test User Credentials
- **Email:** owner@example.com
- **Password:** Password123!

## Manual Testing Steps

### 1. Test Registration
```bash
# Register a new user
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"Test123!","phoneNumber":"1234567890"}'
```

### 2. Test Login
```bash
# Login with credentials
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"john@example.com","password":"Test123!"}'
```

Expected Response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "...",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1..."
  }
}
```

### 3. Test Protected Route
```bash
# Get user profile (requires authentication)
$token = "YOUR_ACCESS_TOKEN_HERE"
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/profile" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"}
```

### 4. Test Logout
```bash
# Logout user
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/logout" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

## Frontend Testing

### 1. Access Login Page
Open browser: `http://localhost:3000/en/login`

### 2. Access Registration Page
Open browser: `http://localhost:3000/en/register`

### 3. Test Login Flow
1. Navigate to login page
2. Enter email: `john@example.com`
3. Enter password: `Test123!`
4. Click "Login"
5. Should redirect to homepage with user session

### 4. Test Registration Flow
1. Navigate to register page
2. Fill in all fields
3. Click "Register"
4. Should create account and log in automatically

### 5. Test Protected Pages
Try accessing: `http://localhost:3000/en/admin`
- Should redirect to login if not authenticated
- Should show dashboard if authenticated

## Automated Testing Script

Create a file `test-auth.ps1`:

```powershell
# Test Authentication Flow
Write-Host "Testing ComSpace Authentication..." -ForegroundColor Green

# 1. Register new user
Write-Host "`n1. Testing Registration..." -ForegroundColor Yellow
$registerResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"Test123!","phoneNumber":"1234567890"}' `
  -ErrorAction SilentlyContinue

if ($registerResponse.StatusCode -eq 201) {
    Write-Host "✓ Registration successful" -ForegroundColor Green
} else {
    Write-Host "✗ Registration failed" -ForegroundColor Red
}

# 2. Login with new user
Write-Host "`n2. Testing Login..." -ForegroundColor Yellow
$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"Test123!"}' `
  -ErrorAction SilentlyContinue

if ($loginResponse.StatusCode -eq 200) {
    Write-Host "✓ Login successful" -ForegroundColor Green
    $tokens = $loginResponse.Content | ConvertFrom-Json
    $accessToken = $tokens.data.accessToken
    Write-Host "Access Token: $($accessToken.Substring(0,20))..." -ForegroundColor Cyan
} else {
    Write-Host "✗ Login failed" -ForegroundColor Red
}

# 3. Access protected route
Write-Host "`n3. Testing Protected Route..." -ForegroundColor Yellow
$profileResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/profile" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $accessToken"} `
  -ErrorAction SilentlyContinue

if ($profileResponse.StatusCode -eq 200) {
    Write-Host "✓ Protected route access successful" -ForegroundColor Green
    $profile = $profileResponse.Content | ConvertFrom-Json
    Write-Host "User: $($profile.data.firstName) $($profile.data.lastName)" -ForegroundColor Cyan
} else {
    Write-Host "✗ Protected route access failed" -ForegroundColor Red
}

Write-Host "`n✅ Authentication testing complete!" -ForegroundColor Green
```

Run with:
```bash
.\test-auth.ps1
```

## Common Issues & Solutions

### Issue: "Invalid credentials"
**Solution:** Make sure you're using the correct email and password. Password must contain:
- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number
- One special character

### Issue: "Token expired"
**Solution:** Use the refresh token to get a new access token:
```bash
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/refresh-token" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### Issue: "User already exists"
**Solution:** Either use a different email or login with existing credentials

### Issue: Frontend not storing token
**Solution:** Check browser console for errors. Tokens should be stored in:
- Access Token: Memory/Redux store
- Refresh Token: HttpOnly cookie

## Security Notes

1. **Never commit tokens** to version control
2. **Use HTTPS in production** - tokens sent over HTTP are insecure
3. **Rotate secrets regularly** - change JWT_SECRET periodically
4. **Implement rate limiting** - prevent brute force attacks
5. **Use strong passwords** - enforce password policy
6. **Enable 2FA** - add two-factor authentication for admin accounts

## Next Steps

1. ✅ Registration working
2. ✅ Login working
3. ✅ Protected routes working
4. ⏳ Add password reset functionality
5. ⏳ Add email verification
6. ⏳ Add 2FA support
7. ⏳ Add OAuth providers (Google, Facebook)
