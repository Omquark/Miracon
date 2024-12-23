import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        requireConfigFile: false,
        extends: "next",
      }
    },
  },
  pluginJs.configs.recommended,
];