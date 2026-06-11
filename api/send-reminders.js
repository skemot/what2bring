export default async function handler(req, res) {
  // Only allow GET requests from Vercel cron
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const db = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

// Cron runs at 23:00 UTC = 9:00 AM AEST (UTC+10).
// Use AEST date for the "2 days from now" calculation so an event on Saturday
// gets its reminder on Thursday morning, not Friday.
const now = new Date()
const aestNow = new Date(now.getTime() + 10 * 60 * 60 * 1000)
const in2days = new Date(aestNow)
in2days.setUTCDate(in2days.getUTCDate() + 2)
const targetDate = in2days.toISOString().split('T')[0]

// Get active events on that date
const { data: events, error } = await db
  .from('events')
  .select(`
    *,
    signups(id, guest_name, guest_email, item_id),
    items(id, name)
  `)
  .eq('is_active', true)
  .eq('event_date', targetDate)

    if (error) {
      console.error('Error fetching events:', error)
      return res.status(500).json({ error: error.message })
    }

    let emailsSent = 0

    for (const event of events) {
      // Get unique guests with emails
      const guestsWithEmail = {}
      for (const signup of event.signups || []) {
        if (signup.guest_email && !guestsWithEmail[signup.guest_email]) {
          guestsWithEmail[signup.guest_email] = {
            name: signup.guest_name,
            email: signup.guest_email,
            items: []
          }
        }
        if (signup.guest_email) {
          const item = event.items?.find(i => i.id === signup.item_id)
          if (item) guestsWithEmail[signup.guest_email].items.push(item.name)
        }
      }

      // Send reminder to each guest — 600ms delay between sends to stay under Resend's 2/sec limit
      for (const guest of Object.values(guestsWithEmail)) {
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
              <p style="color:#888;font-size:12px;">Sent via BringIt · <a href="https://bringit.warragulsda.church">bringit.warragulsda.church</a></p>
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

    return res.status(200).json({ 
      success: true, 
      eventsChecked: events.length,
      emailsSent 
    })

  } catch (err) {
    console.error('Cron error:', err)
    return res.status(500).json({ error: err.message })
  }
}
