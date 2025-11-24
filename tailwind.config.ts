import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                slnsBlue: "#0B2447",
                slnsGold: "#EAA300",
                slnsLight: "#F0F4F8",
            },
        },
    },
    plugins: [],
};
export default config;