'use strict';

const changeTheme = document.querySelector('#change-theme');
let currentTheme = null;

// Load themes
for (let stylesheet of document.styleSheets) {
	const rules = stylesheet.cssRules;
	for (let rule of rules) {
		const match = rule.selectorText?.match(/^\.theme-(\w+)$/)
		if (match) {
			const themeOption = document.createElement("option");
			themeOption.value = rule.selectorText.substring(1);
			themeOption.innerText = match[1];
			changeTheme.appendChild(themeOption);
		}
	}
}
currentTheme = changeTheme.querySelector("option").value;

// Theme selection
changeTheme.addEventListener("input", () => {
	document.body.classList.remove(currentTheme);
	document.body.classList.add(changeTheme.value);
	currentTheme = changeTheme.value
});
