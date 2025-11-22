/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                warmth: "#F5F1E8",
                ink: "#2A2520",
                rust: "#C85C3C",
                sage: "#8B9A7E",
                sand: "#D4C4A8",
                cream: "#FBF8F3",
            },
            fontFamily: {
                serif: ["Crimson Pro", "serif"],
                sans: ["Libre Franklin", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
        },
    },
    plugins: [],
};
