"use strict";

function InitStarTrekOverlay(pageContainerElement, logoImageSrc, warpDurationMilliseconds){

	var requestAnimFrame = (function() {
		return  window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame || 
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function(callback) {
					window.setTimeout(callback);
				};
	})();

	function createCSS() {
		var css = document.createElement("style");
		css.innerHTML = '\
			.StarTrekWarpJump {\
				position: absolute;\
				left: 0;\
				top: 0;\
				right: 0;\
				bottom: 0;\
				z-index: 999999;\
				animation: StarTrekWarpJumpAnim 1s linear forwards;\
			}\
			.StarTrekWarpJumpFast {\
				animation: StarTrekWarpJumpAnim 0.5s linear forwards;\
			}\
			@keyframes StarTrekWarpJumpAnim {\
				80% { opacity: 0; }\
				100% { transform: scale(30, 30); opacity: 0; }\
			}\
			.StarTrekOverlay {\
				position: absolute;\
				left: 0;\
				top: 0;\
				right: 0;\
				bottom: 0;\
				z-index: 999998;\
				margin: 0;\
				overflow: hidden;\
				cursor: pointer;\
			}';
		document.body.appendChild(css);
		return css;
	}

	function createElement() {
		var elem = document.createElement("div");
		elem.id = "StarTrekOverlay";
		elem.className = "StarTrekOverlay";
		elem.innerHTML = '<canvas id="StarTrekOverlayCanvas" tabindex="0"></canvas>';
		document.body.appendChild(elem);
		return elem;
	}
	
	function createLogoImage(src) {
		var img = new Image();
		img.src = src;
		return img;
	}
	
	// initialize
	var style = createCSS(); // CSS styles used for the animation
	var overlay = createElement(); // DOM element holding the canvas
	var canvas = document.getElementById("StarTrekOverlayCanvas")
	var logo = createLogoImage(logoImageSrc);
	var width = 0;
	var height = 0;
	
	canvas.focus(); // focus the canvas so keyboard events don't pass through

	function initSizes(){
		width = overlay.offsetWidth,
		height = overlay.offsetHeight;
		canvas.width = width;
		canvas.height = height;
	}
	initSizes();
	window.addEventListener("resize", initSizes);
	
	// get 2d graphics context
	var g = canvas.getContext("2d");

	// constants and storage for objects that represent star positions
	var warpZ = 12;
	var units = 500;
	var stars = [];
	var cycle = 0;
	var Z = 0.025 + (1/25 * 8);
	var logoTimestamp = -1;

	// reset a star object
	function resetStar(a, width, height)
	{
		a.x = (Math.random() * width - (width * 0.5)) * warpZ;
		a.y = (Math.random() * height - (height * 0.5)) * warpZ;
		a.z = warpZ;
		a.px = 0;
		a.py = 0;
	}

	// initial star setup
	for (var i = 0, n; i < units; ++i)
	{
		n = {};
		resetStar(n, width, height);
		stars.push(n);
	}

	// animation rendering function
	var renderCallback = function(timestamp)
	{
		// clear background
		g.globalAlpha = 0.25;
		g.fillStyle = "#000";
		g.fillRect(0, 0, width, height);

		// center
		var cx = (width / 2);
		var cy = (height / 2);

		// update all stars
		var sat = Math.floor(Z * 500); // Z range 0.01 -> 0.5
		if (sat > 100){
			sat = 100;
		}

		for (var i = 0; i < stars.length; ++i)
		{
			var n = stars[i]; // the star
			var xx = n.x / n.z; // star position
			var yy = n.y / n.z;
			var e = (1.0 / n.z + 1) * 2; // size i.e. z

			if (n.px !== 0)
			{
				// hsl color from a sine wave
				g.strokeStyle = "hsl(" + ((cycle * i) % 360) + "," + sat + "%,80%)";
				g.lineWidth = e;
				g.beginPath();
				g.moveTo(xx + cx, yy + cy);
				g.lineTo(n.px + cx, n.py + cy);
				g.stroke();
			}

			// update star position values with new settings
			n.px = xx;
			n.py = yy;
			n.z -= Z;

			// reset when star is out of the view field
			if (n.z < Z || n.px > width || n.py > height)
			{
				resetStar(n, width, height);
			}
		}

		// draw logo
		if (logoTimestamp >= 0){
			g.globalAlpha = 0.6;
			if (logoTimestamp == 0){
				logoTimestamp = timestamp;
			}
			var logoScale = logoScale >= 1 ? 1 : (Math.min(timestamp - logoTimestamp, 300) / 300.0);
			var logoWidth = logo.naturalWidth * logoScale;
			var logoHeight = logo.naturalHeight * logoScale;

			g.drawImage(logo, cx - (logoWidth / 2), cy - (logoHeight / 2), logoWidth, logoHeight);

			// if the logo animation has finished, slow down the star field
			if (logoScale >= 1){
				Z = 0.025 + (1/25);
			}
		}

		// colour cycle sinewave rotation
		cycle += 0.01;

		requestAnimFrame(renderCallback);
	};

	var closing = false;
	
	function close(){
		if (!closing){
			closing = true;
			overlay.removeEventListener("resize", initSizes);
			renderCallback = function(){};
			overlay.className += " StarTrekWarpJumpFast";
			window.setTimeout(destroy, 1200);
		}
	}
	
	function destroy(){
		overlay.parentNode.removeChild(overlay);
		style.parentNode.removeChild(style);
	}

	// start the animation
	requestAnimFrame(renderCallback);
	
	// after warpDurationMilliseconds start the logo animation and let the user exit
	window.setTimeout(function(){
		logoTimestamp = 0;
		canvas.addEventListener("click", close);
		canvas.addEventListener("keyup", close);
	}, warpDurationMilliseconds);

	// jump-into original page contents
	pageContainerElement.className += " StarTrekWarpJump";
	// and reset some time after the jump animation is done
	window.setTimeout(function(){
		pageContainerElement.className = pageContainerElement.className.replace(" StarTrekWarpJump", "");
	}, 2500);
}