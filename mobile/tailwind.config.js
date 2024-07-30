//Importação dos tokens para customizar as cores (assim não usando as cores padrões do tailwind)
import { colors } from "./src/styles/colors"
import { fontFamily } from "./src/styles/colors"

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors,
			fontFamily,
		},
	},
	plugins: [],
}
