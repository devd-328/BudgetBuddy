export const RESERVED_CUSTOM_CATEGORY_NAME = 'Custom'

export const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#5DCAA5', type: 'expense' },
  { name: 'Transport', icon: '🚌', color: '#378ADD', type: 'expense' },
  { name: 'Education', icon: '📚', color: '#F0997B', type: 'expense' },
  { name: 'Health', icon: '💊', color: '#FF7676', type: 'expense' },
  { name: 'Shopping', icon: '🛍', color: '#FFB84C', type: 'expense' },
  { name: 'Entertainment', icon: '🎮', color: '#9B5DE5', type: 'expense' },
  { name: 'Bills', icon: '💡', color: '#00F5D4', type: 'expense' },
  { name: 'Salary', icon: '💼', color: '#34D399', type: 'income' },
  { name: 'Freelance', icon: '💻', color: '#60A5FA', type: 'income' },
  { name: 'Gift', icon: '🎁', color: '#FBBF24', type: 'income' },
  { name: 'Business', icon: '📈', color: '#818CF8', type: 'income' },
  { name: 'Other Income', icon: '💰', color: '#A78BFA', type: 'income' },
]

export const EXPENSE_CATEGORY_ORDER = [
  'Food',
  'Transport',
  'Education',
  'Health',
  'Shopping',
  'Entertainment',
  'Bills',
]

export function normalizeCategory(cat) {
  return {
    ...cat,
    type: cat.type || 'expense',
  }
}

export function isReservedCustomCategoryName(name = '') {
  return name.trim().toLowerCase() === RESERVED_CUSTOM_CATEGORY_NAME.toLowerCase()
}

export function dedupeCategories(list) {
  const seen = new Set()

  return (list || [])
    .filter((rawCat) => {
      const cat = normalizeCategory(rawCat)
      const key = `${cat.type}:${cat.name.trim().toLowerCase()}`

      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(normalizeCategory)
}

export function sortExpenseCategories(list) {
  return [...list].sort((a, b) => {
    const aDefaultIndex = EXPENSE_CATEGORY_ORDER.indexOf(a.name)
    const bDefaultIndex = EXPENSE_CATEGORY_ORDER.indexOf(b.name)
    const aIsDefault = aDefaultIndex !== -1
    const bIsDefault = bDefaultIndex !== -1

    if (aIsDefault && bIsDefault) return aDefaultIndex - bDefaultIndex
    if (aIsDefault) return -1
    if (bIsDefault) return 1

    return a.name.localeCompare(b.name)
  })
}
