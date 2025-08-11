# 🚀 Supabase Setup Guide for Shiddy PictoChat

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `shiddy-pictochat`
   - **Database Password**: (save this somewhere safe!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait ~2 minutes for setup to complete

## Step 2: Get Your Environment Variables

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIs...`)
   - **service_role** key (starts with `eyJhbGciOiJIUzI1NiIs...`)

## Step 3: Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Replace the values with your actual Supabase credentials!**

## Step 4: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `database/supabase-schema.sql`
4. Click "Run" to execute the schema
5. You should see tables created: `users`, `messages`, `username_history`

## Step 5: Verify Setup

Check that these tables exist in **Table Editor**:
- ✅ `users` - stores user sessions and usernames
- ✅ `messages` - stores all PictoChat messages and drawings
- ✅ `username_history` - tracks username changes

## Step 6: Test Connection

1. Restart your development server: `npm run dev`
2. Check browser console for any Supabase connection errors
3. Try creating a username - it should save to the database!

## 🔧 Additional Configuration

### Real-time Subscriptions (Optional)
- Go to **Database** → **Replication**
- Make sure `messages` table is enabled for real-time
- This allows live message updates across users!

### Row Level Security (RLS)
The schema includes basic RLS policies that allow all operations. For production, you might want to:
- Restrict users to only see messages from last 30 days
- Prevent users from editing others' messages
- Add rate limiting

### Backup & Maintenance
- Supabase automatically handles backups
- The schema includes a cleanup function for old data
- You can schedule this to run automatically

## 🚨 Troubleshooting

**Can't connect to Supabase?**
- Double-check your `.env.local` values
- Make sure you restart your dev server after adding env vars
- Check browser console for specific error messages

**Tables not created?**
- Make sure you ran the entire SQL schema
- Check the SQL Editor for any error messages
- Verify you have the right permissions

**Real-time not working?**
- Ensure the `messages` table is enabled in Replication
- Check that RLS policies allow the operations you need

## 🎯 Next Steps

Once everything is working:
1. Test creating usernames and messages
2. Try drawing on the canvas and saving
3. Open multiple browser tabs to test real-time updates
4. Customize the username experience
5. Add more features like user avatars or message reactions!

---

Your PictoChat is now ready to store persistent messages and support multiple users globally! 🌍✨
