import { Locale } from '../locale'
import { BriefFormState } from '../stores/appStore'

export type PageType = 'landing' | 'app' | 'email' | 'ecommerce' | 'portfolio' | 'component'

export interface DirectionPreset {
  id: string
  name: string
  summary: string
  prompt: string
}

export interface QuickTweak {
  id: string
  label: string
  instruction: string
}

export interface PageTypeConfig {
  id: PageType
  label: string
  labelEn: string
  icon: string
  briefFields: BriefField[]
  defaultSections: string
  directions: DirectionPreset[]
  tweaks: QuickTweak[]
}

export interface BriefField {
  key: keyof BriefFormState
  label: string
  labelEn: string
  placeholder: string
  placeholderEn: string
  multiline?: boolean
}

// ── Direction presets per type ────────────────────────────────────────────────

function landingDirections(isZh: boolean): DirectionPreset[] {
  return [
    {
      id: 'editorial-premium',
      name: isZh ? '高级感' : 'Editorial Premium',
      summary: isZh ? '留白充足，层次克制，像高端品牌官网。' : 'Airy spacing, refined hierarchy, and a premium brand-site feel.',
      prompt: 'Use an editorial premium art direction with elegant typography, restrained palette, refined spacing, layered cards, and a polished high-end brand feel.',
    },
    {
      id: 'clean-minimal',
      name: isZh ? '更简洁' : 'Clean Minimal',
      summary: isZh ? '信息密度更轻，模块更少，更干净。' : 'Lower information density, fewer motifs, and a cleaner composition.',
      prompt: 'Keep the composition minimal and calm with fewer visual motifs, cleaner blocks, concise copy, and stronger whitespace discipline.',
    },
    {
      id: 'saas-conversion',
      name: isZh ? '偏 SaaS' : 'SaaS Product',
      summary: isZh ? '更像软件官网，强调产品结构与可信度。' : 'Feels more like a software landing page with strong hierarchy and credibility.',
      prompt: 'Shape it like a modern SaaS landing page with strong product hierarchy, proof blocks, feature storytelling, UI-like cards, and operational credibility.',
    },
    {
      id: 'bold-campaign',
      name: isZh ? '强转化' : 'Campaign Conversion',
      summary: isZh ? '主视觉更强，CTA 更突出，节奏更抓人。' : 'Bolder hero, clearer CTA pressure, and more campaign energy.',
      prompt: 'Push for a campaign-oriented conversion page with a bolder hero, higher contrast CTA moments, persuasive social proof, urgency cues, and denser conversion framing.',
    },
  ]
}

function appDirections(isZh: boolean): DirectionPreset[] {
  return [
    {
      id: 'app-dashboard',
      name: isZh ? '数据看板' : 'Dashboard',
      summary: isZh ? '侧边栏导航 + 数据卡片 + 图表。' : 'Sidebar nav, stat cards, charts and data tables.',
      prompt: 'Design a data-rich admin dashboard with a fixed sidebar navigation, top bar, stat cards, charts (mocked as static SVG/CSS), and data tables. Use a clean professional color palette.',
    },
    {
      id: 'app-mobile',
      name: isZh ? '移动端 App' : 'Mobile App UI',
      summary: isZh ? '仿原生移动界面，底部 Tab 导航。' : 'Native-like mobile app with bottom tab navigation.',
      prompt: 'Design a native-looking mobile app UI with bottom tab bar navigation, card feeds, floating action button, and touch-friendly spacing. Max width 390px, centered on page.',
    },
    {
      id: 'app-saas',
      name: isZh ? 'SaaS 产品页' : 'SaaS App Screen',
      summary: isZh ? '带顶栏、左侧菜单的典型 SaaS 界面。' : 'Classic SaaS layout with top bar and left menu.',
      prompt: 'Create a SaaS product screen with a horizontal top navigation bar, left sidebar menu, breadcrumb, content area with form/list/detail panel, and action buttons.',
    },
    {
      id: 'app-admin',
      name: isZh ? '管理后台' : 'Admin Panel',
      summary: isZh ? '深色侧边栏，用户/权限管理风格。' : 'Dark sidebar admin interface for management tasks.',
      prompt: 'Build an admin panel with a dark sidebar, user/resource management tables, status badges, bulk action toolbars, and search/filter controls.',
    },
  ]
}

function emailDirections(isZh: boolean): DirectionPreset[] {
  return [
    {
      id: 'email-newsletter',
      name: isZh ? '邮件通讯' : 'Newsletter',
      summary: isZh ? '内容丰富的周报/月刊模板。' : 'Content-rich weekly or monthly digest.',
      prompt: 'Design a newsletter email with logo header, featured article hero, content sections with inline images, curated links list, and unsubscribe footer. Use table-based layout compatible with email clients.',
    },
    {
      id: 'email-promo',
      name: isZh ? '促销邮件' : 'Promotional',
      summary: isZh ? '高转化营销邮件，突出折扣/优惠。' : 'High-conversion marketing email with offer highlight.',
      prompt: 'Create a promotional email with a bold hero banner showing the offer/discount, product showcase, urgency copy, and a strong CTA button. Use inline CSS only, email-safe fonts.',
    },
    {
      id: 'email-transactional',
      name: isZh ? '事务邮件' : 'Transactional',
      summary: isZh ? '订单确认/通知类邮件，清晰简洁。' : 'Order confirmation or notification email.',
      prompt: 'Design a transactional email (order confirmation, notification, or alert) with clear status display, detail table, next steps, and minimal branding. Prioritize readability.',
    },
    {
      id: 'email-onboarding',
      name: isZh ? '欢迎邮件' : 'Welcome / Onboarding',
      summary: isZh ? '新用户欢迎，引导完成第一步。' : 'Welcome new users and guide them to first action.',
      prompt: 'Create a welcome/onboarding email with warm greeting, product introduction, 3-step getting started guide, and a prominent CTA to start. Friendly and encouraging tone.',
    },
  ]
}

function ecommerceDirections(isZh: boolean): DirectionPreset[] {
  return [
    {
      id: 'ec-product',
      name: isZh ? '商品详情页' : 'Product Detail',
      summary: isZh ? '完整商品页：图片、参数、加购。' : 'Full product page with images, specs, and add-to-cart.',
      prompt: 'Design a product detail page with image gallery (static mockup), product title, price, variant selector (color/size), key features list, add-to-cart button, and customer reviews.',
    },
    {
      id: 'ec-listing',
      name: isZh ? '商品列表' : 'Category Grid',
      summary: isZh ? '分类浏览页，筛选器 + 卡片网格。' : 'Category browsing page with filters and product grid.',
      prompt: 'Create a product category page with sidebar filters (price range, category, rating), product card grid (image, name, price, rating, add to cart), pagination, and sort controls.',
    },
    {
      id: 'ec-store',
      name: isZh ? '品牌店铺' : 'Brand Store',
      summary: isZh ? '完整品牌电商首页，有 Banner、推荐区。' : 'Full brand storefront with banner and featured sections.',
      prompt: 'Build a brand store homepage with hero banner/slideshow mockup, featured collection grid, promotional banners, bestseller section, and newsletter signup at bottom.',
    },
    {
      id: 'ec-checkout',
      name: isZh ? '结账页面' : 'Checkout Flow',
      summary: isZh ? '购物车 + 填写信息 + 支付确认。' : 'Cart summary, shipping form, and payment confirmation.',
      prompt: 'Design a checkout page with order summary sidebar, shipping address form, payment method selection (static), and order review + place order button. Clean, trust-focused design.',
    },
  ]
}

function portfolioDirections(isZh: boolean): DirectionPreset[] {
  return [
    {
      id: 'port-creative',
      name: isZh ? '创意作品集' : 'Creative Portfolio',
      summary: isZh ? '视觉主导，大图展示项目。' : 'Visual-first project showcase with large imagery.',
      prompt: 'Design a creative portfolio with full-bleed project hero images (CSS gradient placeholders), project grid/list, case study preview cards, and a strong personal brand statement.',
    },
    {
      id: 'port-developer',
      name: isZh ? '开发者简历' : 'Developer Resume',
      summary: isZh ? '技术向，展示技能栈和项目。' : 'Tech-focused personal site with skills and projects.',
      prompt: 'Create a developer portfolio with GitHub-style contribution graph mockup, skills/tech stack badges, featured projects with stack tags and GitHub links, work experience timeline, and contact form.',
    },
    {
      id: 'port-agency',
      name: isZh ? '机构 / 工作室' : 'Agency / Studio',
      summary: isZh ? '团队展示，服务介绍，案例。' : 'Team showcase, service listing, and case studies.',
      prompt: 'Build an agency/studio site with dramatic hero statement, services grid, featured work case studies, team member cards, client logos, and a contact section.',
    },
    {
      id: 'port-personal',
      name: isZh ? '个人品牌' : 'Personal Brand',
      summary: isZh ? '个人展示页，照片 + 简历 + 社交。' : 'Personal brand page with bio, resume, and social links.',
      prompt: 'Design a personal brand page with avatar/photo placeholder, personal statement, about section, featured writing/work links, skills/interests, and social media links.',
    },
  ]
}

function componentDirections(isZh: boolean): DirectionPreset[] {
  return [
    {
      id: 'comp-ui-kit',
      name: isZh ? 'UI 组件集' : 'UI Component Kit',
      summary: isZh ? '按钮、卡片、表单等基础组件展示。' : 'Buttons, cards, badges, and form elements.',
      prompt: 'Create a UI component showcase page displaying: buttons (all states), card variants, badges/chips, form inputs, toggles, and alert components. Each section labeled with the component name.',
    },
    {
      id: 'comp-nav',
      name: isZh ? '导航组件' : 'Navigation Patterns',
      summary: isZh ? '顶栏、侧边栏、面包屑、Tab。' : 'Header, sidebar, breadcrumbs, and tab patterns.',
      prompt: 'Showcase navigation UI patterns: a sticky top header with logo + nav + CTA, a sidebar menu with nested items, breadcrumb trail, and a tab bar with active states.',
    },
    {
      id: 'comp-data',
      name: isZh ? '数据展示组件' : 'Data Display',
      summary: isZh ? '表格、统计卡、进度条等。' : 'Tables, stat cards, progress bars, and charts.',
      prompt: 'Display data visualization components: stat cards with trend indicators, a sortable data table with pagination, progress bars, a pie chart (CSS/SVG), and a line chart mockup.',
    },
    {
      id: 'comp-form',
      name: isZh ? '表单组件' : 'Form & Input',
      summary: isZh ? '各类输入框、选择、验证状态。' : 'Inputs, selects, radio, checkbox, with validation.',
      prompt: 'Create a form component gallery showing: text inputs (default, focus, error, disabled), selects, textarea, radio buttons, checkboxes, date picker (static), and a complete multi-field form example.',
    },
  ]
}

// ── Quick tweaks per type ─────────────────────────────────────────────────────

function landingTweaks(isZh: boolean): QuickTweak[] {
  return [
    { id: 'premium', label: isZh ? '更高级' : 'More Premium', instruction: 'Elevate the page to feel more premium, more intentional, and more design-led without hurting readability.' },
    { id: 'minimal', label: isZh ? '更简洁' : 'More Minimal', instruction: 'Reduce visual noise, simplify the structure, and make the page feel cleaner and more focused.' },
    { id: 'saas', label: isZh ? '更偏 SaaS' : 'More SaaS', instruction: 'Make the page feel more like a polished SaaS product landing page with clearer product hierarchy and proof modules.' },
    { id: 'conversion', label: isZh ? '更强转化' : 'More Conversion', instruction: 'Increase conversion intent with sharper messaging, more compelling CTA hierarchy, and stronger persuasion blocks.' },
  ]
}

function appTweaks(isZh: boolean): QuickTweak[] {
  return [
    { id: 'dark', label: isZh ? '深色模式' : 'Dark Mode', instruction: 'Convert the UI to a dark color scheme with appropriate contrast, muted backgrounds, and light text.' },
    { id: 'compact', label: isZh ? '更紧凑' : 'More Compact', instruction: 'Reduce spacing, make tables and lists denser, and fit more information per screen.' },
    { id: 'colorful', label: isZh ? '更有色彩' : 'More Colorful', instruction: 'Add more color accents, use colored sidebar/header, and make stat cards more visually distinct.' },
    { id: 'modern', label: isZh ? '更现代' : 'More Modern', instruction: 'Update to a more modern UI with rounded corners, glassmorphism effects, and smoother visual hierarchy.' },
  ]
}

function emailTweaks(isZh: boolean): QuickTweak[] {
  return [
    { id: 'shorter', label: isZh ? '更简短' : 'Shorter', instruction: 'Trim the email to only the most essential content, reduce copy length, and make it scannable.' },
    { id: 'warmer', label: isZh ? '更亲切' : 'Warmer Tone', instruction: 'Make the tone friendlier, more conversational, and less formal while keeping it professional.' },
    { id: 'bolder-cta', label: isZh ? '突出 CTA' : 'Bolder CTA', instruction: 'Make the call-to-action button larger, more prominent, and add urgency to the surrounding copy.' },
    { id: 'dark-email', label: isZh ? '深色风格' : 'Dark Style', instruction: 'Use a dark background for the email body with light text and vibrant accent colors.' },
  ]
}

function ecommerceTweaks(isZh: boolean): QuickTweak[] {
  return [
    { id: 'luxury', label: isZh ? '更高端' : 'More Luxury', instruction: 'Elevate the aesthetic to feel premium: larger imagery, refined typography, and elegant spacing.' },
    { id: 'urgency', label: isZh ? '加紧迫感' : 'Add Urgency', instruction: 'Add urgency signals: countdown timer, low-stock indicator, limited offer badge, and "X people viewing this" social proof.' },
    { id: 'trust', label: isZh ? '加信任感' : 'More Trust', instruction: 'Add trust signals: security badges, return policy, verified reviews, and guarantees.' },
    { id: 'mobile-first', label: isZh ? '移动端优先' : 'Mobile First', instruction: 'Optimize the layout for mobile: larger touch targets, stacked layout, thumb-friendly navigation.' },
  ]
}

function portfolioTweaks(isZh: boolean): QuickTweak[] {
  return [
    { id: 'bold', label: isZh ? '更大胆' : 'Bolder Design', instruction: 'Make the design more bold and distinctive: larger type, stronger contrast, and a more confident visual voice.' },
    { id: 'minimal-port', label: isZh ? '极简风' : 'Ultra Minimal', instruction: 'Strip back to pure essentials: minimal color, generous white space, and typography-first design.' },
    { id: 'dark-port', label: isZh ? '深色风' : 'Dark Theme', instruction: 'Convert to a dark-themed portfolio with dark background, light text, and vibrant accent colors.' },
    { id: 'more-projects', label: isZh ? '多展示项目' : 'Showcase More', instruction: 'Add more project cards, expand the work section, and make the project grid the hero of the page.' },
  ]
}

function componentTweaks(isZh: boolean): QuickTweak[] {
  return [
    { id: 'dark-comp', label: isZh ? '深色版本' : 'Dark Version', instruction: 'Show all components in a dark theme variant alongside the light version.' },
    { id: 'more-states', label: isZh ? '更多状态' : 'More States', instruction: 'Add more component states: loading spinners, skeleton placeholders, empty states, and error states.' },
    { id: 'rounded', label: isZh ? '更圆润' : 'More Rounded', instruction: 'Increase border radius across all components for a softer, friendlier visual style.' },
    { id: 'annotated', label: isZh ? '加标注' : 'Add Labels', instruction: 'Add clear section headers and component name labels to make the showcase easier to navigate.' },
  ]
}

// ── Brief field definitions ───────────────────────────────────────────────────

const LANDING_FIELDS: BriefField[] = [
  { key: 'product', label: '产品 / 品牌', labelEn: 'Product / Brand', placeholder: 'Nova Analytics、AI 发票工具…', placeholderEn: 'Nova Analytics, AI invoicing app…' },
  { key: 'audience', label: '目标受众', labelEn: 'Audience', placeholder: '创业公司创始人、RevOps 团队…', placeholderEn: 'Startup founders, RevOps teams…' },
  { key: 'goal', label: '目标', labelEn: 'Goal', placeholder: '推动预约演示、发布新功能…', placeholderEn: 'Drive demo bookings, launch a feature…' },
  { key: 'sections', label: '必备区块', labelEn: 'Required Sections', placeholder: 'Hero、功能区、用户评价、定价…', placeholderEn: 'Hero, features, testimonials, pricing…' },
  { key: 'notes', label: '补充说明', labelEn: 'Notes', placeholder: '语气、参考站点、限制条件…', placeholderEn: 'Tone, references, constraints…', multiline: true },
]

const APP_FIELDS: BriefField[] = [
  { key: 'product', label: '应用名称', labelEn: 'App Name', placeholder: 'DataFlow、TaskMaster Pro…', placeholderEn: 'DataFlow, TaskMaster Pro…' },
  { key: 'audience', label: '使用角色', labelEn: 'User Role', placeholder: '管理员、运营人员、数据分析师…', placeholderEn: 'Admin, operations team, analyst…' },
  { key: 'sections', label: '核心模块', labelEn: 'Core Modules', placeholder: '用户管理, 数据看板, 报表, 设置…', placeholderEn: 'User management, dashboard, reports, settings…' },
  { key: 'goal', label: '主要功能', labelEn: 'Main Function', placeholder: '展示用户增长数据、管理订单…', placeholderEn: 'Show user growth data, manage orders…' },
  { key: 'notes', label: '补充说明', labelEn: 'Notes', placeholder: '深色主题、紧凑布局、特定配色…', placeholderEn: 'Dark theme, compact layout, specific colors…', multiline: true },
]

const EMAIL_FIELDS: BriefField[] = [
  { key: 'product', label: '品牌 / 发件人', labelEn: 'Brand / Sender', placeholder: 'Acme Inc、Nova Team…', placeholderEn: 'Acme Inc, Nova Team…' },
  { key: 'goal', label: '邮件主题', labelEn: 'Email Subject', placeholder: '四月新功能发布、限时 8 折优惠…', placeholderEn: 'April feature release, 20% off this week…' },
  { key: 'audience', label: '收件人', labelEn: 'Recipient', placeholder: '活跃用户、新注册用户、付费客户…', placeholderEn: 'Active users, new signups, paying customers…' },
  { key: 'sections', label: 'CTA 按钮文案', labelEn: 'CTA Text', placeholder: '立即查看、免费开始、领取优惠…', placeholderEn: 'View now, Start free, Claim offer…' },
  { key: 'notes', label: '补充说明', labelEn: 'Notes', placeholder: '语气偏好、颜色、特定内容…', placeholderEn: 'Tone, brand colors, specific content…', multiline: true },
]

const ECOMMERCE_FIELDS: BriefField[] = [
  { key: 'product', label: '商品 / 品牌名', labelEn: 'Product / Brand', placeholder: '无线降噪耳机、极简白 T…', placeholderEn: 'Noise-cancelling headphones, minimalist tee…' },
  { key: 'audience', label: '目标买家', labelEn: 'Target Buyer', placeholder: '科技爱好者、年轻女性、家庭用户…', placeholderEn: 'Tech enthusiasts, young women, families…' },
  { key: 'goal', label: '价格定位 / 卖点', labelEn: 'Price & Value Prop', placeholder: '599元，30小时续航，主动降噪…', placeholderEn: '$79, 30hr battery, active noise cancelling…' },
  { key: 'sections', label: '重点展示区块', labelEn: 'Key Sections', placeholder: '图片展示、规格参数、用户评价、相关商品…', placeholderEn: 'Gallery, specs, reviews, related products…' },
  { key: 'notes', label: '补充说明', labelEn: 'Notes', placeholder: '品牌调性、颜色、特殊要求…', placeholderEn: 'Brand tone, colors, special requirements…', multiline: true },
]

const PORTFOLIO_FIELDS: BriefField[] = [
  { key: 'product', label: '姓名 / 品牌名', labelEn: 'Name / Brand', placeholder: 'Li Wei Design、Studio NOVA…', placeholderEn: 'Alex Chen Design, Studio NOVA…' },
  { key: 'audience', label: '职位 / 领域', labelEn: 'Role / Field', placeholder: 'UI/UX 设计师、全栈工程师、摄影师…', placeholderEn: 'UI/UX designer, fullstack engineer, photographer…' },
  { key: 'sections', label: '技能 / 项目', labelEn: 'Skills / Projects', placeholder: 'React、Figma、3个项目案例…', placeholderEn: 'React, Figma, 3 case study projects…' },
  { key: 'goal', label: '个人定位', labelEn: 'Personal Statement', placeholder: '帮助初创团队快速构建产品…', placeholderEn: 'Help startups ship products faster…' },
  { key: 'notes', label: '补充说明', labelEn: 'Notes', placeholder: '风格偏好、配色、特别要求…', placeholderEn: 'Style preferences, colors, special requests…', multiline: true },
]

const COMPONENT_FIELDS: BriefField[] = [
  { key: 'product', label: '组件名称 / 系统', labelEn: 'Component / System', placeholder: '按钮组件集、数据表格、表单控件…', placeholderEn: 'Button set, data table, form controls…' },
  { key: 'goal', label: '使用场景', labelEn: 'Use Case', placeholder: '后台管理系统、面向用户的 Web App…', placeholderEn: 'Admin dashboard, customer-facing web app…' },
  { key: 'sections', label: '需要展示的状态', labelEn: 'States to Show', placeholder: 'default, hover, active, disabled, loading…', placeholderEn: 'default, hover, active, disabled, loading…' },
  { key: 'audience', label: '设计风格', labelEn: 'Design Style', placeholder: 'Material Design、Ant Design、极简风…', placeholderEn: 'Material Design, Ant Design, minimal…' },
  { key: 'notes', label: '补充说明', labelEn: 'Notes', placeholder: '颜色主题、圆角偏好、特定需求…', placeholderEn: 'Color theme, border radius, specific needs…', multiline: true },
]

// ── Prompt builders per type ──────────────────────────────────────────────────

export function buildPromptForType(brief: BriefFormState, direction: DirectionPreset, pageContext = ''): string {
  const lang = brief.outputLang && brief.outputLang !== 'auto'
    ? `\nIMPORTANT: All visible text content in the page MUST be written in ${LANG_NAMES[brief.outputLang] || brief.outputLang}. Do not use English unless the language is set to English.`
    : ''
  const darkInstruction = brief.darkMode
    ? '\nDARK MODE: Use a dark background color scheme (dark grays/blacks) with light text and appropriate contrast throughout.'
    : ''

  const base = [
    'The output must be one complete HTML document with all CSS embedded inline.',
    'Render the visible page directly. Do not output a React/Vue/Svelte app shell, root div placeholder, or framework-dependent code.',
    'Do not rely on external JavaScript to populate the page after load.',
    'Do not use canvas, WebGL, or script-driven chart libraries for the main experience. Use static HTML, CSS, and inline SVG for any charts.',
    lang,
    darkInstruction,
  ].filter(Boolean).join('\n')

  switch (brief.pageType) {
    case 'app':
      return buildAppPrompt(brief, direction, pageContext, base)
    case 'email':
      return buildEmailPrompt(brief, direction, base)
    case 'ecommerce':
      return buildEcommercePrompt(brief, direction, pageContext, base)
    case 'portfolio':
      return buildPortfolioPrompt(brief, direction, pageContext, base)
    case 'component':
      return buildComponentPrompt(brief, direction, base)
    default:
      return buildLandingPrompt(brief, direction, pageContext, base)
  }
}

function buildLandingPrompt(brief: BriefFormState, direction: DirectionPreset, pageContext: string, base: string): string {
  const sections = brief.sections.split(',').map(s => s.trim()).filter(Boolean).join(', ')
  return [
    'Create a complete production-style single-page HTML experience.',
    pageContext ? `\nMulti-page project context:\n${pageContext}\n` : '',
    `Product or brand: ${brief.product || 'A modern digital product'}.`,
    `Target audience: ${brief.audience || 'Prospective customers evaluating the offer'}.`,
    `Primary goal: ${brief.goal || 'Convince visitors and drive the main CTA'}.`,
    `Required sections: ${sections || 'Hero, trust proof, features, CTA, footer'}.`,
    `Visual direction: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Additional notes: ${brief.notes}` : '',
    'Make the design responsive, polished, and ready for preview in a browser.',
    'Ensure the first screen is visibly populated with a heading, supporting copy, and at least one CTA.',
    base,
  ].filter(Boolean).join('\n')
}

function buildAppPrompt(brief: BriefFormState, direction: DirectionPreset, pageContext: string, base: string): string {
  return [
    'Create a complete web application UI as a single-page HTML document.',
    pageContext ? `\nMulti-page project context:\n${pageContext}\n` : '',
    `Application name: ${brief.product || 'A modern web application'}.`,
    `User role: ${brief.audience || 'General user'}.`,
    `Core modules/features to show: ${brief.sections || 'Dashboard, navigation, content area'}.`,
    `Main functionality: ${brief.goal || 'Manage and display data'}.`,
    `UI style: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Notes: ${brief.notes}` : '',
    'Use realistic mock data — fill tables, cards, and stats with plausible numbers and labels.',
    'Make the layout fully functional in appearance with proper navigation, breadcrumbs, and action buttons.',
    base,
  ].filter(Boolean).join('\n')
}

function buildEmailPrompt(brief: BriefFormState, direction: DirectionPreset, base: string): string {
  return [
    'Create a complete HTML email template.',
    'IMPORTANT: Use table-based layout for email client compatibility. All CSS must be inline on each element.',
    'Use email-safe fonts: Arial, Georgia, Helvetica, or system fonts only.',
    'Max width 600px, centered. Include a text version fallback in comments.',
    `Brand/sender: ${brief.product || 'A modern brand'}.`,
    `Email subject/purpose: ${brief.goal || 'A compelling email campaign'}.`,
    `Recipient: ${brief.audience || 'Subscribers'}.`,
    `CTA button text: ${brief.sections || 'Learn more'}.`,
    `Email style: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Notes: ${brief.notes}` : '',
    'Include: logo area (text-based placeholder), main content, CTA button, footer with unsubscribe link.',
    base,
  ].filter(Boolean).join('\n')
}

function buildEcommercePrompt(brief: BriefFormState, direction: DirectionPreset, pageContext: string, base: string): string {
  return [
    'Create a complete e-commerce page as a single HTML document.',
    pageContext ? `\nMulti-page project context:\n${pageContext}\n` : '',
    `Product / brand: ${brief.product || 'A premium product'}.`,
    `Target buyer: ${brief.audience || 'Online shoppers'}.`,
    `Price point and key selling points: ${brief.goal || 'Competitive price with great value'}.`,
    `Key sections to include: ${brief.sections || 'Product images, description, add to cart, reviews'}.`,
    `Style direction: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Notes: ${brief.notes}` : '',
    'Use realistic product images as CSS gradient placeholders. Fill in convincing product copy, specs, and reviews.',
    'Make buy buttons and interaction elements clearly visible and well-styled.',
    base,
  ].filter(Boolean).join('\n')
}

function buildPortfolioPrompt(brief: BriefFormState, direction: DirectionPreset, pageContext: string, base: string): string {
  return [
    'Create a complete personal portfolio or agency website as a single HTML document.',
    pageContext ? `\nMulti-page project context:\n${pageContext}\n` : '',
    `Name / brand: ${brief.product || 'A creative professional'}.`,
    `Role / field: ${brief.audience || 'Designer & Developer'}.`,
    `Skills and featured projects: ${brief.sections || 'Key skills, 3 featured projects'}.`,
    `Personal statement / positioning: ${brief.goal || 'Creating great digital experiences'}.`,
    `Visual style: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Notes: ${brief.notes}` : '',
    'Use placeholder images as CSS gradients for project thumbnails. Make the work section the focal point.',
    base,
  ].filter(Boolean).join('\n')
}

function buildComponentPrompt(brief: BriefFormState, direction: DirectionPreset, base: string): string {
  return [
    'Create a complete UI component showcase page as a single HTML document.',
    `Component set / design system: ${brief.product || 'A modern UI component library'}.`,
    `Use case / context: ${brief.goal || 'General web application'}.`,
    `States to demonstrate: ${brief.sections || 'default, hover, active, disabled, loading'}.`,
    `Design style / inspiration: ${brief.audience || 'Clean, modern design system'}.`,
    `Component style: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Notes: ${brief.notes}` : '',
    'Organize components in labeled sections with clear headings.',
    'Show multiple variants and states side by side. Use a neutral background for the showcase.',
    base,
  ].filter(Boolean).join('\n')
}

export function buildTweakPromptForType(
  brief: BriefFormState,
  direction: DirectionPreset,
  tweak: QuickTweak,
  html: string,
): string {
  const typeLabel = PAGE_TYPE_CONFIGS(false).find(c => c.id === brief.pageType)?.labelEn || 'page'
  return [
    `You are revising an existing ${typeLabel} HTML artifact.`,
    `Brief context: product/name=${brief.product || 'unspecified'}, goal=${brief.goal || 'unspecified'}.`,
    `Keep aligned with visual direction: ${direction.name}. ${direction.prompt}`,
    `Tweak goal: ${tweak.instruction}`,
    'Return a full improved HTML document, not notes.',
    'Keep it fully static and directly previewable: no React/Vue/Svelte shells, no external JS required.',
    'Avoid canvas- or library-driven rendering. If charts are needed, draw them with static HTML/CSS/SVG only.',
    'Current HTML artifact:',
    html,
  ].join('\n')
}

// ── Language support ──────────────────────────────────────────────────────────

export const OUTPUT_LANGUAGES = [
  { value: 'auto', label: '跟随界面', labelEn: 'Auto (follow UI)' },
  { value: 'zh-CN', label: '中文', labelEn: '中文 Chinese' },
  { value: 'en', label: 'English', labelEn: 'English' },
  { value: 'ja', label: '日本語', labelEn: '日本語 Japanese' },
  { value: 'ko', label: '한국어', labelEn: '한국어 Korean' },
  { value: 'fr', label: 'Français', labelEn: 'Français French' },
  { value: 'de', label: 'Deutsch', labelEn: 'Deutsch German' },
  { value: 'es', label: 'Español', labelEn: 'Español Spanish' },
]

const LANG_NAMES: Record<string, string> = {
  'zh-CN': 'Simplified Chinese (简体中文)',
  'en': 'English',
  'ja': 'Japanese (日本語)',
  'ko': 'Korean (한국어)',
  'fr': 'French (Français)',
  'de': 'German (Deutsch)',
  'es': 'Spanish (Español)',
}

// ── Page type config factory ──────────────────────────────────────────────────

export function PAGE_TYPE_CONFIGS(isZh: boolean): PageTypeConfig[] {
  return [
    {
      id: 'landing',
      label: '落地页',
      labelEn: 'Landing Page',
      icon: '🏠',
      briefFields: LANDING_FIELDS,
      defaultSections: isZh ? 'Hero, 社会证明, 功能介绍, CTA' : 'Hero, social proof, features, CTA',
      directions: landingDirections(isZh),
      tweaks: landingTweaks(isZh),
    },
    {
      id: 'app',
      label: 'App 页面',
      labelEn: 'App / Dashboard',
      icon: '🖥️',
      briefFields: APP_FIELDS,
      defaultSections: isZh ? '导航, 看板, 数据表格, 设置' : 'Navigation, dashboard, table, settings',
      directions: appDirections(isZh),
      tweaks: appTweaks(isZh),
    },
    {
      id: 'email',
      label: '邮件模板',
      labelEn: 'Email Template',
      icon: '✉️',
      briefFields: EMAIL_FIELDS,
      defaultSections: isZh ? '立即查看' : 'View now',
      directions: emailDirections(isZh),
      tweaks: emailTweaks(isZh),
    },
    {
      id: 'ecommerce',
      label: '电商页面',
      labelEn: 'E-commerce',
      icon: '🛍️',
      briefFields: ECOMMERCE_FIELDS,
      defaultSections: isZh ? '商品图, 详情, 加购, 评价' : 'Gallery, details, add to cart, reviews',
      directions: ecommerceDirections(isZh),
      tweaks: ecommerceTweaks(isZh),
    },
    {
      id: 'portfolio',
      label: '个人主页',
      labelEn: 'Portfolio',
      icon: '👤',
      briefFields: PORTFOLIO_FIELDS,
      defaultSections: isZh ? '自我介绍, 项目展示, 技能, 联系' : 'About, projects, skills, contact',
      directions: portfolioDirections(isZh),
      tweaks: portfolioTweaks(isZh),
    },
    {
      id: 'component',
      label: 'UI 组件',
      labelEn: 'UI Components',
      icon: '🧩',
      briefFields: COMPONENT_FIELDS,
      defaultSections: isZh ? 'default, hover, active, disabled' : 'default, hover, active, disabled',
      directions: componentDirections(isZh),
      tweaks: componentTweaks(isZh),
    },
  ]
}
