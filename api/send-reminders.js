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

    const manualEventId = req.query.eventId || null
    const now = new Date()

    // Returns YYYY-MM-DD for "N days from now" in the given IANA timezone.
    // Uses Intl.DateTimeFormat so DST is handled automatically.
    function localDatePlusDays(days, timezone) {
      const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(future)
    }

    // Fetch all active events
    let eventsQuery = db
      .from('events')
      .select(`*, signups(id, guest_name, guest_email, item_id), items(id, name)`)
      .eq('is_active', true)

    if (manualEventId) eventsQuery = eventsQuery.eq('id', manualEventId)

    const { data: events, error } = await eventsQuery
    if (error) {
      console.error('Error fetching events:', error)
      return res.status(500).json({ error: error.message })
    }

    if (!events?.length) {
      return res.status(200).json({ success: true, eventsChecked: 0, emailsSent: 0 })
    }

    // Batch-fetch organiser timezones from profiles (avoids N+1 queries)
    const userIds = [...new Set(events.map(e => e.user_id).filter(Boolean))]
    const { data: profiles } = await db
      .from('profiles')
      .select('id, timezone')
      .in('id', userIds)
    const tzByUser = Object.fromEntries(
      (profiles || []).map(p => [p.id, p.timezone || 'Australia/Melbourne'])
    )

    let emailsSent = 0
    let eventsChecked = 0

    for (const event of events) {
      const timezone = tzByUser[event.user_id] || 'Australia/Melbourne'

      // For scheduled runs: only send if the event is 2 days away in the organiser's timezone.
      // Cron fires at 23:00 UTC (= 9am AEST). Send time varies by timezone but is always morning
      // for AU/NZ organisers. US/Europe support will be added later with an hourly cron.
      if (!manualEventId && event.event_date !== localDatePlusDays(2, timezone)) continue

      eventsChecked++

      // Collect unique guests with emails, grouping their items
      const guestsWithEmail = {}
      for (const signup of event.signups || []) {
        if (!signup.guest_email) continue
        if (!guestsWithEmail[signup.guest_email]) {
          guestsWithEmail[signup.guest_email] = {
            name: signup.guest_name,
            email: signup.guest_email,
            items: []
          }
        }
        const item = event.items?.find(i => i.id === signup.item_id)
        if (item) guestsWithEmail[signup.guest_email].items.push(item.name)
      }

      for (const guest of Object.values(guestsWithEmail)) {
        // 600ms delay between sends to stay within Resend's 2 req/sec rate limit
        await new Promise(resolve => setTimeout(resolve, 600))

        const itemList = guest.items.map(i => `<li><strong>${i}</strong></li>`).join('')
        const eventDate = new Date(event.event_date + 'T00:00:00')
          .toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

        const emailRes = await fetch('https://rucolysccqhtifdkronr.supabase.co/functions/v1/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: guest.email,
            subject: `Reminder: ${event.name} is in 2 days!`,
            html: `
              <h2>Just a reminder! 👋</h2>
              <p>Hi ${guest.name},</p>
              <p>This is a reminder that <strong>${event.name}</strong> is coming up in 2 days!</p>
              <p>You signed up to bring:</p>
              <ul>${itemList}</ul>
              <p>📅 <strong>Date:</strong> ${eventDate}</p>
              ${event.location ? `<p>📍 <strong>Location:</strong> ${event.location}</p>` : ''}
              <p style="color:#888;font-size:12px;">Sent via What2Bring · <a href="https://what2bring.app">what2bring.app</a></p>
            `
          })
        })

        if (!emailRes.ok) {
          const errText = await emailRes.text()
          console.error(`Failed reminder to ${guest.email}: ${emailRes.status} ${errText}`)
        } else {
          emailsSent++
        }
      }
    }

    return res.status(200).json({ success: true, eventsChecked, emailsSent })

  } catch (err) {
    console.error('Cron error:', err)
    return res.status(500).json({ error: err.message })
  }
}
