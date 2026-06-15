/**
 * CONFIGURAÇÃO DE PERFORMANCE
 * Otimizações para Vite, lazy loading, code splitting e compressão
 */

export const performanceConfig = {
  /**
   * Build Optimization
   */
  build: {
    // Aumentar limite de chunk
    chunkSizeWarningLimit: 1000,

    // Configurar rollup options
    rollupOptions: {
      output: {
        // Code splitting por vendor
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          'vendor-trpc': ['@trpc/client', '@trpc/react-query'],
          'vendor-utils': ['zod', 'date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },

    // Minificação agressiva
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Source maps apenas em desenvolvimento
    sourcemap: false,

    // CSS minification
    cssCodeSplit: true,
  },

  /**
   * Ssr Optimization
   */
  ssr: {
    external: ['mysql2', 'drizzle-orm'],
  },

  /**
   * Server Optimization
   */
  server: {
    middlewareMode: false,
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 443,
    },
  },

  /**
   * Compression
   */
  compression: {
    brotli: {
      enabled: true,
      quality: 11,
    },
    gzip: {
      enabled: true,
      level: 9,
    },
  },

  /**
   * Cache Busting
   */
  cacheBusting: {
    // Adicionar hash aos assets
    assetsDir: 'assets/[hash]',
  },

  /**
   * Image Optimization
   */
  imageOptimization: {
    // Lazy load images por padrão
    lazyLoad: true,
    // Servir WebP quando possível
    formats: ['webp', 'jpg', 'png'],
  },

  /**
   * Font Optimization
   */
  fontOptimization: {
    // Preload fonts críticas
    preload: ['Inter', 'JetBrains Mono'],
    // Usar font-display: swap
    display: 'swap',
  },
};

/**
 * Performance Hints
 */
export const performanceHints = {
  /**
   * Lazy Load Routes
   */
  lazyRoutes: [
    { path: '/scripts', component: 'ScriptExecutor' },
    { path: '/analytics', component: 'Analytics' },
    { path: '/templates', component: 'Templates' },
  ],

  /**
   * Preload Critical Resources
   */
  preload: [
    '/fonts/Inter-Regular.woff2',
    '/fonts/Inter-Bold.woff2',
    '/api/trpc/auth.me',
  ],

  /**
   * Prefetch Secondary Resources
   */
  prefetch: [
    '/api/trpc/analytics.stats',
    '/api/trpc/templates.list',
  ],

  /**
   * Core Web Vitals Targets
   */
  targets: {
    LCP: 2500, // Largest Contentful Paint
    FID: 100, // First Input Delay
    CLS: 0.1, // Cumulative Layout Shift
    FCP: 1800, // First Contentful Paint
    TTFB: 600, // Time to First Byte
  },
};

/**
 * Lighthouse Audit Targets
 */
export const lighthouseTargets = {
  performance: 90,
  accessibility: 95,
  bestPractices: 95,
  seo: 95,
  pwa: 90,
};
