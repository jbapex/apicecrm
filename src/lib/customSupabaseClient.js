import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwhwpbfenuztgztkginf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aHdwYmZlbnV6dGd6dGtnaW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Njk4NTksImV4cCI6MjA3MDE0NTg1OX0.uOoCN9XsthpCw8861mup_vVa7lYV7aBHDqVJjDiba58';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);