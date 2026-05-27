import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://syvnclufxahwoyasdeqj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dm5jbHVmeGFod295YXNkZXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzAxODQsImV4cCI6MjA5NTMwNjE4NH0.Rj6GYQJBxrzLc_KoCeZNU7bMCnjSDbalBBIWHA-XlnM'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)