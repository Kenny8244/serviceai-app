# Supabase Setup Instructions

## Current Issue
The Supabase URL `https://xfmstnqriblpuxjpcima.supabase.co` is not accessible.

## Solution: Create New Project

### Step 1: Create New Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Click "New Project"
4. Choose organization
5. Project name: `service-ai-v3`
6. Database password: Create a strong password (save it!)
7. Region: Choose closest to you
8. Click "Create new project"
9. Wait 1-2 minutes for initialization

### Step 2: Get New Credentials
1. Once project is ready, go to **Project Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy:
   - **Project URL** (looks like: `https://xxxxxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### Step 3: Update .env File
Update `/Users/kennyasooye/serviceai-app/backend/.env`:

```bash
# Replace these with new values
VITE_SUPABASE_URL=https://your-new-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key-here
```

### Step 4: Run Database Migration
1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy the entire content of: `/Users/kennyasooye/serviceai-app/backend/migrations/20240207000000_complete_setup.sql`
4. Paste and click **Run**

### Step 5: Test Connection
Run: `node backend/scripts/test-supabase.js`

### Expected Result
```
✅ Successfully connected to Supabase!
Data: [{count: 1}]
```

## Common Issues
- Make sure there are no spaces in the URL/key
- Use the `anon` key, not the `service_role` key for frontend
- Wait for project to fully initialize (1-2 minutes)
