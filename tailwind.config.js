/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // 主背景色系 — 深邃宇宙感蓝黑
        bg: {
          base:    '#080c14',  // 最深背景（App 背景）
          panel:   '#0c1120',  // 主面板（Sidebar、ChatPanel）
          surface: '#101827',  // 次级面板（Header、工具栏）
          card:    '#151f30',  // 卡片、输入框容器
          input:   '#1a2540',  // 输入框背景
          hover:   '#1e2d4a',  // 悬浮背景
          active:  '#223256',  // 激活背景
        },
        // 边框色系
        line: {
          faint:   '#141e30',  // 极淡边框（隐约分隔）
          subtle:  '#1c2b42',  // 常规边框
          normal:  '#243550',  // 明显边框
          strong:  '#2e4460',  // 强调边框
        },
        // 文字色系
        ink: {
          primary:   '#e4ecf7',  // 主文字（几乎白）
          secondary: '#7b92b0',  // 次要文字（中灰蓝）
          tertiary:  '#435672',  // 辅助文字（暗灰蓝）
          disabled:  '#2a3d52',  // 禁用文字
        },
        // 主色 — 电光蓝
        accent: {
          50:  '#edf5ff',
          100: '#d0e7ff',
          200: '#a6d0ff',
          300: '#6cb1ff',
          400: '#3d8ef5',  // 默认/hover
          500: '#2f7de8',  // 主色
          600: '#2466cc',  // 按钮点击态
          700: '#1b4fa0',
          800: '#153d7a',
          900: '#0f2d56',
          glow: 'rgba(47, 125, 232, 0.18)',
          'glow-strong': 'rgba(47, 125, 232, 0.35)',
        },
        // 紫色 — AI/魔法色
        violet: {
          400: '#b08cf7',
          500: '#9b72f6',  // AI 标识主色
          600: '#7c52d4',
          glow: 'rgba(155, 114, 246, 0.15)',
        },
        // 语义色
        success: '#34d399',
        warning: '#fbbf24',
        danger:  '#f87171',
        info:    '#60a5fa',
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        'xs':  ['11px', '16px'],
        'sm':  ['13px', '20px'],
        'base':['14px', '22px'],
        'md':  ['15px', '24px'],
        'lg':  ['17px', '26px'],
        'xl':  ['20px', '28px'],
        '2xl': ['24px', '32px'],
      },
      boxShadow: {
        'glow':      '0 0 0 3px rgba(47, 125, 232, 0.25)',
        'glow-sm':   '0 0 0 2px rgba(47, 125, 232, 0.2)',
        'violet-glow': '0 0 0 3px rgba(155, 114, 246, 0.25)',
        'card':      '0 1px 4px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
        'modal':     '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        'popup':     '0 16px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)',
        'inner':     'inset 0 1px 0 rgba(255,255,255,0.04)',
        'message-ai': '0 2px 12px rgba(155, 114, 246, 0.1)',
        'message-user': '0 2px 12px rgba(47, 125, 232, 0.2)',
      },
      backgroundImage: {
        'gradient-nova': 'linear-gradient(135deg, #2f7de8 0%, #9b72f6 100%)',
        'gradient-nova-soft': 'linear-gradient(135deg, rgba(47,125,232,0.2) 0%, rgba(155,114,246,0.2) 100%)',
        'gradient-surface': 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
        'shine': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-in-left': 'slideInLeft 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-dot': 'pulseDot 1.4s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'message-in': 'messageIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: 0, transform: 'translateX(-12px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: 0.4, transform: 'scale(0.8)' },
          '50%': { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        messageIn: {
          '0%': { opacity: 0, transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
