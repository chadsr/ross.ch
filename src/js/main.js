// Ross Chadwick Portfolio (C) 2018
// TODO: A LOT of refactoring

// Stylesheets/#
import '../stylesheets/style.css';
import '../stylesheets/media.css';

// node packages
const hammer = require('hammerjs');

// local function imports
import ContactForm from './contact.js';
import EscherCubes from './escher.js';

// Key event codes
const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;

const CUBE_ID = 'mainCube';
const MAIN_CONTENT_ID = 'content';
const CONTACT_FORM_ID = 'contact-form';

// Freaky Escher stuff
const BG_Y_OFFSET = -0.5; // Offset from y origin for the background rendering (so cube starts halfway offscreen)
const BG_CONTAINER_Id = 'background';
const SVG_ID = 'isobg'
const CUBE_SIZE = 42; // Size of a side in px (if in a 'true' 3d space)
const INNER_ANGLE = 60;

// The currently facing side of the mainCube
var currentSide = 1;

document.addEventListener('DOMContentLoaded', function() {
	var content = document.getElementById(MAIN_CONTENT_ID);
	var contentHammer = new Hammer(content, {
		recognizers: [
			[Hammer.Swipe, {enable: true}]
		]
	});

	contentHammer.on('swipeleft', function() {
		rotateTo(currentSide + 1);
	});

	contentHammer.on('swiperight', function() {
		rotateTo(currentSide - 1);
	});

	// Register contact form submit event
	var contactForm = document.getElementById(CONTACT_FORM_ID);
	var contactHandler = new ContactForm(CONTACT_FORM_ID);
	contactForm.addEventListener('submit', function(e) {
		contactHandler.submit(e);
	});

	// Menu cube rotate events
	var aboutButton = document.getElementById('about-btn');
	aboutButton.addEventListener('mousedown', function() {
		rotateTo(1);
	});

	var projectsButton = document.getElementById('projects-btn');
	projectsButton.addEventListener('mousedown', function() {
		rotateTo(2);
	});

	var blogButton = document.getElementById('blog-btn');
	blogButton.addEventListener('mousedown', function() {
		rotateTo(3);
	});

	var contactButton = document.getElementById('contact-btn');
	contactButton.addEventListener('mousedown', function() {
		rotateTo(4);
	});

	window.dispatchEvent(new Event('resize')); // Trigger the resize event, so the cube can center on page load
});

document.addEventListener('keydown', function(event) {
	if(event.keyCode == LEFT_ARROW) {
		rotateTo(currentSide - 1);
	}
	else if (event.keyCode == RIGHT_ARROW) {
		rotateTo(currentSide + 1);
	}
});

function debounce(func, time) {
	var time = time || 100; // 100 by default if no param
	var timer;
	return function(event){
		if(timer) clearTimeout(timer);
		timer = setTimeout(func, time, event);
	};
}

window.addEventListener('resize', debounce(function(event) {
	var cube = document.getElementById(CUBE_ID);
	var cubePosition = cube.getBoundingClientRect();
	var mainContent = document.getElementById(MAIN_CONTENT_ID);
	var mainContentPosition = mainContent.getBoundingClientRect();
	var header = document.querySelector('header');
	var headerPosition = header.getBoundingClientRect();
	var footer = document.querySelector('footer');
	var footerPosition = footer.getBoundingClientRect();

	cube.style.top = (mainContentPosition.height + headerPosition.height - footerPosition.height - cubePosition.height) / 2 + 'px';

	renderBackground();
}, 200));

function renderBackground() {
	EscherCubes.render(BG_CONTAINER_Id, SVG_ID, 0, BG_Y_OFFSET, CUBE_SIZE, INNER_ANGLE);
}

function rotateTo(side) {
	var degrees, focus;

	if (side != currentSide) {
		switch (side) {
			case 1:
			degrees = 0;
			focus = 'front';
			break;

			case 2:
			degrees = -90;
			focus = 'right';
			break;

			case 3:
			degrees = -180;
			focus = 'back';
			break;

			case 4:
			degrees = -270;
			focus = 'left';
			break;

			default:
			return false;
		}

		// TODO: cleanup a little
		currentSide = side;
		var nav = document.getElementById('nav');
		var navList = nav.getElementsByTagName('ul')[0];
		var navListElements = navList.getElementsByTagName('li');

		// Remove the 'selected' class from the currently selected list element
		var selected = nav.querySelector('.selected');
		selected.classList.remove('selected');

		var cube = document.getElementById(CUBE_ID);

		// Remove the focus class from the focused cube face
		var focusSide = cube.querySelector('.focus');
		focusSide.classList.remove('focus');

		// Transform the cube by the given degree using CSS Transform
		cube.style.transform = 'rotateY(' + degrees + 'deg)';
		navListElements[side - 1].classList.add('selected');
		cube.querySelector('.' + focus).classList.add('focus');

		return true;
	}

	return false;
}
