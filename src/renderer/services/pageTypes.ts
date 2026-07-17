import { BriefFormState } from '../stores/appStore'

export type PageType = 'landing' | 'app' | 'email' | 'ecommerce' | 'portfolio' | 'component' | 'slide'

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

// ── Design Systems ────────────────────────────────────────────────────────────

export interface DesignSystem {
  id: string
  name: string
  emoji: string
  description: string
  descriptionEn: string
  cssVars: string
  promptHint: string
}

export const DESIGN_SYSTEMS: DesignSystem[] = [
  {
    id: 'default',
    name: 'AI 自由发挥',
    emoji: '✨',
    description: '不限制风格，由 AI 自主决策',
    descriptionEn: 'No constraints — AI chooses freely',
    cssVars: '',
    promptHint: '',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    emoji: '💳',
    description: '简洁专业，深色文字+紫色强调',
    descriptionEn: 'Clean, trustworthy — navy text + purple accent',
    cssVars: `--bg: #ffffff; --bg-subtle: #f6f9fc; --surface: #f0f4f8;
--text: #0a2540; --text-secondary: #425466; --text-muted: #8898aa;
--accent: #635bff; --accent-hover: #4f46e5;
--border: #e4e9f2; --radius: 6px; --radius-lg: 10px;
--font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--shadow: 0 2px 8px rgba(10,37,64,.08); --shadow-lg: 0 8px 32px rgba(10,37,64,.12);`,
    promptHint: 'Stripe design language: clean white backgrounds, precise typography, subtle card shadows, navy text, and violet/purple CTAs. Financial-grade trust and clarity.',
  },
  {
    id: 'linear',
    name: 'Linear',
    emoji: '⚡',
    description: '深色极简，紫色高亮，开发者感',
    descriptionEn: 'Dark minimal, purple highlights, developer-focused',
    cssVars: `--bg: #0f0f11; --bg-subtle: #161618; --surface: #1c1c1f;
--text: #e4e4e7; --text-secondary: #a1a1aa; --text-muted: #52525b;
--accent: #7c3aed; --accent-hover: #8b5cf6;
--border: #27272a; --radius: 6px; --radius-lg: 12px;
--font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--shadow: 0 0 0 1px rgba(255,255,255,.06); --shadow-lg: 0 20px 60px rgba(0,0,0,.5);`,
    promptHint: 'Linear design language: dark background, minimal decorative elements, sharp typography, violet accent on near-black surfaces. Every element has purpose.',
  },
  {
    id: 'notion',
    name: 'Notion',
    emoji: '📓',
    description: '极简编辑风，米白色调，高可读',
    descriptionEn: 'Editorial minimal, cream tones, maximum readability',
    cssVars: `--bg: #ffffff; --bg-subtle: #f7f6f3; --surface: #efefed;
--text: #37352f; --text-secondary: #6b6d6a; --text-muted: #9b9b97;
--accent: #2eaadc; --accent-hover: #0b82bd;
--border: #e3e2df; --radius: 3px; --radius-lg: 6px;
--font: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif;
--shadow: rgba(15,15,15,.05) 0 0 0 1px, rgba(15,15,15,.1) 0 3px 6px; --shadow-lg: rgba(15,15,15,.1) 0 0 0 1px, rgba(15,15,15,.2) 0 8px 40px -8px;`,
    promptHint: 'Notion design language: minimal chrome, generous white space, subtle borders, clean sans-serif, and a calm content-first layout.',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    emoji: '▲',
    description: '深色单色调，现代科技感',
    descriptionEn: 'Dark monochrome, modern tech aesthetic',
    cssVars: `--bg: #000000; --bg-subtle: #0a0a0a; --surface: #111111;
--text: #ededed; --text-secondary: #888888; --text-muted: #444444;
--accent: #ffffff; --accent-hover: #ededed;
--border: #333333; --radius: 6px; --radius-lg: 12px;
--font: 'Geist', 'Inter', -apple-system, sans-serif;
--shadow: 0 0 0 1px rgba(255,255,255,.1); --shadow-lg: 0 8px 40px rgba(0,0,0,.8);`,
    promptHint: 'Vercel design language: stark black-and-white, clean geometric type, minimal decoration, high-contrast CTAs. Deploy-era confidence.',
  },
  {
    id: 'apple',
    name: 'Apple',
    emoji: '🍎',
    description: '大圆角，层次光影，高端质感',
    descriptionEn: 'Large radius, depth shadows, premium glass feel',
    cssVars: `--bg: #f5f5f7; --bg-subtle: #ffffff; --surface: #fbfbfd;
--text: #1d1d1f; --text-secondary: #6e6e73; --text-muted: #aeaeb2;
--accent: #0071e3; --accent-hover: #0077ed;
--border: rgba(0,0,0,.08); --radius: 12px; --radius-lg: 20px;
--font: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
--shadow: 0 2px 20px rgba(0,0,0,.08); --shadow-lg: 0 20px 60px rgba(0,0,0,.12);`,
    promptHint: 'Apple design language: generous padding, smooth rounded corners, clean SF Pro typography, subtle depth with soft shadows, light-gray backgrounds, and blue accents.',
  },
  {
    id: 'material',
    name: 'Material 3',
    emoji: '🎨',
    description: 'Google 风格，色彩分层，功能清晰',
    descriptionEn: 'Google Material You — tonal surfaces, clear hierarchy',
    cssVars: `--bg: #fffbfe; --bg-subtle: #f3edf7; --surface: #ece6f0;
--text: #1c1b1f; --text-secondary: #49454f; --text-muted: #79747e;
--accent: #6750a4; --accent-hover: #7965af;
--border: #cac4d0; --radius: 12px; --radius-lg: 28px;
--font: 'Roboto', 'Google Sans', -apple-system, sans-serif;
--shadow: 0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.24); --shadow-lg: 0 10px 20px rgba(0,0,0,.19), 0 6px 6px rgba(0,0,0,.23);`,
    promptHint: 'Material Design 3 language: dynamic color system with tonal containers, highly rounded cards, elevation through shadows, and clear information hierarchy.',
  },
  {
    id: 'antd',
    name: 'Ant Design',
    emoji: '🐜',
    description: '蓝色系企业风，精致中文界面',
    descriptionEn: 'Blue enterprise theme, refined Chinese SaaS aesthetic',
    cssVars: `--bg: #f0f2f5; --bg-subtle: #ffffff; --surface: #fafafa;
--text: rgba(0,0,0,.88); --text-secondary: rgba(0,0,0,.65); --text-muted: rgba(0,0,0,.45);
--accent: #1677ff; --accent-hover: #4096ff;
--border: #d9d9d9; --radius: 6px; --radius-lg: 8px;
--font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
--shadow: 0 1px 2px rgba(0,0,0,.04); --shadow-lg: 0 6px 16px rgba(0,0,0,.08), 0 3px 6px rgba(0,0,0,.04);`,
    promptHint: 'Ant Design language: professional blue accent, clean white cards, grey background, consistent 8px grid, and enterprise-grade data-dense layouts.',
  },
  {
    id: 'shadcn',
    name: 'shadcn/ui',
    emoji: '🧱',
    description: '中性锌灰，高对比，无侵入感',
    descriptionEn: 'Zinc neutrals, high contrast, zero-opinionated',
    cssVars: `--bg: #ffffff; --bg-subtle: #f4f4f5; --surface: #fafafa;
--text: #09090b; --text-secondary: #71717a; --text-muted: #a1a1aa;
--accent: #18181b; --accent-hover: #27272a;
--border: #e4e4e7; --radius: 6px; --radius-lg: 8px;
--font: var(--font-sans, ui-sans-serif, system-ui, sans-serif);
--shadow: 0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06); --shadow-lg: 0 10px 15px rgba(0,0,0,.1), 0 4px 6px rgba(0,0,0,.05);`,
    promptHint: 'shadcn/ui design language: neutral zinc palette, razor-sharp typography, minimal chrome, strong contrast. Components feel assembled, not designed.',
  },
  {
    id: 'framer',
    name: 'Framer',
    emoji: '🖼️',
    description: '深紫渐变，动感视觉，创意感',
    descriptionEn: 'Deep purple gradients, dynamic visuals, creative energy',
    cssVars: `--bg: #0e0e11; --bg-subtle: #151519; --surface: #1c1c23;
--text: #f1f1f3; --text-secondary: #9191a1; --text-muted: #54546a;
--accent: #9b8afb; --accent-hover: #b3a6fc;
--border: #2c2c3a; --radius: 10px; --radius-lg: 16px;
--font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--shadow: 0 0 0 1px rgba(255,255,255,.06), 0 4px 24px rgba(0,0,0,.4); --shadow-lg: 0 0 0 1px rgba(155,138,251,.15), 0 20px 60px rgba(0,0,0,.6);`,
    promptHint: 'Framer design language: dark canvas with gradient-washed surfaces, lavender purple accents, generous rounded corners, and vibrant visual depth.',
  },
  {
    id: 'github',
    name: 'GitHub',
    emoji: '🐙',
    description: '中性灰，代码感，开发者工具风',
    descriptionEn: 'Neutral grey, code-centric, developer-tooling feel',
    cssVars: `--bg: #ffffff; --bg-subtle: #f6f8fa; --surface: #eaeef2;
--text: #1f2328; --text-secondary: #656d76; --text-muted: #9198a1;
--accent: #0969da; --accent-hover: #0860ca;
--border: #d0d7de; --radius: 6px; --radius-lg: 12px;
--font: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
--shadow: 0 1px 3px rgba(31,35,40,.12); --shadow-lg: 0 8px 24px rgba(31,35,40,.12);`,
    promptHint: 'GitHub design language: clean neutral gray system, blue links and CTAs, octicon-style icons, monospace code blocks, and a developer-first information hierarchy.',
  },
]

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

function slideDirections(isZh: boolean): DirectionPreset[] {
  return [
    {
      id: 'slide-pitch',
      name: isZh ? '融资 Pitch' : 'Pitch Deck',
      summary: isZh ? '投资者路演，问题/方案/市场/团队。' : 'Investor deck — problem, solution, market, team.',
      prompt: 'Create a pitch deck for investors with slides: Title, Problem, Solution, Market Size, Product Demo, Business Model, Traction, Team, and Call to Action. Professional and compelling.',
    },
    {
      id: 'slide-product',
      name: isZh ? '产品演示' : 'Product Demo',
      summary: isZh ? '展示产品功能，带截图占位。' : 'Product walkthrough with UI mockup slides.',
      prompt: 'Create a product demo deck showing: Overview, Key Features (one per slide with CSS mockup), Workflow/How It Works, Integrations, and Pricing. Clean and visual.',
    },
    {
      id: 'slide-report',
      name: isZh ? '数据报告' : 'Data Report',
      summary: isZh ? '数字驱动，图表、KPI、趋势。' : 'Data-driven slides with charts, KPIs, and trends.',
      prompt: 'Create a data report presentation with slides for: Executive Summary, Key Metrics (stat cards), Trend Analysis (CSS charts), Regional Breakdown, Insights & Recommendations, and Next Steps.',
    },
    {
      id: 'slide-course',
      name: isZh ? '课程/培训' : 'Course / Training',
      summary: isZh ? '教学大纲，知识点，练习题。' : 'Course outline, learning objectives, exercises.',
      prompt: 'Create an educational presentation with slides for: Course Overview, Learning Objectives, Module Breakdowns (one per slide), Key Concepts with visual examples, Practice Exercises, and Summary/Quiz.',
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

function slideTweaks(isZh: boolean): QuickTweak[] {
  return [
    { id: 'slide-dark', label: isZh ? '深色主题' : 'Dark Theme', instruction: 'Convert all slides to a dark theme with deep background colors, light text, and vibrant accent colors.' },
    { id: 'slide-visual', label: isZh ? '更多图表' : 'More Visuals', instruction: 'Add more visual elements to each slide: CSS charts, icon grids, numbered steps, and data callouts.' },
    { id: 'slide-minimal', label: isZh ? '极简风格' : 'More Minimal', instruction: 'Simplify each slide to one key idea: large headline, minimal supporting text, strong visual hierarchy.' },
    { id: 'slide-anim', label: isZh ? '加过渡动效' : 'Add Transitions', instruction: 'Add CSS slide-in transition animations between slides for a more polished presentation feel.' },
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

const SLIDE_FIELDS: BriefField[] = [
  { key: 'product', label: '演讲标题 / 主题', labelEn: 'Presentation Title', placeholder: 'Q1 业务回顾、产品发布会、融资路演…', placeholderEn: 'Q1 business review, product launch, Series A pitch…' },
  { key: 'audience', label: '受众', labelEn: 'Audience', placeholder: '投资人、团队内部、客户、学员…', placeholderEn: 'Investors, internal team, customers, students…' },
  { key: 'goal', label: '核心信息', labelEn: 'Core Message', placeholder: '我们已准备好 A 轮融资、产品解决了 X 问题…', placeholderEn: 'We are ready for Series A, product solves X…' },
  { key: 'sections', label: '幻灯片章节', labelEn: 'Slide Sections', placeholder: '封面, 问题, 解决方案, 市场, 团队, 结尾', placeholderEn: 'Cover, Problem, Solution, Market, Team, CTA' },
  { key: 'notes', label: '补充说明', labelEn: 'Notes', placeholder: '幻灯片数量、配色偏好、特殊内容…', placeholderEn: 'Number of slides, brand colors, special content…', multiline: true },
]

// ── Prompt builders per type ──────────────────────────────────────────────────

export const HTML_SAFETY_RULES = `
CRITICAL HTML OUTPUT RULES — MUST FOLLOW:
1. Output a single, complete, self-contained HTML document starting with <!DOCTYPE html>.
2. Every HTML element MUST use a real HTML tag name (div, span, nav, aside, main, header, section, ul, li, button, etc.). NEVER write angle-bracket syntax as visible text content.
3. All CSS must be in a <style> block in <head>. Never use style attributes unless absolutely required for email.
4. Do NOT use template variables, placeholder syntax like {{variable}}, {var}, or <%=var%> anywhere in the output.
5. Do NOT output React JSX, Vue templates, Svelte, Angular, or any component framework syntax.
6. Do NOT use any external JavaScript libraries, CDN links, or script tags that fetch remote resources. Google Fonts @import in CSS is the only allowed external resource.
7. Charts and graphs MUST be drawn with pure CSS or inline SVG — never use Chart.js, D3, or canvas APIs.
8. The page must render correctly with zero JavaScript — all content must be in the HTML markup.
9. Use realistic, plausible mock content — never write "[placeholder]", "Lorem ipsum", or "TODO" as visible text.
10. Images must be CSS gradient backgrounds or inline SVG — never use broken <img src=""> with fake URLs.`.trim()

export const VISUAL_QUALITY_RULES = `
VISUAL DESIGN REQUIREMENTS — make this page genuinely beautiful:

TYPOGRAPHY (mandatory):
- Import Inter from Google Fonts: @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
- Type scale: body 15-16px/1.6, caption 12-13px, label 11px/uppercase/0.08em tracking, h3 18-20px, h2 24-28px, h1 36-48px, hero 52-80px.
- Hero headline: font-weight 800, letter-spacing -0.03em to -0.05em, line-height 1.05-1.1.
- Subheadlines: font-weight 500-600, color slightly muted from primary text.
- Never use default browser fonts or generic system-ui alone.

COLOR & GRADIENTS (mandatory):
- Define a purposeful palette in :root with CSS custom properties. Choose ONE of these approaches:
  (A) Light premium: --bg: #ffffff, --bg-subtle: #f8f9fc, --text: #0f172a, --text-2: #475569, --accent: a rich color (e.g. #6366f1, #0ea5e9, #f59e0b, #10b981 — pick based on product personality).
  (B) Dark premium: --bg: #0a0a0f or #0f1117, --bg-card: #16161e, --text: #f1f5f9, --text-2: #94a3b8, --accent: a vibrant glowing color.
- Hero section MUST use a gradient background — either a rich multi-stop gradient, a dark overlay on a gradient, or an abstract SVG blob/mesh background.
- Use gradient text (background-clip: text) for at least one key headline.
- CTA buttons: gradient background, no flat single-color buttons for primary actions.

SPACING & LAYOUT (mandatory):
- Section padding: 96px 0 (min 80px) — never cramped.
- Card padding: 28-36px.
- Max content width: 1200px, centered with auto margins.
- Use CSS Grid for feature grids (auto-fit, minmax(280px, 1fr)).
- Gaps between cards: 24px minimum.

SHADOWS & DEPTH (mandatory):
- Subtle cards: box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
- Elevated cards: box-shadow: 0 4px 12px rgba(0,0,0,.08), 0 16px 40px rgba(0,0,0,.06);
- Accent glow (for colored elements): box-shadow: 0 8px 32px rgba(var-accent-rgb, 0.25);
- Hero images/mockups: 0 24px 80px rgba(0,0,0,.2);

MICRO-INTERACTIONS (mandatory):
- ALL interactive elements: transition: all 0.2s ease;
- Cards on hover: transform: translateY(-4px); + elevated shadow.
- Buttons on hover: brightness(1.1) or translateY(-2px) + enhanced shadow.
- Nav links: color transition + optional left-border accent on active.

VISUAL RICHNESS (mandatory):
- Hero section: must have a background visual — choose from: radial-gradient blobs, SVG wave/shape, CSS mesh gradient, glassmorphism overlay, or diagonal geometric patterns.
- Section dividers: use subtle gradient fades or curved SVG dividers, not plain <hr>.
- At least 2 sections should use a different background color/texture to create visual rhythm.
- Feature icons: use colored icon containers (gradient background, rounded-xl) not plain Unicode alone.
- Stats/numbers: display them at large scale (48-64px, bold) with a unit and label below.
- Avoid: flat all-white or all-gray pages; rectangular images with no visual treatment; walls of plain text with no visual breaks.`.trim()

export function buildPromptForType(brief: BriefFormState, direction: DirectionPreset, pageContext = ''): string {
  const lang = brief.outputLang && brief.outputLang !== 'auto'
    ? `\nLANGUAGE: All visible text content in the page MUST be written in ${LANG_NAMES[brief.outputLang] || brief.outputLang}. Do not mix in English unless the target language is English.`
    : ''
  const darkInstruction = brief.darkMode
    ? '\nDARK MODE: Use a dark background color scheme (dark grays/blacks for backgrounds, light text, vibrant accent colors) with strong contrast ratio (≥4.5:1) throughout the entire page.'
    : ''

  const ds = DESIGN_SYSTEMS.find(d => d.id === (brief.designSystemId || 'default'))
  const dsInstruction = ds && ds.id !== 'default' && ds.cssVars
    ? `\nDESIGN SYSTEM — ${ds.name}: Apply these CSS custom properties in :root {}:\n${ds.cssVars}\n${ds.promptHint}`
    : ''

  // Email doesn't support modern CSS — skip visual quality rules for it
  const visualRules = brief.pageType !== 'email' ? VISUAL_QUALITY_RULES : ''
  const base = [HTML_SAFETY_RULES, visualRules, lang, darkInstruction, dsInstruction].filter(Boolean).join('\n')

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
    case 'slide':
      return buildSlidePrompt(brief, direction, base)
    default:
      return buildLandingPrompt(brief, direction, pageContext, base)
  }
}

function buildLandingPrompt(brief: BriefFormState, direction: DirectionPreset, pageContext: string, base: string): string {
  const sections = brief.sections.split(',').map(s => s.trim()).filter(Boolean).join(', ')
  return [
    'Create a stunning, production-quality single-page marketing website that looks like it was designed by a top agency.',
    pageContext ? `\nMulti-page project context:\n${pageContext}\n` : '',
    `Product or brand: ${brief.product || 'A modern digital product'}.`,
    `Target audience: ${brief.audience || 'Prospective customers evaluating the offer'}.`,
    `Primary goal: ${brief.goal || 'Convince visitors and drive the main CTA'}.`,
    `Required sections: ${sections || 'Hero, social proof, features, pricing, CTA, footer'}.`,
    `Visual direction: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Additional notes: ${brief.notes}` : '',
    '',
    'SECTION-BY-SECTION REQUIREMENTS:',
    '',
    'HERO (must be visually striking):',
    '- Full-viewport height (min-height: 100vh) with a rich gradient or mesh background — not plain white.',
    '- Sticky navigation bar with logo (text-based), nav links, and a CTA button.',
    '- Headline: use clamp(2.8rem, 5vw, 5.5rem), font-weight 800, letter-spacing -0.04em — specific and compelling, not generic.',
    '- Subheadline: max 2 lines, muted color, 18-20px, max-width 560px.',
    '- CTA buttons: primary (gradient) + secondary (outline/ghost), side by side.',
    '- Visual element: a CSS-rendered product mockup (browser frame, dashboard card, or abstract 3D-ish shape) floating to the right, with a strong drop shadow.',
    '- Social proof hint: small line below CTAs — "Trusted by 2,000+ teams" with avatar circles (colored CSS circles).',
    '',
    'SOCIAL PROOF / LOGOS SECTION:',
    '- "Trusted by" or "Used at" section with 5-6 fake company names in a logo strip.',
    '- Style: slightly muted, grayscale-ish treatment.',
    '',
    'FEATURES SECTION:',
    '- Headline + 6 feature cards in a 3-column CSS Grid (auto-fit, minmax(280px, 1fr)).',
    '- Each card: icon (emoji in a gradient-background rounded container), bold title, 2-line description.',
    '- Cards have white/elevated background with subtle border and lift on hover.',
    '',
    'STATS / PROOF SECTION (optional but recommended):',
    '- 3-4 large numbers (e.g. "10,000+", "99.9%", "4.9★") with labels underneath.',
    '- Dark or accent background to create visual contrast.',
    '',
    'HOW IT WORKS / STEPS (if applicable):',
    '- 3 numbered steps with icons, titles, and short descriptions.',
    '- Connected with a subtle line or arrow between steps.',
    '',
    'PRICING (if requested):',
    '- 3-column card layout (Free, Pro, Enterprise). Highlight the middle plan.',
    '- List 5-6 features per plan, include a CTA button per plan.',
    '',
    'TESTIMONIALS:',
    '- 3 testimonial cards with quote, avatar (gradient circle), name, and role.',
    '',
    'CTA SECTION (bottom):',
    '- Dark or gradient background section with large headline + primary CTA button.',
    '',
    'FOOTER:',
    '- Multi-column: logo + tagline, links grouped by category (Product, Company, Legal), social icons.',
    '- Subtle top border, copyright line at bottom.',
    '',
    'Responsive: mobile-first, breakpoints at 768px and 1024px.',
    base,
  ].filter(Boolean).join('\n')
}

function buildAppPrompt(brief: BriefFormState, direction: DirectionPreset, pageContext: string, base: string): string {
  return [
    'Create a stunning, pixel-perfect web application UI as a single self-contained HTML document. It should look like a real product screenshot from a funded SaaS company.',
    pageContext ? `\nMulti-page project context:\n${pageContext}\n` : '',
    `Application name: ${brief.product || 'Pulse Dashboard'}.`,
    `User role: ${brief.audience || 'Admin / Operations user'}.`,
    `Core modules to show: ${brief.sections || 'Dashboard overview, data table, navigation, settings panel'}.`,
    `Main functionality: ${brief.goal || 'Monitor and manage data, view analytics'}.`,
    `UI style: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Notes: ${brief.notes}` : '',
    '',
    'LAYOUT ARCHITECTURE (mandatory CSS structure):',
    '- Outer wrapper: display:flex; height:100vh; overflow:hidden; on body.',
    '- Sidebar: width:240px; flex-shrink:0; height:100vh; overflow-y:auto; border-right; background slightly different from main.',
    '  • Top: logo + app name (bold, 15px).',
    '  • Nav section labels (UPPERCASE, 10px, muted, tracking-wider) above groups of nav items.',
    '  • Nav items: icon (SVG or Unicode in a 20px container) + label; active state: accent bg + colored text; hover: subtle bg.',
    '  • Bottom: avatar + user name + role + settings icon.',
    '- Main: flex:1; overflow-y:auto; display:flex; flex-direction:column.',
    '  • Top bar: height 56-64px; sticky; border-bottom; breadcrumb/title on left; search + notifications + avatar on right.',
    '  • Content area: padding 24-32px; display:flex; flex-direction:column; gap:24px.',
    '',
    'CONTENT REQUIREMENTS — make data feel real and specific:',
    '- Stat cards (4 minimum): gradient accent top-border OR colored icon on white; large number (32-40px, bold); label above; trend badge (+12.4% ▲) with color; mini SVG sparkline (8-10 path points).',
    '- Charts: one CSS bar chart (flex columns, different heights, colored bars with gradient fills) OR inline SVG line/area chart. Include axis labels and a legend.',
    '- Data table: styled with alternating row bg; 6+ rows of realistic data; status badges (pill shape, green/yellow/red); action buttons (icon buttons); checkbox column; sortable column headers.',
    '- All numbers and names must be product-specific and realistic (not "User 1", "Item A").',
    '- Include at least one secondary widget: recent activity list, progress bars, or a mini pie chart.',
    base,
  ].filter(Boolean).join('\n')
}

function buildEmailPrompt(brief: BriefFormState, direction: DirectionPreset, base: string): string {
  return [
    'Create a complete, production-ready HTML email template.',
    '',
    'EMAIL-SPECIFIC REQUIREMENTS:',
    '- Use table-based layout ONLY for compatibility with Outlook, Gmail, and Apple Mail.',
    '- Every style MUST be inline on each element (no <style> block — email clients strip them).',
    '- Max content width: 600px, centered in a full-width wrapper table.',
    '- Fonts: Arial, Georgia, Helvetica, Verdana, or Times New Roman only.',
    '- Avoid: CSS Grid, Flexbox, CSS variables, :hover, @media queries (use inline width instead).',
    '- All images must be represented as colored table cells with text, not <img> tags.',
    '',
    `Brand / sender: ${brief.product || 'Nova Brand'}.`,
    `Email purpose / subject: ${brief.goal || 'Monthly product update'}.`,
    `Recipient audience: ${brief.audience || 'Active subscribers'}.`,
    `Primary CTA button text: ${brief.sections || 'View Now'}.`,
    `Email style: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Notes: ${brief.notes}` : '',
    '',
    'STRUCTURE (in order):',
    '1. Header table: logo text + brand color background.',
    '2. Hero section: headline, 2–3 sentence body copy.',
    '3. Content sections (2–3 blocks): text + image placeholder cells side by side.',
    '4. CTA button: centered, prominent, rounded rectangle.',
    '5. Footer: brand name, address placeholder, unsubscribe link, copyright.',
    base,
  ].filter(Boolean).join('\n')
}

function buildEcommercePrompt(brief: BriefFormState, direction: DirectionPreset, pageContext: string, base: string): string {
  return [
    'Create a polished, conversion-optimized e-commerce page that looks like a real online store (Shopify-quality or better).',
    pageContext ? `\nMulti-page project context:\n${pageContext}\n` : '',
    `Product / brand: ${brief.product || 'Premium wireless headphones'}.`,
    `Target buyer: ${brief.audience || 'Online shoppers'}.`,
    `Price point and key selling propositions: ${brief.goal || '$149 — 40hr battery, active noise cancelling'}.`,
    `Required sections: ${brief.sections || 'Product gallery, description, specifications, add to cart, reviews'}.`,
    `Style direction: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Notes: ${brief.notes}` : '',
    '',
    'DESIGN REQUIREMENTS:',
    '- Navigation: clean sticky top bar with logo, categories, search icon, cart icon (with badge), account icon.',
    '- Product gallery: large main image as a rich CSS gradient (product-appropriate colors/angles); 4 small thumbnail swatches below, with active state border. Gallery area: min-height 480px.',
    '- Product info: large price (28-32px, bold), discount badge ("Save 20%"), title (24-28px), rating stars (★★★★½ + review count), short description, and delivery estimate.',
    '- Variant selector: color circles (8 real CSS colors), size buttons (S/M/L/XL with border toggle), quantity +/- control.',
    '- Add to cart: full-width gradient button, bold, 52px height. Wishlist icon button beside it.',
    '- Trust strip: 3-4 inline badges — 🔒 Secure checkout · 🔄 Free returns · ⚡ Fast shipping · ✅ Guaranteed.',
    '- Specifications: clean 2-column grid or table with 8 real spec rows for this product.',
    '- Reviews: 3 detailed customer reviews — avatar (colored CSS circle + initials), verified badge, star rating, title, body, date.',
    '- Related products: 4 product cards in a horizontal row — gradient thumbnail, title, price, rating, "Add to cart" button.',
    '- Footer: minimal with brand links and trust/security badges.',
    base,
  ].filter(Boolean).join('\n')
}

function buildPortfolioPrompt(brief: BriefFormState, direction: DirectionPreset, pageContext: string, base: string): string {
  return [
    'Create a stunning, award-worthy personal portfolio or agency website as a single self-contained HTML document. It should look like a Awwwards-nominated site — not a generic template.',
    pageContext ? `\nMulti-page project context:\n${pageContext}\n` : '',
    `Name / brand: ${brief.product || 'Alex Chen'}.`,
    `Role / field: ${brief.audience || 'UI/UX Designer & Developer'}.`,
    `Skills and featured projects: ${brief.sections || 'React, Figma, Node.js — 3 featured case study projects'}.`,
    `Personal statement / positioning: ${brief.goal || 'I craft digital experiences that users love'}.`,
    `Visual style: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Notes: ${brief.notes}` : '',
    '',
    'SECTION-BY-SECTION REQUIREMENTS:',
    '',
    'NAVIGATION:',
    '- Minimal sticky nav: name/logo on left, 4-5 nav links on right (About, Work, Skills, Contact), optional CTA button.',
    '- Nav links with smooth underline animation on hover (CSS only).',
    '',
    'HERO (full viewport, visually dramatic):',
    '- min-height: 100vh with a striking background — gradient mesh, abstract SVG shapes, or dark overlay with CSS particle-like dots.',
    '- Name: clamp(3.5rem, 7vw, 7rem), font-weight 800, letter-spacing -0.04em. Apply gradient text (background-clip:text) to either the name or a key word.',
    '- Title/role: 20-24px, muted color, slight letter spacing, possibly with a colored accent.',
    '- Tagline: 2 lines max, 17-18px, max-width 520px.',
    '- 2 CTA buttons side by side: primary (gradient fill) + secondary (ghost/outline).',
    '- Visual element: a floating "work preview" — a CSS-drawn browser frame or device mockup showing a colorful gradient interior, with box-shadow: 0 24px 80px rgba(0,0,0,.3).',
    '- Scroll hint: small animated chevron or "scroll" text at bottom.',
    '',
    'ABOUT / BIO SECTION:',
    '- Two-column: left = avatar placeholder (large circle or square, gradient fill, initials) + social links; right = bio text.',
    '- Bio: 2-3 engaging paragraphs. Specific, human, not corporate-speak.',
    '- Skill badges: inline pill/tag elements, each with a subtle background and colored dot or icon. Group by category (Design Tools, Dev Stack, Other).',
    '- Stats row: 3 numbers like "5+ Years", "40+ Projects", "12 Clients" — large bold numerals.',
    '',
    'FEATURED WORK / PROJECTS (the visual centrepiece):',
    '- 3 project case study cards, large — at least 320px tall.',
    '- Each card: full-bleed CSS gradient thumbnail (each project a DIFFERENT gradient palette), overlay with project title + tags on hover.',
    '- Card info below: project title (18-20px, bold), 2-line description, tech stack tags (pill shape), and "View Case Study →" link.',
    '- Cards on hover: lift (translateY(-8px)) + elevated shadow.',
    '- Layout: alternating or masonry-style, not a boring equal 3-column grid.',
    '',
    'SKILLS / EXPERTISE:',
    '- Visual skill bars OR a icon grid of logos (use Unicode/emoji as icons) with name and proficiency level.',
    '- Grouping: Frontend, Backend, Design, Tools — each group with a subtle label.',
    '',
    'EXPERIENCE TIMELINE:',
    '- Vertical timeline with 3 entries: company name (bold), role, date range, 2-3 bullet points.',
    '- Timeline line: a gradient left border (::before pseudo-element).',
    '- Company name in accent color.',
    '',
    'TESTIMONIALS (optional but impressive):',
    '- 2 quotes in large quotation marks. Author: name, role, company. Slightly different bg from surrounding sections.',
    '',
    'CONTACT SECTION:',
    '- Dark or colored background for contrast.',
    '- Large "Let\'s work together" headline.',
    '- Contact card with email (prominently styled), LinkedIn, GitHub, and Dribbble links as icon+text buttons.',
    '- Optional: a minimal 3-field contact form (Name, Email, Message) with styled inputs.',
    '',
    'FOOTER:',
    '- Minimal: name, year, copyright. Social icon row.',
    '',
    'Responsive: stacks to single-column on mobile. Project cards go full-width.',
    base,
  ].filter(Boolean).join('\n')
}

function buildComponentPrompt(brief: BriefFormState, direction: DirectionPreset, base: string): string {
  return [
    'Create a polished, professional UI component showcase page — the kind of page Radix UI, shadcn/ui, or Chakra UI would have. A single self-contained HTML document that looks like a real design system documentation site.',
    `Component set / design system: ${brief.product || 'Nova UI Component Library'}.`,
    `Use case / context: ${brief.goal || 'General web application'}.`,
    `States to demonstrate: ${brief.sections || 'default, hover, active, focus, disabled, loading, error'}.`,
    `Design style / inspiration: ${brief.audience || 'Clean, modern, accessible design system'}.`,
    `Component style: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Notes: ${brief.notes}` : '',
    '',
    'PAGE LAYOUT (mandatory):',
    '- Sticky top header: system name/logo left, search input center (static), GitHub/docs links right.',
    '- Two-column layout: fixed left sidebar (220px) with component navigation links, right content area (flex:1, max-width 960px, padding 40px).',
    '- Sidebar sections labeled (e.g. "FORM CONTROLS", "DISPLAY", "FEEDBACK") with nav items below each.',
    '- Active nav item: accent background, bold text.',
    '',
    'COMPONENT SECTIONS — each with this structure:',
    '1. Section title (h2, 22-24px, bold, with a subtle bottom border).',
    '2. Description: one sentence explaining the component.',
    '3. Preview area: light-gray or subtle-pattern background box, 16px padding, rounded-lg, border.',
    '4. Inside preview: all variants side-by-side (flex row, flex-wrap, gap 12px).',
    '5. Prop/variant labels: small text below each variant (11px, muted, monospace font).',
    '',
    'REQUIRED COMPONENT SECTIONS (implement all of these):',
    '',
    'BUTTONS:',
    '- Variants: Primary (gradient bg), Secondary (white + border), Ghost (transparent + border), Danger (red), Success (green).',
    '- Sizes: sm (28px), md (36px, default), lg (44px) shown for primary variant.',
    '- States: Default, Hover (CSS :hover), Disabled (opacity 0.4, cursor not-allowed), Loading (inline CSS spinner animation).',
    '- Icon buttons: icon-only square, icon + label.',
    '',
    'FORM INPUTS:',
    '- Text input: default, focus (accent ring: 0 0 0 3px rgba(accent,.2)), error (red border + error icon), disabled.',
    '- Textarea, Select (custom styled arrow), Checkbox (custom CSS checked state), Radio buttons, Toggle switch (pure CSS, animated).',
    '- Input with prefix icon, input with suffix button (e.g. copy icon).',
    '- Form group: label + input + helper text + error message all together.',
    '',
    'CARDS:',
    '- Basic card: white bg, border, shadow, 24px padding, rounded-lg.',
    '- Media card: gradient/image top half, content below.',
    '- Interactive card: hover lift (translateY(-4px) + stronger shadow).',
    '- Stat card: large number (40px, bold), label, trend indicator badge.',
    '',
    'BADGES & CHIPS:',
    '- Status: Success (green), Warning (amber), Error (red), Info (blue), Neutral (gray) — all as colored pill badges.',
    '- Outline variants for all.',
    '- Removable chip: with × icon.',
    '- Dot badge: notification count overlay on an icon.',
    '',
    'ALERTS & TOASTS:',
    '- Alert variants: success, warning, error, info — each with left-colored-border, icon, title, and body text.',
    '- Toast notification: floating card style (white, shadow-lg), icon, title, close button, progress bar at bottom.',
    '',
    'DATA DISPLAY:',
    '- Table: header row (bg-subtle, uppercase labels), data rows with alternating stripe, hover highlight, status badge column, action column (icon buttons).',
    '- Progress bars: 3 variants at different percentages, with label and % text.',
    '- Avatar: circle with initials, sizes sm/md/lg, stacked avatar group.',
    '- Skeleton loaders: gray animated shimmer for a card, a text block, and a table row.',
    '',
    'NAVIGATION:',
    '- Top bar: shown in a contained box — logo, nav links with hover/active state, CTA button.',
    '- Sidebar: vertical nav with icons + labels, nested sub-items, active + hover states.',
    '- Tabs: horizontal tab row with active underline, and a panel content area below.',
    '- Breadcrumb: Home › Section › Page with proper separator.',
    '',
    'USE CSS :hover AND :focus-within for all interactive states — no JavaScript needed.',
    'Define a clean :root color palette at the top and use CSS custom properties consistently across all components.',
    base,
  ].filter(Boolean).join('\n')
}

function buildSlidePrompt(brief: BriefFormState, direction: DirectionPreset, base: string): string {
  const sections = brief.sections.split(',').map(s => s.trim()).filter(Boolean)
  const slidesHint = sections.length >= 3
    ? `Slides to create (in order): ${sections.join(' → ')}.`
    : `Create 7–10 slides covering: ${brief.sections || 'Cover, Problem, Solution, Key Points, Data, Team, CTA'}.`

  return [
    'Create a visually stunning, presentation-quality HTML slide deck — the kind you would build in Pitch.com or a premium Keynote theme. Single self-contained HTML file.',
    '',
    `Presentation title / topic: ${brief.product || 'Product Pitch Deck'}.`,
    `Target audience: ${brief.audience || 'Business stakeholders'}.`,
    `Core message: ${brief.goal || 'Compelling story with clear takeaways'}.`,
    slidesHint,
    `Visual direction: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Additional notes: ${brief.notes}` : '',
    '',
    'SLIDE STRUCTURE (mandatory):',
    '- Each slide is a <section class="slide"> element inside a #deck container.',
    '- Navigation: ← → arrow buttons absolutely positioned left/right center, large enough to click (40px+). Plus a slide counter "3 / 8".',
    '- Keyboard navigation: left/right arrow keys and Space bar advance slides (pure vanilla JS).',
    '- Progress bar: a 4px bar at the very top of the viewport, accent-colored, width updates as percentage.',
    '',
    'CSS LAYOUT RULES (mandatory):',
    '- body, html: margin:0; padding:0; overflow:hidden; height:100%; background:#000;',
    '- #deck: position:relative; width:100vw; height:100vh; overflow:hidden;',
    '- .slide { display:none; position:absolute; inset:0; width:100%; height:100%; flex-direction:column; justify-content:center; align-items:flex-start; padding: 60px 80px; box-sizing:border-box; }',
    '- .slide.active { display:flex; }',
    '- Add a CSS fade or slide transition: .slide { opacity:0; transform:translateX(30px); transition: opacity .35s ease, transform .35s ease; } .slide.active { opacity:1; transform:translateX(0); }',
    '',
    'VISUAL DESIGN — make slides look genuinely premium:',
    '- Define a master color palette in :root: --bg (slide background), --bg-alt (darker/lighter variant), --text, --text-muted, --accent, --accent-2.',
    '- Each slide MUST have its OWN background treatment — vary between: solid dark, gradient, accent-colored, image-like SVG pattern, or split layout.',
    '- Slide number labels (e.g. "01", "02") as large muted background text or small top-corner labels.',
    '- Divider lines: use gradient lines (background: linear-gradient(90deg, accent, transparent)) not plain <hr>.',
    '- Icons: use emoji or Unicode symbols inside colored rounded containers (32-40px, gradient bg).',
    '- Numbers/stats: HUGE display (clamp(3rem, 8vw, 7rem)) with a thin label below — never small.',
    '- Bullet lists: custom CSS bullets (accent-colored dot or arrow), line-height 1.8, not cramped.',
    '',
    'SLIDE CONTENT TYPES — use the right visual for each slide:',
    '',
    'COVER SLIDE:',
    '- Full-viewport gradient or dark bg with an abstract SVG shape or geometric CSS pattern.',
    '- Title: clamp(2.5rem, 5vw, 5rem), font-weight 800, letter-spacing -0.03em, optionally gradient text.',
    '- Subtitle: 18-20px, muted. Presenter name + date: small, bottom-left.',
    '- Decorative: large semi-transparent circle or geometric shape behind the text.',
    '',
    'PROBLEM / CHALLENGE SLIDE:',
    '- 2-3 pain points as large icon + bold text pairs (flex row or grid).',
    '- Pain points in a colored callout box (red/amber tint bg, colored left border).',
    '',
    'SOLUTION / PRODUCT SLIDE:',
    '- Split layout: left = text + bullets; right = CSS "product mockup" (a stylized card/window frame with gradient interior).',
    '',
    'DATA / METRICS SLIDE:',
    '- 3-4 stat callouts: huge number (accent color), unit, label. Layout as a 2×2 grid or horizontal row.',
    '- OPTIONALLY: a CSS bar chart (flex columns, different heights, gradient bars, axis labels).',
    '',
    'LIST / FEATURES SLIDE:',
    '- 4-6 items in a 2-column grid. Each: icon container + bold title + 1 line of description.',
    '- Cards with subtle bg, border, and padding.',
    '',
    'TEAM SLIDE:',
    '- 3-4 person cards: gradient circle avatar (with initials), name (bold), title (muted), 1-line bio.',
    '',
    'CTA / CLOSING SLIDE:',
    '- Dark or full-accent background.',
    '- Big bold message: clamp(2.5rem, 5vw, 4.5rem).',
    '- Contact info or next-step action prominently displayed.',
    '- Optional: gradient glow behind the headline (box-shadow or filter:blur).',
    '',
    'JAVASCRIPT (minimal, clean):',
    'One inline <script>:',
    '1. `let cur = 0;` and `const slides = document.querySelectorAll(".slide");`',
    '2. `function go(n) { slides[cur].classList.remove("active"); cur = Math.max(0, Math.min(n, slides.length-1)); slides[cur].classList.add("active"); document.querySelector("#counter").textContent = (cur+1)+" / "+slides.length; document.querySelector("#progress").style.width = ((cur+1)/slides.length*100)+"%"; }`',
    '3. Prev/next button onclick calls `go(cur-1)` and `go(cur+1)`.',
    '4. keydown listener: ArrowLeft → go(cur-1), ArrowRight/Space → go(cur+1).',
    '5. `go(0)` on init.',
    '',
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
  const isEmail = brief.pageType === 'email'
  return [
    `You are revising an existing ${typeLabel} HTML artifact. Return only the complete improved HTML document.`,
    `Brief context: product/name="${brief.product || 'unspecified'}", goal="${brief.goal || 'unspecified'}".`,
    `Maintain visual direction: ${direction.name}. ${direction.prompt}`,
    `Improvement goal: ${tweak.instruction}`,
    '',
    'OUTPUT RULES:',
    '- Return a complete, self-contained HTML document. No explanations, no markdown code fences.',
    '- Keep all existing content — only change styling, layout, or copy as directed by the improvement goal.',
    '- Every HTML element must use proper tag names. Never output HTML attribute syntax as visible text.',
    '- No React/Vue/Svelte/framework syntax. No external JavaScript libraries.',
    '- Charts and data visualizations must use CSS or inline SVG only.',
    isEmail ? '' : '- Preserve or improve the existing visual quality: gradient backgrounds, shadow depth, typography scale, hover micro-interactions. Do NOT flatten or simplify the design unless the improvement goal explicitly asks for it.',
    '',
    'CURRENT HTML:',
    html,
  ].filter(s => s !== null && s !== undefined).join('\n')
}

// ── Template library ─────────────────────────────────────────────────────────

export interface PageTemplate {
  id: string
  pageType: PageType
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  gradient: string
  directionId: string
  brief: {
    product: string
    audience: string
    goal: string
    sections: string
    notes: string
  }
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  // ── Landing pages ──────────────────────────────────────────────────────────
  {
    id: 'landing-saas',
    pageType: 'landing',
    name: 'SaaS 产品官网',
    nameEn: 'SaaS Product Site',
    description: '清晰的功能展示、价格表、用户证言',
    descriptionEn: 'Features, pricing table, social proof',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    directionId: 'saas-conversion',
    brief: {
      product: 'Pulse Analytics — AI 驱动的用户行为分析平台',
      audience: '中小型 SaaS 公司的产品经理和增长团队',
      goal: '免费试用注册，推动演示预约',
      sections: 'Hero, 核心功能, 产品截图, 用户评价, 定价方案, FAQ, CTA',
      notes: '专业、值得信赖、数据驱动的语气。强调"无需代码"和"5 分钟上手"。',
    },
  },
  {
    id: 'landing-agency',
    pageType: 'landing',
    name: '创意机构官网',
    nameEn: 'Creative Agency Site',
    description: '震撼视觉、作品展示、服务介绍',
    descriptionEn: 'Bold visuals, case studies, services',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    directionId: 'editorial-premium',
    brief: {
      product: 'Studio Prism — 品牌设计与数字体验工作室',
      audience: '寻找创意合作伙伴的 B 端企业和品牌方',
      goal: '展示工作室实力，吸引项目咨询',
      sections: 'Hero, 服务项目, 精选案例, 团队介绍, 客户评价, 联系方式',
      notes: '大胆、创意、高端的视觉风格。以作品说话，减少文字。',
    },
  },
  {
    id: 'landing-ai-tool',
    pageType: 'landing',
    name: 'AI 工具发布页',
    nameEn: 'AI Tool Launch Page',
    description: '等待名单收集、功能预告、早鸟优惠',
    descriptionEn: 'Waitlist, feature preview, early bird offer',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    directionId: 'bold-campaign',
    brief: {
      product: 'Nova Copilot — 自动化内容创作的 AI 写作助手',
      audience: '内容创作者、营销人员、独立创业者',
      goal: '收集等待名单邮箱，传达早鸟优惠',
      sections: 'Hero + 等待名单表单, 核心功能展示, 使用场景, 早鸟福利, 常见问题',
      notes: '兴奋感、紧迫感。强调"早鸟独家"和"限时"。使用未来感视觉元素。',
    },
  },
  // ── App / Dashboard ────────────────────────────────────────────────────────
  {
    id: 'app-analytics',
    pageType: 'app',
    name: '数据分析仪表板',
    nameEn: 'Analytics Dashboard',
    description: '多维度指标卡、折线图、用户数据表',
    descriptionEn: 'KPI cards, charts, user data table',
    gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    directionId: 'app-dashboard',
    brief: {
      product: 'DataFlow Analytics',
      audience: '产品经理、数据分析师',
      goal: '展示用户增长、转化率、收入等核心业务指标',
      sections: '侧边导航, 顶部筛选栏, 关键指标卡(DAU/MAU/收入/转化率), 折线趋势图, 用户来源饼图, 最近用户列表',
      notes: '深色主题，专业商务风格，数据要具体真实（如 DAU: 24,381）',
    },
  },
  {
    id: 'app-saas-admin',
    pageType: 'app',
    name: 'SaaS 管理后台',
    nameEn: 'SaaS Admin Panel',
    description: '用户管理、订阅状态、操作工具栏',
    descriptionEn: 'User list, subscription status, action toolbar',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    directionId: 'app-admin',
    brief: {
      product: 'CloudOps Admin',
      audience: '系统管理员、客户成功团队',
      goal: '管理用户账号、查看订阅状态、处理支持请求',
      sections: '侧边导航, 用户管理表格(姓名/邮箱/套餐/状态/操作), 筛选搜索, 状态徽章, 批量操作工具栏',
      notes: '暗色侧边栏，白色主内容区，使用真实用户数据示例',
    },
  },
  {
    id: 'app-mobile-ui',
    pageType: 'app',
    name: '移动端 App 界面',
    nameEn: 'Mobile App Screen',
    description: '底部 Tab 导航、Feed 卡片流、健康数据',
    descriptionEn: 'Bottom tab nav, card feed, health stats',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    directionId: 'app-mobile',
    brief: {
      product: 'FitTrack — 健身与健康追踪 App',
      audience: '健身爱好者，关注健康的年轻用户',
      goal: '展示今日运动数据、训练计划、卡路里统计',
      sections: '顶部用户问候, 今日概览卡片(步数/卡路里/运动时长), 训练推荐列表, 周趋势迷你图, 底部 Tab 栏',
      notes: '最大宽度390px居中，iOS原生风格，使用真实数字（如：今日步数 8,432）',
    },
  },
  // ── Email templates ────────────────────────────────────────────────────────
  {
    id: 'email-product-update',
    pageType: 'email',
    name: '产品更新通讯',
    nameEn: 'Product Newsletter',
    description: '每月更新、新功能介绍、资源链接',
    descriptionEn: 'Monthly update, new features, resource links',
    gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    directionId: 'email-newsletter',
    brief: {
      product: 'Pulse Analytics Team',
      goal: '四月产品更新：新增 AI 报告生成功能',
      audience: '付费用户和试用用户',
      sections: '立即查看新功能',
      notes: '友好专业的语气，突出 3 个核心新功能，附上文档链接和支持联系',
    },
  },
  {
    id: 'email-welcome',
    pageType: 'email',
    name: '新用户欢迎邮件',
    nameEn: 'Welcome Email',
    description: '欢迎引导、3步上手、帮助资源',
    descriptionEn: '3-step onboarding, help resources',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    directionId: 'email-onboarding',
    brief: {
      product: 'Pulse Analytics',
      goal: '欢迎新注册用户，引导完成首次数据接入',
      audience: '刚刚注册的新用户',
      sections: '开始接入数据',
      notes: '热情、有帮助的语气。简短3步上手指南。附上视频教程和帮助中心链接。',
    },
  },
  {
    id: 'email-promo',
    pageType: 'email',
    name: '限时促销邮件',
    nameEn: 'Flash Sale Email',
    description: '限时折扣、紧迫感设计、突出 CTA',
    descriptionEn: 'Time-limited offer, urgency, prominent CTA',
    gradient: 'linear-gradient(135deg, #f953c6 0%, #b91d73 100%)',
    directionId: 'email-promo',
    brief: {
      product: 'Nova Premium 年度会员',
      goal: '双十一限时 5 折优惠，仅剩48小时',
      audience: '免费版用户和已过期付费用户',
      sections: '立即升级，享受 5 折',
      notes: '紧迫感强烈，倒计时感。突出省了多少钱。3个付费版核心特权。',
    },
  },
  // ── E-commerce ─────────────────────────────────────────────────────────────
  {
    id: 'ec-premium-product',
    pageType: 'ecommerce',
    name: '高端耳机商品页',
    nameEn: 'Premium Headphones Page',
    description: '图片展示、参数规格、加购 + 评价',
    descriptionEn: 'Gallery, specs, add-to-cart, reviews',
    gradient: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)',
    directionId: 'ec-product',
    brief: {
      product: 'Sony WH-1000XM5 — 旗舰主动降噪耳机',
      audience: '追求音质的音乐爱好者和商务人士',
      goal: '¥2,499，行业顶级主动降噪，30小时续航，LDAC高解析音频',
      sections: '图片展示区, 规格参数, 颜色选择, 加购按钮, 用户评价, 推荐配件',
      notes: '高端商务风格，突出"顶级降噪"和"专业音质"。评价要真实具体。',
    },
  },
  {
    id: 'ec-fashion-store',
    pageType: 'ecommerce',
    name: '时尚品牌店铺',
    nameEn: 'Fashion Brand Store',
    description: 'Hero Banner、新品上市、分类浏览',
    descriptionEn: 'Hero banner, new arrivals, category browsing',
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)',
    directionId: 'ec-store',
    brief: {
      product: 'MOSS — 极简主义都市时尚品牌',
      audience: '18-35岁都市白领，追求品质生活',
      goal: '展示新季系列，引导浏览和购买',
      sections: 'Hero Banner(新季上市), 精选单品网格, 品牌故事, 分类导航, 热卖榜单',
      notes: '极简主义黑白灰配色，大图留白。高端but不奢侈的定位。',
    },
  },
  {
    id: 'ec-tech-category',
    pageType: 'ecommerce',
    name: '科技产品分类页',
    nameEn: 'Tech Category Page',
    description: '筛选器、产品卡片网格、价格排序',
    descriptionEn: 'Filters, product grid, price sorting',
    gradient: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
    directionId: 'ec-listing',
    brief: {
      product: '智能手表分类 — TechMall',
      audience: '比价购物的消费者，科技爱好者',
      goal: '展示20+款智能手表，支持按价格/评分筛选',
      sections: '左侧筛选(品牌/价格/评分/功能), 产品卡片网格(12个商品), 排序控件, 分页',
      notes: '产品卡需包含价格、评分、徽章（新品/热卖/折扣）。使用渐变色作为产品图占位。',
    },
  },
  // ── Portfolio ──────────────────────────────────────────────────────────────
  {
    id: 'port-ux-designer',
    pageType: 'portfolio',
    name: 'UI/UX 设计师',
    nameEn: 'UI/UX Designer Portfolio',
    description: '作品案例、设计过程、技能展示',
    descriptionEn: 'Case studies, design process, skills',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    directionId: 'port-creative',
    brief: {
      product: 'Sarah Kim Design',
      audience: 'UI/UX 设计师，专注于 SaaS 产品体验设计',
      sections: 'Figma, Principle, Framer, 用研方法；3个完整案例研究',
      goal: '帮助 B 端 SaaS 产品提升用户体验和产品转化',
      notes: '暖色系，作品为主。每个案例要有前后对比、数据成果（如转化率提升23%）',
    },
  },
  {
    id: 'port-developer',
    pageType: 'portfolio',
    name: '全栈工程师',
    nameEn: 'Fullstack Developer',
    description: '技术栈、GitHub 项目、工作经历',
    descriptionEn: 'Tech stack, GitHub projects, work history',
    gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    directionId: 'port-developer',
    brief: {
      product: 'Alex Chen — 全栈工程师',
      audience: '全栈工程师，5年经验，专注 React + Node.js + 云架构',
      sections: 'TypeScript, React, Node.js, PostgreSQL, AWS；4个开源项目',
      goal: '构建高性能 Web 应用，帮助团队快速落地产品',
      notes: '深色代码主题风格，展示 GitHub 贡献图（CSS 模拟）。项目要有真实 star 数和描述。',
    },
  },
  {
    id: 'port-agency',
    pageType: 'portfolio',
    name: '创意工作室',
    nameEn: 'Creative Studio',
    description: '服务介绍、团队风采、案例展示',
    descriptionEn: 'Services, team, case studies',
    gradient: 'linear-gradient(135deg, #e96c24 0%, #fac02e 100%)',
    directionId: 'port-agency',
    brief: {
      product: 'Craft Studio',
      audience: '品牌设计 + 数字营销工作室，8人团队',
      sections: 'React, Webflow, Figma；5个品牌重塑案例；服务：VI设计/官网/增长',
      goal: '为初创公司和中型品牌提供完整的品牌与数字营销解决方案',
      notes: '充满活力的橙色系，展示团队合影占位和客户LOGO墙（知名品牌）',
    },
  },
  // ── UI Components ──────────────────────────────────────────────────────────
  {
    id: 'comp-design-system',
    pageType: 'component',
    name: '基础组件库',
    nameEn: 'Core Component Library',
    description: '按钮、表单、卡片、徽章全套展示',
    descriptionEn: 'Buttons, forms, cards, badges showcase',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    directionId: 'comp-ui-kit',
    brief: {
      product: 'Nova UI — 现代化 React 组件库',
      goal: 'SaaS 后台管理系统，面向企业用户',
      sections: 'default, hover, active, focus, disabled, loading, error, success',
      audience: 'Clean & Functional，参考 Ant Design Pro 风格',
      notes: '蓝紫色主色调。展示浅色和深色两种模式的对比。每个组件要有代码片段注释。',
    },
  },
  {
    id: 'comp-data-display',
    pageType: 'component',
    name: '数据展示组件',
    nameEn: 'Data Display Components',
    description: '统计卡、表格、图表、进度条',
    descriptionEn: 'Stat cards, tables, charts, progress bars',
    gradient: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
    directionId: 'comp-data',
    brief: {
      product: 'DataViz Component Set',
      goal: '数据分析仪表板，展示业务指标',
      sections: 'default, loading, empty-state, error-state, with-actions',
      audience: 'Professional Dark Theme，参考 Grafana/Datadog',
      notes: '深色背景，数据要真实（如：¥128,432.00 MRR，同比+23.4%）。包含迷你折线图SVG。',
    },
  },
  {
    id: 'comp-form-kit',
    pageType: 'component',
    name: '表单控件集',
    nameEn: 'Form & Input Kit',
    description: '输入框、选择器、校验状态全套',
    descriptionEn: 'Inputs, selects, validation states',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    directionId: 'comp-form',
    brief: {
      product: 'Form Controls Library',
      goal: '用户信息录入、数据筛选场景',
      sections: 'default, focus, filled, error, disabled, readonly, loading',
      audience: 'Minimal & Accessible，参考 Linear/Notion 风格',
      notes: '绿色强调色。展示一个完整的"新建项目"表单作为综合示例。包含表单校验错误状态。',
    },
  },
  // ── Slide Decks ────────────────────────────────────────────────────────────
  {
    id: 'slide-pitch-deck',
    pageType: 'slide',
    name: '融资路演 Pitch Deck',
    nameEn: 'Investor Pitch Deck',
    description: '投资人 Pitch：问题、方案、市场、团队、融资目标',
    descriptionEn: 'Investor pitch: problem, solution, market, team, ask',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #533483 100%)',
    directionId: 'slide-pitch',
    brief: {
      product: 'NovaMind AI — 企业级 AI 自动化平台',
      audience: '天使投资人和早期 VC',
      goal: '完成 300 万美元 Pre-A 轮融资',
      sections: '封面, 核心问题, 我们的解决方案, 市场规模 (TAM/SAM/SOM), 产品演示, 商业模式, 牵引力数据, 团队介绍, 融资计划',
      notes: '深色高端主题，大号数据强调，配合渐变色强化视觉冲击',
    },
  },
  {
    id: 'slide-product-demo',
    pageType: 'slide',
    name: '产品演示 Demo',
    nameEn: 'Product Demo Deck',
    description: '功能展示、操作流程、集成与定价',
    descriptionEn: 'Feature walkthrough, workflow, integrations, pricing',
    gradient: 'linear-gradient(135deg, #0f9b58 0%, #00bf8f 100%)',
    directionId: 'slide-product',
    brief: {
      product: 'DataFlow — 零代码数据管道工具',
      audience: '企业技术决策者和工程团队负责人',
      goal: '展示产品核心价值，推动 POC 评估',
      sections: '产品概述, 痛点对比, 核心功能×3, 操作演示流程, 集成生态, 定价套餐, 下一步',
      notes: '白色简洁风，配绿色强调，每个功能页附带模拟截图占位（CSS渐变）',
    },
  },
  {
    id: 'slide-quarterly-report',
    pageType: 'slide',
    name: '季度数据报告',
    nameEn: 'Quarterly Business Review',
    description: '关键指标、增长趋势、区域分析、下季度规划',
    descriptionEn: 'KPIs, growth trends, regional breakdown, next quarter plan',
    gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
    directionId: 'slide-report',
    brief: {
      product: 'Acme Corp Q2 2024 业务回顾',
      audience: '管理层和董事会成员',
      goal: '回顾 Q2 表现，展示核心 KPI 达成情况',
      sections: '执行摘要, Q2 关键指标 (ARR/DAU/NPS), 收入趋势图, 用户增长分析, 各地区表现, 挑战与应对, Q3 计划与目标',
      notes: '专业商务风格，使用真实数字（如 ARR $2.4M，环比+18%）。CSS 柱状图和折线图。',
    },
  },
]

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
      labelEn: 'Dashboard',
      icon: '🖥️',
      briefFields: APP_FIELDS,
      defaultSections: isZh ? '导航, 看板, 数据表格, 设置' : 'Navigation, dashboard, table, settings',
      directions: appDirections(isZh),
      tweaks: appTweaks(isZh),
    },
    {
      id: 'email',
      label: '邮件模板',
      labelEn: 'Email',
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
      icon: '🛒',
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
      labelEn: 'Components',
      icon: '🧩',
      briefFields: COMPONENT_FIELDS,
      defaultSections: isZh ? 'default, hover, active, disabled' : 'default, hover, active, disabled',
      directions: componentDirections(isZh),
      tweaks: componentTweaks(isZh),
    },
    {
      id: 'slide',
      label: '幻灯片',
      labelEn: 'Slide Deck',
      icon: '🎞️',
      briefFields: SLIDE_FIELDS,
      defaultSections: isZh ? '封面, 问题, 解决方案, 市场, 团队, CTA' : 'Cover, Problem, Solution, Market, Team, CTA',
      directions: slideDirections(isZh),
      tweaks: slideTweaks(isZh),
    },
  ]
}
