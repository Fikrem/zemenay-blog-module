import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://moqmenavlewwbevdzlck.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vcW1lbmF2bGV3d2JldmR6bGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNjIyMjgsImV4cCI6MjA2OTczODIyOH0._QWSXJfVtQyqA5gy-Ac2SEhwN2iLcwTuOM43X2fC5Dw'
);