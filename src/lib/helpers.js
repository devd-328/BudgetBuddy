/**
 * Helper: format a number as currency string with 2 decimal places
 * @param {number} amount
 * @param {string} currency  symbol e.g. "Rs" or "$"
 */
export function formatAmount(amount, currency = 'Rs') {
  if (amount === null || amount === undefined) return `${currency} 0.00`
  return `${currency} ${Number(amount).toFixed(2)}`
}

/**
 * Helper: format a JS Date or ISO string to DD/MM/YYYY
 * @param {string|Date} date
 */
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Helper: return today's date as YYYY-MM-DD (for <input type="date"> default)
 */
export function todayInputDate() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Helper: get greeting based on current hour
 */
export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Helper: get initials from a name string
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Helper: clamp a number between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Helper: get current month and year numbers
 */
export function getCurrentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}
