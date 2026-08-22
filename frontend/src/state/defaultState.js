import { uid, todayKey } from '../lib/utils.js'

export const STORAGE_KEY = 'wifesbrain_state_v1'

export function makeDefaultState() {
  return {
    version: 1,
    settings: {
      householdName: "The Wife's Brain",
      partnerAName: 'Me',
      partnerBName: 'Husband',
      currencySymbol: '$',
      expenseCategories: ['Food & Groceries', 'Kids', 'Household & Bills', 'Transport', 'Health', 'Other'],
    },
    // calendar
    events: [
      // { id, date: 'YYYY-MM-DD', time: '', title, category: 'household'|'kids'|'appointment'|'other', notes }
    ],
    // budget — flat, filterable-by-date lists rather than pre-bucketed months
    budget: {
      recurringIncomes: [
        // { id, person: 'a'|'b', label, amount } — assumed every month from now on
      ],
      extraIncomes: [
        // { id, person: 'a'|'b', label, amount, date }
      ],
      expenses: [
        // { id, category, label, amount, date }
      ],
    },
    // recipe box
    recipes: [
      // { id, title, category, hasImage, ingredients: [{id, text}], instructions, notes, createdAt }
    ],
    // shopping lists (can have a planned trip date + repeat monthly)
    shoppingLists: [
      {
        id: uid(),
        name: 'Big monthly shop',
        tripDate: null,
        recurring: false,
        lastAcknowledged: null,
        items: [],
      },
    ],
    createdAt: todayKey(),
    uiToast: null,
  }
}
