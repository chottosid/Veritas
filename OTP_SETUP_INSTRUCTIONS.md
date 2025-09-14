# OTP Email Setup Instructions

## Prerequisites
1. A Gmail account
2. Gmail App Password (not your regular password)

## Step 1: Create .env File
Create a `.env` file in the root directory of your project with the following content:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/veritas

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Blockchain Configuration
PRIVATE_KEY=your_blockchain_private_key
RPC_URL=your_rpc_url
CONTRACT_ADDRESS=your_contract_address

# IPFS Configuration
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

## Step 2: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Enable 2-Step Verification if not already enabled
4. This is required to generate App Passwords

## Step 3: Generate Gmail App Password

1. In your Google Account settings, go to Security
2. Under "2-Step Verification", click on "App passwords"
3. Select "Mail" as the app
4. Select "Other (Custom name)" as the device
5. Enter "Veritas" as the custom name
6. Click "Generate"
7. Copy the 16-character app password (it will look like: abcd efgh ijkl mnop)
8. Replace `your_gmail_app_password` in the .env file with this password

## Step 4: Update Email Credentials

Replace the following placeholders in your .env file:
- `your_gmail@gmail.com` → Your actual Gmail email address
- `your_gmail_app_password` → The 16-character app password you generated in Step 3

## Step 5: Test the Setup

1. Start your backend server: `npm run dev`
2. Try registering a new user
3. Check your Gmail inbox for the OTP code
4. Verify that the OTP verification works

## Features Implemented

✅ **Real OTP Generation**: Random 6-digit codes instead of dummy codes
✅ **Gmail Integration**: Professional email templates with Veritas branding
✅ **All User Types**: OTP verification required for Citizens, Police, Judges, and Lawyers
✅ **Email Templates**: Beautiful HTML emails with different templates for:
   - Registration verification
   - Login verification
   - Password reset
✅ **Security Features**:
   - OTP expiration (10 minutes)
   - Maximum attempts (3 tries)
   - Rate limiting (5-minute cooldown)
   - Automatic cleanup of expired OTPs
✅ **Frontend Integration**:
   - Real API calls instead of dummy verification
   - Resend OTP functionality
   - Better error handling and user feedback

## Troubleshooting

### Email Not Sending
1. **Check 2-Factor Authentication**: Make sure 2FA is enabled on your Gmail account
2. **Verify App Password**: Ensure you're using the 16-character app password, not your regular Gmail password
3. **Check .env file**: Ensure your .env file is in the root directory with correct credentials
4. **Verify EMAIL_USER and EMAIL_PASS**: Make sure they're set correctly
5. **Check server logs**: Look for error messages in your console

### Gmail-Specific Issues
- **"Less secure app access"**: This is not needed with App Passwords
- **"Authentication failed"**: Double-check your app password (16 characters, no spaces)
- **"Access blocked"**: Make sure 2-Step Verification is enabled

### OTP Not Working
1. Check if the OTP has expired (10 minutes)
2. Verify you haven't exceeded maximum attempts (3 tries)
3. Try requesting a new OTP
4. Check server logs for verification errors

### Common Issues
- **"Email service not configured"**: Check your .env file exists and has correct email credentials
- **"Invalid OTP"**: Make sure you're entering the 6-digit code from your email
- **"Maximum attempts exceeded"**: Request a new OTP to reset the attempt counter
- **"Authentication failed"**: Verify your Gmail app password is correct

## Gmail App Password Format
Your Gmail app password should look like this: `abcd efgh ijkl mnop` (16 characters with spaces)
When entering it in your .env file, you can include or exclude the spaces - both work.

## Security Notes

- OTPs are automatically deleted after expiration
- Each OTP can only be used once
- Failed attempts are tracked and limited
- Email addresses are validated before sending OTPs
- All OTP operations are logged for security auditing
- Gmail App Passwords are more secure than regular passwords
- 2-Factor Authentication is required for App Passwords
