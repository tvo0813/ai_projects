import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { STORE_NAME, STORE_TAGLINE, STORE_SLUG } from '../config/store'
import { getMenuItems, type MenuItem } from '../api/menu'
import ChatBot from '../components/ChatBot'

interface StoreContent {
  heroLabel: string
  storyTitle: string
  storyParagraphs: string[]
  pillars: { icon: string; title: string; desc: string }[]
}

const STORE_CONTENT: Record<string, StoreContent> = {
  'phin-and-beans': {
    heroLabel: 'Handcrafted with care',
    storyTitle: 'Born from the streets of Vietnam',
    storyParagraphs: [
      'It started with a memory — the smell of a phin drip slowly filling a small glass on a plastic stool outside a Saigon café at 7 in the morning. Strong, sweet, unhurried. Vietnam doesn\'t rush its coffee, and neither do we.',
      'We opened our doors because we wanted to share that feeling with our community — not a watered-down version of it, but the real thing. Every drink we serve is made the way it was meant to be made: with a proper phin filter, real condensed milk, and ingredients we\'re proud of.',
      'Vietnamese coffee culture is about more than caffeine — it\'s about slowing down, connecting, and savoring something made with care. That\'s what we bring to every cup, every day, for everyone who walks through our door.',
    ],
    pillars: [
      { icon: '🇻🇳', title: 'Rooted in Vietnam', desc: 'Every recipe traces back to the streets of Saigon and Hanoi — where coffee isn\'t just a drink, it\'s a daily ritual.' },
      { icon: '🌿', title: 'Fresh, Always', desc: 'We brew to order, source seasonally, and never cut corners. What\'s in your cup was made for you, not a shelf.' },
      { icon: '☕', title: 'Authentic to the Last Drop', desc: 'From our phin-drip method to our condensed milk ratio — we do it the Vietnamese way, exactly as it was meant to be.' },
      { icon: '🤝', title: 'Here for Our Community', desc: 'We\'re your neighborhood spot. We know your order, your name, and we\'re honored you choose to spend your morning with us.' },
    ],
  },
  'phin-drips': {
    heroLabel: 'Bold drip, every time',
    storyTitle: 'The art of the slow drip',
    storyParagraphs: [
      'Phin Drips was built on one simple belief: great coffee shouldn\'t be rushed. The Vietnamese phin filter is patience in metal form — grounds, hot water, and time. The result is something no espresso machine can replicate.',
      'We source our beans directly from the Central Highlands of Vietnam — Da Lat and Buon Ma Thuot — where the altitude and red soil produce some of the world\'s most distinctive robusta and arabica. From farm to phin, every step is intentional.',
      'Whether you take it black over ice, layered with condensed milk, or blended with coconut cream, every cup starts the same way: a slow, honest drip. That\'s the Phin Drips promise.',
    ],
    pillars: [
      { icon: '⏳', title: 'Slow Drip, Bold Flavor', desc: 'Our phin method takes longer — and tastes better for it. No shortcuts, no compromises.' },
      { icon: '🏔️', title: 'Vietnamese Highland Beans', desc: 'Sourced from Da Lat and Buon Ma Thuot farms known for their rich, earthy robusta and bright arabica.' },
      { icon: '🧊', title: 'Hot or Iced, Always Fresh', desc: 'Every cup is brewed to order. We don\'t batch brew or hold coffee — what you get is made the moment you order.' },
      { icon: '🤝', title: 'Your Daily Ritual', desc: 'We\'re not a chain. We\'re a neighborhood drip bar — the kind of place you come back to every morning.' },
    ],
  },
  'daboba': {
    heroLabel: 'Fresh boba, bold flavors',
    storyTitle: 'Where every sip is an adventure',
    storyParagraphs: [
      'Daboba started with a simple craving — boba that actually tastes like what it\'s made of. Real taro, real matcha, real fruit. Not powders, not syrups from a bag. We set out to make boba that\'s worth the walk.',
      'We hand-roll our tapioca pearls daily and cook them fresh every few hours. Our milk teas are brewed from loose-leaf tea, our fruit teas are made with real blended fruit, and our sugar levels are adjustable because you deserve a drink that\'s exactly yours.',
      'Boba culture is joyful, social, and creative — and that\'s exactly the vibe we want every time you walk in. Come alone, come with friends, try something new. There\'s always something worth sipping.',
    ],
    pillars: [
      { icon: '🧋', title: 'Real Ingredients Only', desc: 'Fresh taro, loose-leaf tea, real fruit — no artificial powders. You can taste the difference.' },
      { icon: '⚪', title: 'Pearls Made Daily', desc: 'Our tapioca pearls are hand-rolled and cooked fresh every few hours for that perfect chewy bite.' },
      { icon: '🎨', title: 'Your Drink, Your Way', desc: 'Adjust sweetness, ice level, milk type, and toppings. Every order is built for you, not the menu.' },
      { icon: '✨', title: 'Good Vibes Only', desc: 'Daboba is a place to slow down, catch up, and treat yourself. Every visit should feel like a little celebration.' },
    ],
  },
}

const DEFAULT_CONTENT = STORE_CONTENT['phin-and-beans']

export default function Home() {
  const [signatures, setSignatures] = useState<MenuItem[]>([])
  const content = STORE_CONTENT[STORE_SLUG] ?? DEFAULT_CONTENT

  useEffect(() => {
    getMenuItems('signature').then(setSignatures).catch(() => {})
  }, [])

  return (
    <div>
      {/* ── Hero ───────────────────────────── */}
      <section style={{
        background: 'var(--green-dark)',
        color: 'var(--white)',
        padding: '5rem 1.5rem 6rem',
        textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <p className="section-label" style={{ color: 'var(--green-light)', marginBottom: '1rem' }}>
            {content.heroLabel}
          </p>
          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
            fontWeight: 700,
            marginBottom: '1.25rem',
            color: 'var(--white)',
          }}>
            {STORE_NAME}
          </h1>
          <p style={{
            fontSize: '1.15rem',
            color: 'var(--green-light)',
            maxWidth: 520,
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}>
            {STORE_TAGLINE}
          </p>
        </motion.div>
      </section>

      {/* ── Our story ───────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--white)' }}>
        <div className="container" style={{ maxWidth: 860 }}>

          {/* Story text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            style={{ textAlign: 'center', marginBottom: '4rem' }}
          >
            <p className="section-label" style={{ marginBottom: '0.75rem' }}>Our story</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: '1.75rem' }}>
              {content.storyTitle}
            </h2>
            {content.storyParagraphs.map((para, i) => (
              <p key={i} style={{
                fontSize: '1.05rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.85,
                maxWidth: 680,
                margin: i < content.storyParagraphs.length - 1 ? '0 auto 1.25rem' : '0 auto',
              }}>
                {para}
              </p>
            ))}
          </motion.div>

          {/* Pillars */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
          }}>
            {content.pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{
                  width: 56, height: 56,
                  borderRadius: '50%',
                  background: 'var(--green-xlight)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                  margin: '0 auto 1rem',
                }}>
                  {p.icon}
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>{p.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{p.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Menu chatbot ────────────────────── */}
      <ChatBot />

      {/* ── Signature drinks ────────────────── */}
      {signatures.length > 0 && (
        <section style={{ padding: '4.5rem 1.5rem', background: 'var(--cream)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p className="section-label" style={{ marginBottom: '0.5rem' }}>House specials</p>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.2rem)' }}>Signature Drinks</h2>
              </div>
              <Link to="/menu" className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.55rem 1.25rem' }}>
                See full menu →
              </Link>
            </div>

            <motion.div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            >
              {signatures.map((item) => (
                <motion.div
                  key={item.item_id}
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.09)' }}
                >
                  <Link to="/menu" style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="card" style={{ overflow: 'hidden' }}>
                      <div style={{
                        height: 140,
                        background: item.image_url ? `url(${item.image_url}) center/cover no-repeat` : 'var(--green-xlight)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem',
                      }}>
                        {!item.image_url && '☕'}
                      </div>
                      <div style={{ padding: '0.9rem 1rem 1rem' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>
                          {item.name}
                        </p>
                        <p style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.875rem' }}>
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

    </div>
  )
}
