// ─────────────────────────────────────────────
// What2Bring config — edit this file to manage
// event types and their category lists.
//
// EVENT_TYPES defines what shows in the "What kind
// of event?" picker and which categories appear in
// the item dropdown for that type.
//
// To add a type: copy an entry and give it a unique id.
// To reorder types: move the entries around.
// To change a category list: edit the categories array.
// ─────────────────────────────────────────────

const EVENT_TYPES = [
  {
    id: 'potluck',
    icon: '🍽️',
    label: 'Potluck / Shared Meal',
    categories: ['Mains', 'Salads', 'Bread', 'Desserts', 'Drinks', 'Snacks', 'Condiments', 'Other'],
  },
  {
    id: 'meal-train',
    icon: '🥡',
    label: 'Meal Train',
    categories: ['Dinner', 'Lunch', 'Breakfast', 'Dessert', 'Snacks', 'Drinks', 'Other'],
  },
  {
    id: 'tools',
    icon: '🔧',
    label: 'Tools & Equipment',
    categories: ['Power Tools', 'Hand Tools', 'Garden Tools', 'Ladders', 'Safety Gear', 'Other'],
  },
  {
    id: 'school',
    icon: '🎒',
    label: 'School / Kids',
    categories: ['Stationery', 'Snacks', 'Drinks', 'Craft Supplies', 'Sporting Gear', 'Other'],
  },
  {
    id: 'sports',
    icon: '⚽',
    label: 'Sports / Club',
    categories: ['Equipment', 'Uniforms', 'Snacks', 'Drinks', 'First Aid', 'Other'],
  },
  {
    id: 'caregiving',
    icon: '💛',
    label: 'Caregiving / Support',
    categories: ['Meals', 'Groceries', 'Transport', 'Household Help', 'Other'],
  },
  {
    id: 'general',
    icon: '📦',
    label: 'General / Other',
    categories: ['Supplies', 'Equipment', 'Clothing', 'Documents', 'Other'],
  },
]

// CATEGORIES mirrors the Potluck type for backwards compatibility.
// To change food categories, edit EVENT_TYPES[0].categories above.
const CATEGORIES = EVENT_TYPES[0].categories.map(v => ({ value: v, label: v }))
