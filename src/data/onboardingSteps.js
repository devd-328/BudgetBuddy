/**
 * BudgetBuddy Onboarding Tour Steps
 * Each step maps to a real section of the app.
 * `highlight`  matches the element ID to spotlight on that page.
 * `route`      is the path to navigate to when this step begins.
 * `badge`      short text-only label for the context pill (tooltip steps only).
 * `shortTitle` concise 3-5 word title for the tooltip card.
 * `shortTip`   max 2 sentences shown in the compact tooltip.
 */

export const ONBOARDING_STEPS = [
  {
    id: 'greeting',
    route: '/',
    highlight: null,
    emoji: '\u{1F44B}',
    title: 'Take control of your money',
    getMessage: (name) =>
      `Hey ${name}! BudgetBuddy helps you track income, expenses, budgets, and debts in one place.\n\nYour balance updates instantly, so you always know where you stand.\n\nWould you like to start by adding your first transaction or take a quick tour?`,
    primaryAction: 'Add my first transaction',
    secondaryAction: 'Take a quick tour',
  },
  {
    id: 'add-first',
    route: '/add',
    highlight: 'add-record-hero',
    placement: 'below',
    badge: 'First Step',
    shortTitle: 'Start with one entry',
    shortTip: 'Log your first income or expense here. Add an amount, choose a category, and save to see BudgetBuddy in action.',
    emoji: '\u{2795}',
    title: 'Start with one quick entry',
    getMessage: () =>
      `Log your first income or expense here.\n\nEnter the amount, choose a category, and save to see BudgetBuddy in action right away.`,
    primaryAction: 'Continue',
    secondaryAction: 'Skip',
    moreInfo:
      `BudgetBuddy is designed to feel fast and lightweight. Once you save a transaction, your dashboard updates instantly so you can immediately see the result.`,
  },
  {
    id: 'overview',
    route: '/',
    highlight: 'dashboard-balance',
    placement: 'below',
    badge: 'Overview',
    shortTitle: 'Your money snapshot',
    shortTip: 'Your balance, recent activity, and top spending categories update automatically whenever you add, edit, or delete a transaction.',
    emoji: '\u{1F4CA}',
    title: 'This is your money snapshot',
    getMessage: () =>
      `This dashboard is your live financial overview.\n\nYour balance, recent activity, and top expenses update automatically as your transactions change.`,
    primaryAction: 'Next ->',
    secondaryAction: 'Tell me more',
    moreInfo:
      `Use this page as your financial home base. It helps you quickly confirm new records, catch balance changes, and spot which spending categories are growing fastest.`,
  },
  {
    id: 'set-goals',
    route: '/categories',
    highlight: null,
    emoji: '\u{1F3AF}',
    title: 'Set spending goals',
    getMessage: () =>
      `Create category budget limits so your money has a plan.\n\nThis helps you control spending and understand how much is still left to assign.`,
    primaryAction: 'Set a budget goal',
    secondaryAction: 'Do this later',
  },
  {
    id: 'ai',
    route: '/ai',
    highlight: 'ai-input-tray',
    placement: 'above',
    badge: 'AI Assistant',
    shortTitle: 'Manage money by chatting',
    shortTip: 'Ask BudgetBuddy to log transactions, check balances, or help set budgets using plain language.',
    emoji: '\u{1F916}',
    title: 'Manage money by chatting',
    getMessage: () =>
      `You can talk to BudgetBuddy in plain language to manage your finances faster.\n\nTry things like "I spent 500 on groceries", "What is my balance?", or "Set a budget for Food".`,
    primaryAction: 'Try AI',
    secondaryAction: 'Finish',
    moreInfo:
      `The AI is a shortcut, not a replacement for the app. Use it whenever you want to log something quickly, ask for a balance update, or set up simple financial actions without tapping through screens.`,
  },
  {
    id: 'action-nudge',
    route: '/',
    highlight: null,
    emoji: '\u{1F680}',
    title: "You're all set!",
    getMessage: (name) =>
      `You're ready, ${name}!\n\nWould you like to set a budget goal now, try the AI assistant, or head back to the dashboard?`,
    primaryAction: 'Set a budget goal',
    secondaryAction: 'Go to dashboard',
    tertiaryAction: 'Try AI',
    primaryRoute: '/categories',
    tertiaryRoute: '/ai',
  },
  {
    id: 'complete',
    route: '/',
    highlight: null,
    emoji: '\u{1F499}',
    title: "You're ready",
    getMessage: () =>
      `Your setup is complete.\n\nStart tracking, planning, and checking your progress anytime from the dashboard.`,
    primaryAction: 'Go to Dashboard',
    secondaryAction: null,
  },
]

export const TOUR_SECTIONS = ONBOARDING_STEPS.filter(
  (s) => !['greeting', 'action-nudge', 'complete'].includes(s.id)
)
