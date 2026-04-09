/**
 * BudgetBuddy Onboarding Tour Steps
 * Each step maps to a real section of the app.
 * `highlight` matches the nav item IDs in BottomNav / Sidebar.
 * `route`     is the path to navigate to when this step begins.
 */

export const ONBOARDING_STEPS = [
  {
    id: 'greeting',
    route: '/',
    highlight: null,
    emoji: '👋',
    title: 'Welcome to BudgetBuddy!',
    getMessage: (name) =>
      `Hey ${name}! 🎉 I'm your BudgetBuddy assistant.\n\nI help you track income, expenses, debts, and budgets — all in one place, powered by AI.\n\nWould you like a quick tour of the app?`,
    primaryAction: 'Yes, show me around!',
    secondaryAction: "I'll explore myself",
  },
  {
    id: 'dashboard',
    route: '/',
    highlight: 'nav-home',
    emoji: '📊',
    title: 'Dashboard',
    getMessage: () =>
      `This is your Dashboard — your financial command centre.\n\nYou'll see your real-time balance, income vs expenses, weekly spending bars, and AI-generated monthly insights. Everything updates the moment you add a transaction.`,
    primaryAction: 'Next →',
    secondaryAction: 'Tell me more',
    moreInfo:
      `The AI Insights card at the top can generate a personalised spending analysis for you by tapping "Generate Monthly Report". The balance card shows income, expenses, and money you have lent out.`,
  },
  {
    id: 'analytics',
    route: '/analytics',
    highlight: 'nav-analytics',
    emoji: '📈',
    title: 'Analytics',
    getMessage: () =>
      `The Analytics page shows you exactly where your money goes.\n\nYou'll find category breakdowns, spending trends by month, and visual charts so you can spot patterns at a glance.`,
    primaryAction: 'Next →',
    secondaryAction: 'Tell me more',
    moreInfo:
      `You can filter by month and see how your spending in each category compares. Look for the categories eating your budget the most — that is where your savings potential is.`,
  },
  {
    id: 'add',
    route: '/add',
    highlight: 'nav-add',
    emoji: '➕',
    title: 'Add Record',
    getMessage: () =>
      `The Add Record page is where you log every rupee in and out.\n\nType a description and the AI will suggest the right category automatically. You can log income, expenses, voice notes, and even recurring entries.`,
    primaryAction: 'Next →',
    secondaryAction: 'Tell me more',
    moreInfo:
      `Pro tip: You can also just tell the AI Assistant "I spent 500 on dinner" and it will log it for you without opening this page at all!`,
  },
  {
    id: 'borrow',
    route: '/borrow',
    highlight: 'nav-borrow',
    emoji: '🤝',
    title: 'Borrow & Lend',
    getMessage: () =>
      `Borrow & Lend tracks the money you owe others — and what others owe you.\n\nAdd a debt record, log partial repayments over time, and mark debts as settled when they are cleared. No more forgetting who owes what.`,
    primaryAction: 'Next →',
    secondaryAction: 'Tell me more',
    moreInfo:
      `The AI also understands commands like "Ahmed paid me back 500" or "I borrowed 2000 from my dad for rent" — it will create the records for you instantly.`,
  },
  {
    id: 'ai',
    route: '/ai',
    highlight: 'nav-ai',
    emoji: '🤖',
    title: 'AI Assistant',
    getMessage: () =>
      `Meet your AI Assistant, powered by Llama 3.3.\n\nYou can chat in plain English to log transactions, check your balance, manage debts, or ask for financial advice. It understands context and takes real actions on your data.`,
    primaryAction: 'Next →',
    secondaryAction: 'Tell me more',
    moreInfo:
      `Try saying things like:\n• "What is my current balance?"\n• "I spent 1200 on groceries"\n• "Set a budget of 5000 for Food this month"\n\nThe AI will handle it all instantly.`,
  },
  {
    id: 'settings',
    route: '/settings',
    highlight: 'nav-settings',
    emoji: '⚙️',
    title: 'Settings',
    getMessage: () =>
      `Settings is where you personalise BudgetBuddy.\n\nSet your display name, choose your currency (Rs, $, €, and more), upload a profile picture, manage categories & budgets, and export your data as CSV anytime.`,
    primaryAction: 'Next →',
    secondaryAction: 'Tell me more',
    moreInfo:
      `The "Categories & Budgets" section lets you set monthly spending limits per category. Once you set a limit, BudgetBuddy will warn you when you are approaching it.`,
  },
  {
    id: 'action-nudge',
    route: '/',
    highlight: null,
    emoji: '🚀',
    title: "You're all set!",
    getMessage: (name) =>
      `You're ready, ${name}! 🚀\n\nThe best way to start is to add your first transaction or set a budget. What would you like to do first?`,
    primaryAction: 'Add a transaction',
    secondaryAction: "I'll do it later",
    tertiaryAction: 'Set up a budget',
    primaryRoute: '/add',
    tertiaryRoute: '/categories',
  },
  {
    id: 'complete',
    route: '/',
    highlight: null,
    emoji: '💙',
    title: 'All done!',
    getMessage: () =>
      `You are all set! I am here anytime you have questions — just tap the AI Assistant button and ask.\n\nHappy budgeting! 💙`,
    primaryAction: "Let's go!",
    secondaryAction: null,
  },
]

export const TOUR_SECTIONS = ONBOARDING_STEPS.filter(
  (s) => !['greeting', 'action-nudge', 'complete'].includes(s.id)
)
