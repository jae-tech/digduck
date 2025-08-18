import { type Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "3.25rem" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
        "144": "36rem",
      },
      aspectRatio: {
        golden: "1.618",
        "4/3": "4 / 3",
        "3/2": "3 / 2",
        "2/3": "2 / 3",
        "9/16": "9 / 16",
      },
      backdropBlur: {
        "4xl": "72px",
        "5xl": "96px",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgb(0 0 0 / 0.07), 0 10px 20px -2px rgb(0 0 0 / 0.04)",
        "soft-lg":
          "0 10px 25px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)",
        "inner-soft": "inset 0 2px 4px 0 rgb(0 0 0 / 0.06)",
        glow: "0 0 20px rgb(59 130 246 / 0.3)",
        "glow-lg": "0 0 30px rgb(59 130 246 / 0.4)",
        "glow-purple": "0 0 20px rgb(139 92 246 / 0.3)",
        "glow-green": "0 0 20px rgb(34 197 94 / 0.3)",
        "glow-red": "0 0 20px rgb(239 68 68 / 0.3)",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "scale-out": "scale-out 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "gradient-shift": "gradient-shift 3s ease-in-out infinite",
        "bounce-subtle": "bounce-subtle 1s ease-in-out infinite",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        "heart-beat": "heart-beat 1s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-10px)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgb(59 130 246 / 0.3)" },
          "50%": { boxShadow: "0 0 30px rgb(59 130 246 / 0.6)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" },
        },
        "heart-beat": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 20px rgb(59 130 246 / 0.3), 0 0 40px rgb(59 130 246 / 0.1)",
          },
          "50%": {
            boxShadow:
              "0 0 30px rgb(59 130 246 / 0.6), 0 0 60px rgb(59 130 246 / 0.2)",
          },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-mesh": "linear-gradient(45deg, var(--tw-gradient-stops))",
        noise:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      zIndex: {
        "100": "100",
        "1000": "1000",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
        "1200": "1200ms",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "bounce-out": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          lg: "4rem",
          xl: "5rem",
          "2xl": "6rem",
        },
        screens: {
          sm: "640px",
          md: "768px",
          lg: "1024px",
          xl: "1280px",
          "2xl": "1400px",
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities, addComponents, theme }) {
      // Glass morphism utilities
      addUtilities({
        ".glass": {
          background: "rgb(255 255 255 / 0.1)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgb(255 255 255 / 0.2)",
        },
        ".glass-dark": {
          background: "rgb(0 0 0 / 0.1)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgb(255 255 255 / 0.1)",
        },
        ".glass-card": {
          background: "rgb(255 255 255 / 0.05)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgb(255 255 255 / 0.1)",
          boxShadow: "0 8px 32px 0 rgb(31 38 135 / 0.37)",
        },
        ".text-gradient": {
          background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        },
        ".text-gradient-primary": {
          background:
            "linear-gradient(45deg, rgb(59 130 246), rgb(139 92 246))",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        },
        ".text-gradient-secondary": {
          background: "linear-gradient(45deg, rgb(107 114 128), rgb(75 85 99))",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        },
        ".bg-mesh": {
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgb(59 130 246 / 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgb(139 92 246 / 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgb(16 185 129 / 0.05) 0%, transparent 50%)
          `,
        },
        ".bg-mesh-dark": {
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgb(59 130 246 / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgb(139 92 246 / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgb(16 185 129 / 0.08) 0%, transparent 50%)
          `,
        },
        ".scrollbar-hide": {
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
        ".scrollbar-thin": {
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgb(156 163 175 / 0.5)",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgb(156 163 175 / 0.7)",
          },
        },
        ".interactive": {
          transition: "all 200ms ease-out",
          "&:hover": {
            transform: "scale(1.02)",
          },
          "&:active": {
            transform: "scale(0.98)",
          },
        },
        ".interactive-card": {
          transition: "all 200ms ease-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: theme("boxShadow.soft-lg"),
          },
        },
      });

      // Component utilities
      addComponents({
        ".btn-gradient": {
          background:
            "linear-gradient(135deg, rgb(59 130 246), rgb(139 92 246))",
          color: "white",
          fontWeight: "500",
          padding: theme("spacing.3") + " " + theme("spacing.6"),
          borderRadius: theme("borderRadius.lg"),
          transition: "all 200ms ease-out",
          boxShadow: theme("boxShadow.lg"),
          "&:hover": {
            background:
              "linear-gradient(135deg, rgb(37 99 235), rgb(124 58 237))",
            transform: "scale(1.02)",
            boxShadow: theme("boxShadow.xl"),
          },
          "&:active": {
            transform: "scale(0.98)",
          },
        },
        ".btn-glass": {
          background: "rgb(255 255 255 / 0.1)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgb(255 255 255 / 0.2)",
          color: "rgb(55 65 81)",
          fontWeight: "500",
          padding: theme("spacing.3") + " " + theme("spacing.6"),
          borderRadius: theme("borderRadius.lg"),
          transition: "all 200ms ease-out",
          "&:hover": {
            background: "rgb(255 255 255 / 0.2)",
            transform: "translateY(-1px)",
          },
        },
        ".input-modern": {
          background: "rgb(255 255 255 / 0.05)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgb(229 231 235)",
          borderRadius: theme("borderRadius.lg"),
          padding: theme("spacing.3") + " " + theme("spacing.4"),
          transition: "all 200ms ease-out",
          "&:focus": {
            outline: "none",
            borderColor: "rgb(59 130 246)",
            boxShadow: "0 0 0 3px rgb(59 130 246 / 0.1)",
            background: "rgb(255 255 255 / 0.1)",
          },
        },
        ".card-modern": {
          background: "rgb(255 255 255 / 0.05)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgb(255 255 255 / 0.1)",
          borderRadius: theme("borderRadius.xl"),
          boxShadow: theme("boxShadow.soft"),
          transition: "all 200ms ease-out",
        },
        ".loading-shimmer": {
          position: "relative",
          overflow: "hidden",
          background: "rgb(229 231 235)",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: "0",
            background:
              "linear-gradient(90deg, transparent, rgb(255 255 255 / 0.4), transparent)",
            animation: "shimmer 1.5s ease-in-out infinite",
          },
        },
      });
    },
  ],
} satisfies Config;
