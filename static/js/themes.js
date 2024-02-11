'use strict';

const changeTheme = document.querySelector('#change-theme');
let currentTheme = null;

// Load themes
for (let stylesheet of document.styleSheets) {
	const rules = stylesheet.cssRules;
	for (let rule of rules) {
		const match = rule.selectorText?.match(/^\.(theme-(\w+))$/)
		if (match) {
			const themeOption = document.createElement("option");
			themeOption.value = match[1];
			themeOption.innerText = match[2];
			changeTheme.appendChild(themeOption);
		}
	}
}
currentTheme = changeTheme.querySelector("option").value;

// Theme selection
changeTheme.addEventListener("input", () => {
	document.body.classList.replace(currentTheme, changeTheme.value);
	currentTheme = changeTheme.value
});
