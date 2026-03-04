/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Core brand
                primary: "#00e5ff",
                "primary-dark": "#00acc1",
                "primary-hover": "#05b3c7",
                // Backgrounds
                "background-dark": "#0a1128",
                "background-light": "#f5f8f8",
                // Surfaces
                surface: "#14213d",
                "surface-dark": "#1B2A47",
                "surface-darker": "#152036",
                "surface-highlight": "#1c2b55",
                "surface-border": "#233358",
                "slate-navy": "#1B2A47",
                // Appointment status
                unloading: "#39ff14",
                waiting: "#ffee00",
                delayed: "#ff003c",
                scheduled: "#475569",
                // Kiosk specific
                "neon-cyan": "#0df2f2",
                "neon-green": "#39ff14",
                "high-yellow": "#FFD700",
                "royal-blue": "#4169e1",
                // Gatekeeper kiosk
                "gate-primary": "#06f906",
                "gate-accent": "#00ffff",
                // Status indicators
                "status-online": "#00ff9d",
                "status-offline": "#ff3b3b",
                danger: "#ff4d4d",
                // Text helpers
                "text-secondary": "#8da2b5",
                "text-secondary-dark": "#88a4a7",
                "text-primary-dark": "#e0f7fa",
            },
            fontFamily: {
                display: ["Space Grotesk", "sans-serif"],
                body: ["Noto Sans", "sans-serif"],
                sans: ["Inter", "Space Grotesk", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.25rem",
                lg: "0.5rem",
                xl: "0.75rem",
                "2xl": "1rem",
                full: "9999px",
            },
            boxShadow: {
                glow: "0 0 20px -5px rgba(0, 229, 255, 0.5)",
                "glow-green": "0 0 15px rgba(57, 255, 20, 0.3)",
                "glow-gate": "0 0 15px rgba(6, 249, 6, 0.3)",
                modal: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            },
            backgroundImage: {
                "tech-grid":
                    "linear-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.05) 1px, transparent 1px)",
                "gantt-grid":
                    "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px)",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                flow: {
                    "0%": { transform: "translateX(-100%)" },
                    "100%": { transform: "translateX(100%)" },
                },
            },
            animation: {
                float: "float 6s ease-in-out infinite",
                "float-delayed": "float 7s ease-in-out infinite 1s",
                flow: "flow 3s linear infinite",
            },
        },
    },
    plugins: [],
};
