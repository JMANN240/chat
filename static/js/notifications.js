'use strict';

class NotificationBadge
{
	constructor()
	{
		// General
		this.backgroundColor = "#1648a6";
		this.textColor = "#dfe5f0";
		this.unreadNotifications = 0;
		this.notificationsText = "0";
		this.iconSize = 64; // Height and width in pixels
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.iconSize;
		this.canvas.height = this.iconSize;
		this.favicon = document.querySelector("#favicon");

		// Canvas context setup
		this.ctx = this.canvas.getContext("2d");
		this.ctx.font = "40px sans serif";
		this.ctx.textAlign = "center";

		// Quack sound
		this.quack = new Audio('/static/audio/quack.mp3');
		this.hasQuacked = false;

		// New messages bar
		const newMessagesBarTemplate = document.querySelector("#new-messages-bar");
		this.newMessagesBar = newMessagesBarTemplate.cloneNode(true);
		newMessagesBarTemplate.remove();

		// Event handling
		window.addEventListener("focus", () => {
			console.log(this.unreadNotifications > 0);
			if (this.unreadNotifications > 0)
			{
				this.newMessagesBar.style.display = "block";
			}
			this.clearUnread();
		});

		window.addEventListener("blur", () => {
			this.newMessagesBar.style.display = "none";
			document.querySelector("#chat").appendChild(this.newMessagesBar);
		});
	}

	addUnreadMessage()
	{
		if (!this.hasQuacked)
		{
			this.quack.play();
			this.hasQuacked = true;
		}
		++this.unreadNotifications;
		this.notificationsText = this.unreadNotifications > 99 ? "99+" : this.unreadNotifications.toString();
		this.drawBadge();
	}

	clearUnread()
	{
		this.hasQuacked = false;
		this.unreadNotifications = 0;
		this.notificationsText = "0";
		this.drawBadge();
	}

	drawBadge()
	{
		this.ctx.fillStyle = this.backgroundColor;
		this.ctx.beginPath();
		this.ctx.roundRect(0, 0, this.iconSize, this.iconSize, 8);
		this.ctx.fill();
		this.ctx.fillStyle = this.textColor;
		this.ctx.fillText(this.notificationsText, 32, 48, 64);
		this.favicon.setAttribute("href", this.canvas.toDataURL());
	}
}
