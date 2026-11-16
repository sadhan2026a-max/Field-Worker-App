export interface OverviewThemePalette {
  // Dashboard Header tokens
  headerGradient: [string, string, ...string[]];
  headerPrimary: string;
  headerDriverName: string;
  headerCompanyName: string;
  headerNotifBg: string;
  headerNotifBorder: string;
  headerNotifIcon: string;
  headerSkylineBack: string;
  headerSkylineSpire: string;
  headerSkylineMid: string;
  headerSkylineTree: string;
  headerSkylineWave: string;
  headerDecorLight: string;
  headerDecorRing: string;
  statusBarStyle: 'dark' | 'light';

  // Today Overview tokens
  titleText: string;
  titleChipBg: string;
  viewAllBg: string;
  viewAllBorder: string;
  viewAllText: string;

  // Earnings Bento Pod
  earningsGradient: [string, string, ...string[]];
  earningsBorder: string;
  earningsAmount: string;
  earningsLabel: string;

  // COD Bento Pod
  codGradient: [string, string, ...string[]];
  codBorder: string;
  codAmount: string;
  codLabel: string;

  // Divider inside Pods
  podDivider: string;

  // Task Status Pills
  pendingBg: string;
  pendingBorder: string;
  pendingBadge: string;
  pendingText: string;
  pendingIcon: string;

  completedBg: string;
  completedBorder: string;
  completedBadge: string;
  completedText: string;
}

export function getOverviewTheme(themeName?: string, isDark?: boolean, isAvailable: boolean = true): OverviewThemePalette {
  // If driver is offline, header switches to slate-dark mode across all themes
  const offlineHeaderGradient: [string, string, ...string[]] = ['#0F172A', '#1E293B', '#334155'];

  // Dark Theme
  if (isDark || themeName === 'darkTheme') {
    return {
      headerGradient: isAvailable ? ['#18181B', '#27272A', '#1E1E24'] : offlineHeaderGradient,
      headerPrimary: '#10B981',
      headerDriverName: '#FFFFFF',
      headerCompanyName: 'rgba(255, 255, 255, 0.72)',
      headerNotifBg: '#27272A',
      headerNotifBorder: '#3F3F46',
      headerNotifIcon: '#FFFFFF',
      headerSkylineBack: 'rgba(255, 255, 255, 0.06)',
      headerSkylineSpire: 'rgba(255, 255, 255, 0.12)',
      headerSkylineMid: 'rgba(255, 255, 255, 0.10)',
      headerSkylineTree: 'rgba(255, 255, 255, 0.12)',
      headerSkylineWave: '#27272A',
      headerDecorLight: 'rgba(255, 255, 255, 0.05)',
      headerDecorRing: 'rgba(255, 255, 255, 0.03)',
      statusBarStyle: 'light',

      titleText: '#FFFFFF',
      titleChipBg: '#10B981',
      viewAllBg: 'rgba(16, 185, 129, 0.14)',
      viewAllBorder: 'rgba(16, 185, 129, 0.32)',
      viewAllText: '#34D399',

      earningsGradient: ['#222227', '#1E1E24'],
      earningsBorder: '#333338',
      earningsAmount: '#FFFFFF',
      earningsLabel: '#94A3B8',

      codGradient: ['#1C2230', '#181C26'],
      codBorder: '#2D3748',
      codAmount: '#FFFFFF',
      codLabel: '#94A3B8',

      podDivider: 'rgba(255, 255, 255, 0.08)',

      pendingBg: 'rgba(245, 158, 11, 0.12)',
      pendingBorder: 'rgba(245, 158, 11, 0.30)',
      pendingBadge: 'rgba(245, 158, 11, 0.22)',
      pendingText: '#FBBF24',
      pendingIcon: '#F59E0B',

      completedBg: 'rgba(16, 185, 129, 0.12)',
      completedBorder: 'rgba(16, 185, 129, 0.30)',
      completedBadge: 'rgba(16, 185, 129, 0.22)',
      completedText: '#34D399',
    };
  }

  // Royal Purple Theme
  if (themeName === 'royalPurple') {
    return {
      headerGradient: isAvailable ? ['#F3E8FF', '#FAF5FF', '#FCFAFF'] : offlineHeaderGradient,
      headerPrimary: '#6D28D9',
      headerDriverName: '#0F172A',
      headerCompanyName: '#64748B',
      headerNotifBg: '#FFFFFF',
      headerNotifBorder: '#E9D5FF',
      headerNotifIcon: '#1E293B',
      headerSkylineBack: 'rgba(192, 132, 252, 0.24)',
      headerSkylineSpire: 'rgba(109, 40, 217, 0.35)',
      headerSkylineMid: 'rgba(147, 51, 234, 0.38)',
      headerSkylineTree: 'rgba(109, 40, 217, 0.42)',
      headerSkylineWave: '#6D28D9',
      headerDecorLight: 'rgba(109, 40, 217, 0.07)',
      headerDecorRing: 'rgba(168, 85, 247, 0.06)',
      statusBarStyle: isAvailable ? 'dark' : 'light',

      titleText: '#0F172A',
      titleChipBg: '#7C3AED',
      viewAllBg: '#F5F3FF',
      viewAllBorder: '#EDE9FE',
      viewAllText: '#6D28D9',

      earningsGradient: ['#F3E8FF', '#FFF5EB'],
      earningsBorder: 'rgba(109, 40, 217, 0.16)',
      earningsAmount: '#0F172A',
      earningsLabel: '#1E293B',

      codGradient: ['#F5F3FF', '#EDE9FE'],
      codBorder: 'rgba(139, 92, 246, 0.16)',
      codAmount: '#0F172A',
      codLabel: '#1E293B',

      podDivider: 'rgba(0, 0, 0, 0.05)',

      pendingBg: '#FFF5EC',
      pendingBorder: '#FFE2CE',
      pendingBadge: '#FED7AA',
      pendingText: '#9A3412',
      pendingIcon: '#C2410C',

      completedBg: '#F5F3FF',
      completedBorder: '#DDD6FE',
      completedBadge: '#7C3AED',
      completedText: '#4C1D95',
    };
  }

  // Navy Blue Theme
  if (themeName === 'navyBlue') {
    return {
      headerGradient: isAvailable ? ['#E0F2FE', '#EFF6FF', '#F8FAFC'] : offlineHeaderGradient,
      headerPrimary: '#1D4ED8',
      headerDriverName: '#0F172A',
      headerCompanyName: '#64748B',
      headerNotifBg: '#FFFFFF',
      headerNotifBorder: '#DBEAFE',
      headerNotifIcon: '#1E293B',
      headerSkylineBack: 'rgba(96, 165, 250, 0.24)',
      headerSkylineSpire: 'rgba(29, 78, 216, 0.35)',
      headerSkylineMid: 'rgba(37, 99, 235, 0.38)',
      headerSkylineTree: 'rgba(29, 78, 216, 0.42)',
      headerSkylineWave: '#1D4ED8',
      headerDecorLight: 'rgba(29, 78, 216, 0.07)',
      headerDecorRing: 'rgba(96, 165, 250, 0.06)',
      statusBarStyle: isAvailable ? 'dark' : 'light',

      titleText: '#0F172A',
      titleChipBg: '#2563EB',
      viewAllBg: '#EFF6FF',
      viewAllBorder: '#DBEAFE',
      viewAllText: '#1D4ED8',

      earningsGradient: ['#DBEAFE', '#FFF5EB'],
      earningsBorder: 'rgba(29, 78, 216, 0.16)',
      earningsAmount: '#0F172A',
      earningsLabel: '#1E293B',

      codGradient: ['#E0F2FE', '#F0F9FF'],
      codBorder: 'rgba(14, 165, 233, 0.16)',
      codAmount: '#0F172A',
      codLabel: '#1E293B',

      podDivider: 'rgba(0, 0, 0, 0.05)',

      pendingBg: '#FFF5EC',
      pendingBorder: '#FFE2CE',
      pendingBadge: '#FED7AA',
      pendingText: '#9A3412',
      pendingIcon: '#C2410C',

      completedBg: '#EFF6FF',
      completedBorder: '#BFDBFE',
      completedBadge: '#2563EB',
      completedText: '#1E3A8A',
    };
  }

  // Indigo Orange Theme
  if (themeName === 'indigoOrange') {
    return {
      headerGradient: isAvailable ? ['#EEF2FF', '#FFF7ED', '#FAF5FF'] : offlineHeaderGradient,
      headerPrimary: '#4338CA',
      headerDriverName: '#0F172A',
      headerCompanyName: '#64748B',
      headerNotifBg: '#FFFFFF',
      headerNotifBorder: '#E0E7FF',
      headerNotifIcon: '#1E293B',
      headerSkylineBack: 'rgba(165, 180, 252, 0.24)',
      headerSkylineSpire: 'rgba(67, 56, 202, 0.35)',
      headerSkylineMid: 'rgba(99, 102, 241, 0.38)',
      headerSkylineTree: 'rgba(234, 88, 12, 0.42)',
      headerSkylineWave: '#4338CA',
      headerDecorLight: 'rgba(67, 56, 202, 0.07)',
      headerDecorRing: 'rgba(249, 115, 22, 0.06)',
      statusBarStyle: isAvailable ? 'dark' : 'light',

      titleText: '#0F172A',
      titleChipBg: '#4F46E5',
      viewAllBg: '#EEF2FF',
      viewAllBorder: '#E0E7FF',
      viewAllText: '#4338CA',

      earningsGradient: ['#EEF2FF', '#FFEDD5'],
      earningsBorder: 'rgba(67, 56, 202, 0.16)',
      earningsAmount: '#0F172A',
      earningsLabel: '#1E293B',

      codGradient: ['#FFF7ED', '#FEF3C7'],
      codBorder: 'rgba(234, 88, 12, 0.16)',
      codAmount: '#0F172A',
      codLabel: '#1E293B',

      podDivider: 'rgba(0, 0, 0, 0.05)',

      pendingBg: '#FFF7ED',
      pendingBorder: '#FED7AA',
      pendingBadge: '#FFEDD5',
      pendingText: '#9A3412',
      pendingIcon: '#EA580C',

      completedBg: '#EEF2FF',
      completedBorder: '#C7D2FE',
      completedBadge: '#4F46E5',
      completedText: '#312E81',
    };
  }

  // Teal Logistics Theme (Default & Exact preserved reference)
  return {
    headerGradient: isAvailable ? ['#E3F5EB', '#EEFAF2', '#F8FCFA'] : offlineHeaderGradient,
    headerPrimary: '#059669',
    headerDriverName: '#0F172A',
    headerCompanyName: '#64748B',
    headerNotifBg: '#FFFFFF',
    headerNotifBorder: '#E2E8F0',
    headerNotifIcon: '#1E293B',
    headerSkylineBack: 'rgba(52, 211, 153, 0.22)',
    headerSkylineSpire: 'rgba(5, 150, 105, 0.35)',
    headerSkylineMid: 'rgba(16, 185, 129, 0.38)',
    headerSkylineTree: 'rgba(5, 150, 105, 0.42)',
    headerSkylineWave: '#059669',
    headerDecorLight: 'rgba(16, 185, 129, 0.07)',
    headerDecorRing: 'rgba(52, 211, 153, 0.06)',
    statusBarStyle: isAvailable ? 'dark' : 'light',

    titleText: '#0F172A',
    titleChipBg: '#059669',
    viewAllBg: '#ECFDF5',
    viewAllBorder: '#D1FAE5',
    viewAllText: '#059669',

    earningsGradient: ['#E8F8EE', '#FFF6E9'],
    earningsBorder: 'rgba(16, 185, 129, 0.16)',
    earningsAmount: '#0F172A',
    earningsLabel: '#1E293B',

    codGradient: ['#EEF4FF', '#F3F6FD'],
    codBorder: 'rgba(59, 130, 246, 0.16)',
    codAmount: '#0F172A',
    codLabel: '#1E293B',

    podDivider: 'rgba(0, 0, 0, 0.05)',

    pendingBg: '#FFF5EC',
    pendingBorder: '#FFE2CE',
    pendingBadge: '#FED7AA',
    pendingText: '#9A3412',
    pendingIcon: '#C2410C',

    completedBg: '#EBF9F5',
    completedBorder: '#C6F3E6',
    completedBadge: '#059669',
    completedText: '#065F46',
  };
}

