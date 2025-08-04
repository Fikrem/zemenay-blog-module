import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://moqmenavlewwbevdzlck.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vcW1lbmF2bGV3d2JldmR6bGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNjIyMjgsImV4cCI6MjA2OTczODIyOH0._QWSXJfVtQyqA5gy-Ac2SEhwN2iLcwTuOM43X2fC5Dw'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Sign in with test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'fikretesfa21@gmail.com',
      password: '12345678'
    });
    if (authError) throw authError;
    console.log('Authentication successful:', authData.user?.email);

    // Test querying posts
    const { data, error } = await supabase.from('posts').select('*');
    if (error) throw error;
    console.log('Connection successful:', data);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();