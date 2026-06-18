const supabaseUrl = "https://bmfeoesfoohdnwkgnmsq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZmVvZXNmb29oZG53a2dubXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NjUyMjAsImV4cCI6MjA5MjI0MTIyMH0.Bxw-22_QO3728h-fowO89GM9Oprp7Z2bTN-1E15p3T8";

(async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(1)

    console.log('result:', { data, error })
  } catch (err) {
    console.error('test failed:', err)
  }
})()
