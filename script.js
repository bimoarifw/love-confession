gsap.registerPlugin(ScrollTrigger);

const containers = gsap.utils.toArray('.container');
let currentIndex = 0;
let isAnimating = false;
let currentTypingAnimation = null;
let splashScreenClicked = false;

let backgroundMusic;

gsap.to("#click-me", {
    opacity: 1,
    duration: 1,
    delay: 1,
    repeat: -1,
    yoyo: true
});

document.getElementById('love-logo').addEventListener('click', () => {
    if (!backgroundMusic) {
        backgroundMusic = new Audio('music/music.mp3');
        backgroundMusic.loop = true;

        backgroundMusic.addEventListener('ended', function () {
            console.log("Audio playback ended");
        });
    }
    backgroundMusic.play().catch(error => console.log("Audio play failed:", error));
    splashScreenClicked = true;
    showNextContainer();
});

function loadAudio(url) {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
            return new Promise((resolve, reject) => {
                audioContext.decodeAudioData(arrayBuffer, resolve, reject);
            });
        });
}

function playAudio() {
    if (audioSource) {
        audioSource.stop();
    }
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(audioContext.destination);
    audioSource.loop = true;
    audioSource.start(0);
}

function ensureMusicPlays() {
    if (backgroundMusic && backgroundMusic.paused) {
        console.log("Resuming music playback");
        backgroundMusic.play().catch(error => console.log("Audio play failed:", error));
    }
}

function showNextContainer() {
    if (currentIndex < containers.length - 1 && !isAnimating) {
        transitionContainers(currentIndex, currentIndex + 1);
        handleFadeInUp();
        lazyLoadImages();

        if (containers[currentIndex + 1].id === 'end-message') {
            createFallingStars();
            createHeartConfetti();
        }
    }
}

function transitionContainers(fromIndex, toIndex) {
    isAnimating = true;
    ensureMusicPlays();

    const currentContainer = containers[fromIndex];
    const targetContainer = containers[toIndex];

    document.body.style.overflow = 'hidden';

    if (toIndex === 0 && splashScreenClicked) {
        isAnimating = false;
        return;
    }

    if (currentContainer.id.startsWith('movie-story')) {
        resetMovieStory(currentContainer);
    }
    if (targetContainer.id.startsWith('movie-story')) {
        resetMovieStory(targetContainer);
    }

    for (let i = 0; i < 40; i++) {
        setTimeout(animateEmoji, i * 100);
    }

    const transitions = [
        { x: '100%', duration: 0.8, ease: 'power2.inOut' },
        { y: '100%', duration: 0.8, ease: 'power2.inOut' },
        { scale: 0, duration: 0.8, ease: 'back.in(1.7)' },
        { rotation: 360, duration: 1, ease: 'power2.inOut' }
    ];

    const transitionIndex = toIndex % transitions.length;
    const transition = transitions[transitionIndex];

    gsap.to(currentContainer, {
        opacity: 0,
        ...transition,
        onComplete: () => {
            currentContainer.style.display = 'none';
            targetContainer.style.display = 'flex';
            gsap.fromTo(targetContainer,
                { opacity: 0, ...transition },
                {
                    opacity: 1,
                    ...transition,
                    scale: 1,
                    x: 0,
                    y: 0,
                    rotation: 0,
                    onComplete: () => {
                        currentIndex = toIndex;
                        isAnimating = false;
                        document.body.style.overflow = '';
                        if (currentIndex === 1 && fromIndex === 0) {
                            addScrollListeners();
                        }
                        if (targetContainer.id.startsWith('movie-story')) {
                            setTimeout(() => animateMovieStory(targetContainer), 100);
                        }
                    }
                }
            );
        }
    });
}

function resetMovieStory(container) {
    const imageOverlay = container.querySelector('.image-overlay');
    const movieStoryText = imageOverlay.querySelector('.movie-text');
    gsap.set(imageOverlay, { opacity: 0 });
    gsap.set(movieStoryText, { opacity: 0 });
    movieStoryText.textContent = movieStoryText.getAttribute('data-original-text') || movieStoryText.textContent;

    if (currentTypingAnimation) {
        clearInterval(currentTypingAnimation);
        currentTypingAnimation = null;
    }
}

function animateMovieStory(container) {
    const imageOverlay = container.querySelector('.image-overlay');
    const movieStoryText = imageOverlay.querySelector('.movie-text');
    const originalText = movieStoryText.textContent;
    movieStoryText.textContent = '';

    let tl = gsap.timeline();

    tl.to(imageOverlay, {
        opacity: 1,
        duration: 1
    })
        .to(movieStoryText, {
            opacity: 1,
            duration: 0.5
        })
        .add(() => {
            animateTypingText(movieStoryText, originalText);
        });
}

function animateTypingText(element, text) {
    let i = 0;
    if (currentTypingAnimation) {
        clearInterval(currentTypingAnimation);
    }
    currentTypingAnimation = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(currentTypingAnimation);
            currentTypingAnimation = null;
        }
    }, 50);
}

containers.forEach((container, index) => {
    if (index === 0) {
        gsap.set(container, { opacity: 1, display: 'flex' });
    } else {
        gsap.set(container, { opacity: 0, display: 'none' });
    }

    if (container.id.startsWith('movie-story')) {
        const movieStoryText = container.querySelector('.movie-text');
        if (movieStoryText) {
            movieStoryText.setAttribute('data-original-text', movieStoryText.textContent);
        }
    }
});

document.body.style.overflowY = 'hidden';

const emojiContainer = document.getElementById('emoji-container');
const emojis = ['❤️', '😍'];

function createEmoji() {
    const emojiContainer = document.getElementById('emoji-container');
    if (!emojiContainer) {
        console.error('Emoji container not found');
        return null;
    }
    const emoji = document.createElement('div');
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.position = 'absolute';
    emoji.style.fontSize = '2rem';
    emoji.style.opacity = '0';
    emojiContainer.appendChild(emoji);
    return emoji;
}

function animateEmoji() {
    const emoji = createEmoji();
    if (!emoji) return;

    const startPosition = Math.floor(Math.random() * 4);
    let startX, startY, endX, endY;

    switch (startPosition) {
        case 0:
            startX = `${Math.random() * 100}%`;
            startY = '-50px';
            endX = `${Math.random() * 100}%`;
            endY = '100vh';
            break;
        case 1:
            startX = '100vw';
            startY = `${Math.random() * 100}%`;
            endX = '-50px';
            endY = `${Math.random() * 100}%`;
            break;
        case 2:
            startX = `${Math.random() * 100}%`;
            startY = '100vh';
            endX = `${Math.random() * 100}%`;
            endY = '-50px';
            break;
        case 3:
            startX = '-50px';
            startY = `${Math.random() * 100}%`;
            endX = '100vw';
            endY = `${Math.random() * 100}%`;
            break;
    }

    gsap.fromTo(emoji,
        { left: startX, top: startY, opacity: 0, scale: 0 },
        {
            left: endX,
            top: endY,
            opacity: 1,
            scale: 1,
            duration: 4,
            ease: "power1.in",
            onComplete: () => {
                gsap.to(emoji, {
                    opacity: 0,
                    scale: 0,
                    duration: 0.5,
                    onComplete: () => {
                        emojiContainer.removeChild(emoji);
                    }
                });
            }
        }
    );
}

let canScroll = false;

document.addEventListener('DOMContentLoaded', () => {
    const hearts = document.querySelectorAll('.heart');
    const startButton = document.getElementById('start-button');
    let activatedHearts = 0;

    hearts.forEach(heart => {
        heart.addEventListener('click', () => {
            if (!heart.classList.contains('activated')) {
                const color = heart.getAttribute('data-color');
                heart.style.background = color;
                heart.style.boxShadow = `0 0 15px ${color}`;
                heart.classList.add('activated', 'float');
                activatedHearts++;

                if (activatedHearts === hearts.length) {
                    setTimeout(() => {
                        startButton.classList.add('visible');
                        startButton.classList.add('fade-in-up');
                        handleFadeInUp();
                    }, 500);
                }
            }
        });
    });

    startButton.addEventListener('click', () => {
        if (splashScreenClicked) {
            canScroll = true;
            addScrollListeners();
            showNextContainer();
        }
    });

    removeScrollListeners();
});

function handleFadeInUp() {
    const fadeElements = document.querySelectorAll('.fade-in-up');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(element => {
        observer.observe(element);
    });
}

document.addEventListener('DOMContentLoaded', handleFadeInUp);

function showNextContainer() {
    if (currentIndex < containers.length - 1 && !isAnimating) {
        transitionContainers(currentIndex, currentIndex + 1);
        handleFadeInUp();
        lazyLoadImages();

        if (containers[currentIndex + 1].id === 'end-message') {
            createFallingStars();
            createHeartConfetti();
        }
    }
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return "Good morning";
    } else if (hour >= 12 && hour < 15) {
        return "Good day";
    } else if (hour >= 15 && hour < 18) {
        return "Good afternoon";
    } else if (hour >= 18 && hour < 22) {
        return "Good evening";
    } else {
        return "Good night";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = getGreeting();
    }

    const hearts = document.querySelectorAll('.heart');
    const startButton = document.getElementById('start-button');
    let activatedHearts = 0;

    hearts.forEach(heart => {
        heart.addEventListener('click', () => {
            if (!heart.classList.contains('activated')) {
                const color = heart.getAttribute('data-color');
                heart.style.background = color;
                heart.style.boxShadow = `0 0 15px ${color}`;
                heart.classList.add('activated', 'float');
                activatedHearts++;

                if (activatedHearts === hearts.length) {
                    setTimeout(() => {
                        startButton.classList.add('visible');
                        startButton.classList.add('fade-in-up');
                        handleFadeInUp();
                    }, 500);
                }
            }
        });
    });

    startButton.addEventListener('click', () => {
        if (splashScreenClicked) {
            canScroll = true;
            addScrollListeners();
            showNextContainer();
        }
    });

    handleFadeInUp();
    lazyLoadImages();
});

function lazyLoadImages() {
    const imageContainers = document.querySelectorAll('.image-container');
    imageContainers.forEach(container => {
        const bgImage = container.getAttribute('data-bg-image');
        if (bgImage) {
            container.style.backgroundImage = `url(${bgImage})`;
            container.removeAttribute('data-bg-image');
        }
    });
}

function createFallingStars() {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    document.getElementById('end-message').appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const stars = [];
    const starCount = 200;

    function Star() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.length = Math.random() * 5 + 2;
        this.speed = Math.random() * 5 + 3;
        this.thickness = Math.random() * 2 + 0.5;
        this.color = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.7})`;
    }

    Star.prototype.draw = function() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.thickness;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
    }

    Star.prototype.update = function() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = Math.random() * canvas.height - canvas.height;
            this.x = Math.random() * canvas.width;
        }
    }

    function createStars() {
        for (let i = 0; i < starCount; i++) {
            stars.push(new Star());
        }
    }

    function animateStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            star.draw();
            star.update();
        });
        requestAnimationFrame(animateStars);
    }

    createStars();
    animateStars();
}

function createHeartConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let hearts = [];
    const colors = ['#ff69b4', '#ff1493', '#ff6347', '#ff4500'];
    const heartCount = 200;
    const duration = 8000;
    const startTime = Date.now();

    function Heart() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 20;
        this.size = Math.random() * 15 + 5;
        this.speedY = -(Math.random() * 8 + 5);
        this.speedX = (Math.random() - 0.5) * 4;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.angle = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.gravity = 0.1;
    }

    Heart.prototype.draw = function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * Math.PI / 180);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-this.size/2, -this.size/2, -this.size, 0, 0, this.size);
        ctx.bezierCurveTo(this.size, 0, this.size/2, -this.size/2, 0, 0);
        ctx.fill();
        ctx.restore();
    }

    Heart.prototype.update = function(progress) {
        if (progress < 0.5) {
            this.y += this.speedY;
            this.speedY += this.gravity;
        } else {
            this.y += this.speedY;
            this.speedY += this.gravity * 2;
        }
        
        this.x += this.speedX;
        this.angle += this.rotationSpeed;

        if (this.x + this.size > canvas.width || this.x - this.size < 0) {
            this.speedX = -this.speedX;
        }
    }

    function createHearts() {
        for (let i = 0; i < heartCount; i++) {
            hearts.push(new Heart());
        }
    }

    function animateHearts() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        hearts.forEach(heart => {
            heart.update(progress);
            heart.draw();
        });

        if (progress < 1) {
            requestAnimationFrame(animateHearts);
        } else {
            let opacity = 1;
            function fadeOut() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = opacity;
                hearts.forEach(heart => heart.draw());
                opacity -= 0.02;
                if (opacity > 0) {
                    requestAnimationFrame(fadeOut);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
            fadeOut();
        }
    }

    createHearts();
    animateHearts();
}

let touchStartY = null;

function handleScroll(event) {
    if (!canScroll) {
        event.preventDefault();
        return;
    }

    if (isAnimating) return;

    if (event.deltaY > 0) {
        showNextContainer();
    } else if (event.deltaY < 0) {
        showPreviousContainer();
    }
}

function handleTouchStart(event) {
    touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
    if (!canScroll) {
        event.preventDefault();
        return;
    }

    if (isAnimating) return;

    const touchEndY = event.touches[0].clientY;
    const diff = touchStartY - touchEndY;

    if (Math.abs(diff) > 50) {
        if (diff > 0) {
            showNextContainer();
        } else if (diff < 0) {
            showPreviousContainer();
        }
        touchStartY = touchEndY;
    }
}

function addScrollListeners() {
    window.addEventListener('wheel', handleScroll, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
}

function removeScrollListeners() {
    window.removeEventListener('wheel', handleScroll);
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
}

function showNextContainer() {
    if (currentIndex < containers.length - 1 && !isAnimating) {
        transitionContainers(currentIndex, currentIndex + 1);
        handleFadeInUp();
        lazyLoadImages();

        if (containers[currentIndex + 1].id === 'end-message') {
            createFallingStars();
            createHeartConfetti();
        }
    }
}

function showPreviousContainer() {
    if (currentIndex > 1 && !isAnimating) {
        transitionContainers(currentIndex, currentIndex - 1);
        handleFadeInUp();
    } else if (currentIndex === 1 && !isAnimating && splashScreenClicked) {
        console.log("Ok");
    }
}