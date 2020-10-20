import { createGlobalStyle } from 'styled-components';

export const BeakDarkThemeStyle = createGlobalStyle`
	.ace_editor.ace-solarized-dark {
		background-color: ${p => p.theme.ui.surface};
		color: ${p => p.theme.ui.textMinor};

		.ace_gutter {
			background: ${p => p.theme.ui.secondarySurface};
			color: ${p => p.theme.ui.textOnAction};
		}

		.ace_print-margin {
			width: 1px;
			background: ${p => p.theme.ui.surfaceBorderSeparator};
		}

		.ace_entity.ace_other.ace_attribute-name,
		.ace_storage {
			/* color: #93A1A1; */
			color: pink;
		}
		.ace_cursor,
		.ace_string.ace_regexp {
			color: ${p => p.theme.ui.primaryFill};
		}
		.ace_marker-layer .ace_active-line, .ace_marker-layer .ace_selection {
			background: ${p => p.theme.ui.secondarySurface};
		}

		.ace_multiselect .ace_selection.ace_start {
			box-shadow: 0 0 3px 0px #002B36;
		}
		.ace_marker-layer .ace_step {
			background: rgb(102, 82, 0);
		}
		.ace_marker-layer .ace_bracket {
			margin: -1px 0 0 -1px;
			border: 1px solid rgba(147, 161, 161, 0.50);
		}
		.ace_gutter-active-line {
			background-color: ${p => p.theme.ui.surface};
		}
		.ace_marker-layer .ace_selected-word {
			border: 1px solid #073642;
		}
		.ace_invisible {
			color: rgba(147, 161, 161, 0.50);
		}
		.ace_keyword, .ace_meta, .ace_support.ace_class, .ace_support.ace_type {
			color: #859900;
		}
		.ace_constant.ace_character, .ace_constant.ace_other {
			color: #CB4B16;
		}
		.ace_constant.ace_language {
			color: #B58900;
		}
		.ace_constant.ace_numeric {
			color: #D33682;
		}
		.ace_fold {
			background-color: ${p => p.theme.ui.secondaryFill};
			border-color: ${p => p.theme.ui.backgroundBorderSeparator};
		}
		.ace_entity.ace_name.ace_function, .ace_entity.ace_name.ace_tag, .ace_support.ace_function, .ace_variable,
		.ace_variable.ace_language {
			color: #268BD2;
		}
		.ace_string {
			color: #2AA198;
		}
		.ace_comment {
			font-style: italic;
			color: #657B83;
		}
		.ace_indent-guide {
			border-right: 1px dotted ${p => p.theme.ui.primaryFill};
		}
	}
`;
