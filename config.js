// ─────────────────────────────────────────────
// BringIt config — edit this file to manage
// categories across the whole app.
//
// Order here = order shown on the sign-up page
// and in all category dropdowns.
// ─────────────────────────────────────────────

const CATEGORIES = [
  { value: 'Mains',       label: '🍗 Mains' },
  { value: 'Salads',      label: '🥗 Salads' },
  { value: 'Bread',       label: '🍞 Bread' },
  { value: 'Desserts',    label: '🍰 Desserts' },
  { value: 'Drinks',      label: '🥤 Drinks' },
  { value: 'Snacks',      label: '🧀 Snacks' },
  { value: 'Ingredients', label: '🥕 Ingredients' },
  { value: 'Other',       label: '📦 Other' },
]

// Derived values used by the app — don't edit these
const CATEGORY_VALUES = CATEGORIES.map(c => c.value)

// Returns <option> tags for a category <select>.
// Pass the currently selected value to pre-select it.
function categoryOptionsHTML(selected = '') {
  return CATEGORIES.map(c =>
    `<option value="${c.value}"${c.value === selected ? ' selected' : ''}>${c.label}</option>`
  ).join('')
}
