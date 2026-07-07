export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const db = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Archive events where event_date was more than 7 days ago
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const cutoffDate = cutoff.toISOString().split('T')[0]

    const { data, error } = await db
      .from('events')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('event_date', cutoffDate)
      .select('id, name')

    if (error) {
      console.error('Auto-archive error:', error)
      return res.status(500).json({ error: error.message })
    }

    console.log(`Auto-archived ${data?.length || 0} events`)
    return res.status(200).json({ archived: data?.length || 0, events: data?.map(e => e.name) })

  } catch (err) {
    console.error('Auto-archive cron error:', err)
    return res.status(500).json({ error: err.message })
  }
}
