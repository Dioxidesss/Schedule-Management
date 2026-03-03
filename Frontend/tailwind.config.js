/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#00e5ff",
                "background-light": "#f5f8f8",
                "background-dark": "#0a1128",
                "surface": "#14213d",
                "unloading": "#39ff14",
                "waiting": "#ffee00",
                "delayed": "#ff003c",
                "scheduled": "#475569",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            }
        },
    },
    plugins: [],
}
