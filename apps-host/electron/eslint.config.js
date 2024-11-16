import globals from "globals";
import baseConfig from "../../eslint.config.js";

export default [...baseConfig, {
	"languageOptions": {
		"globals": {
			...globals.browser,
			...globals.node,
		}
	},
}];
