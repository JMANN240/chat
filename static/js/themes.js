'use strict';

const themes = [];

// Load themes
for (const stylesheet of document.styleSheets) {
	const rules = stylesheet.cssRules;
	for (const rule of rules) {
		const match = rule.selectorText?.match(/^\.(theme-(\w+))$/)
		if (match) {
			themes.push({
				themeName: match[2],
				themeClass: match[1]
			});
		}
	}
}

let currentThemeClass = localStorage.getItem('currentThemeClass') ?? themes[0].themeClass;
document.body.classList.add(currentThemeClass);

const changeTheme = document.querySelector('#change-theme');

// Create theme options
for (const theme of themes) {
	const themeOption = document.createElement("option");
	themeOption.value = theme.themeClass;
	themeOption.innerText = theme.themeName;
	themeOption.selected = theme.themeClass === currentThemeClass;
	changeTheme.append(themeOption);
}

// Theme selection
changeTheme.addEventListener("input", () => {
	const newThemeClass = changeTheme.value;
	document.body.classList.replace(currentThemeClass, newThemeClass);
	currentThemeClass = newThemeClass;
	localStorage.setItem('currentThemeClass', currentThemeClass);
});
