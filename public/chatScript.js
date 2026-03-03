// Online Counter Logic 
const counterElement = document.getElementById('counter');
let currentOnline = 30447;

function updateCounter() {
    if (!counterElement) return;

    // Thoda realistic badlav (+ ya - 5)
    const change = Math.floor(Math.random() * 11) - 5;
    currentOnline += change;

    // Number format (1,234 style)
    counterElement.textContent = currentOnline.toLocaleString();
}

if (counterElement) {
    setInterval(updateCounter, 3000);
}

// Simple Tilt effect for Glass Cards
document.querySelectorAll('.glass:not(#video-chat-area)').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = card.getBoundingClientRect();
        const x = (clientX - left) / width - 0.5;
        const y = (clientY - top) / height - 0.5;

        card.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${y * -5}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    });
});

// WebRTC Video Chat Logic
const startBtn = document.getElementById('start-chat-btn');
const videoArea = document.getElementById('video-chat-area');
const videoContainer = document.querySelector('.video-container');
const videoResizeHandle = document.getElementById('videoResizeHandle');
const isChatPage = window.location.pathname.toLowerCase().endsWith('/chat.html') || window.location.pathname.toLowerCase().endsWith('chat.html');
// let localStream;
let resizeState = null;
let isSearchingMatch = false;
let matchTimer = null;
let replyTimers = [];

function setFooterYear() {
    document.querySelectorAll('[data-current-year]').forEach((el) => {
        el.textContent = String(new Date().getFullYear());
    });
}

function applySavedTheme() {
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    } catch (err) {
        console.warn('Theme preference unavailable:', err);
    }
}

applySavedTheme();
setFooterYear();

function isPhoneLayout() {
    return window.matchMedia('(max-width: 600px)').matches;
}

function setMobileVideoPane(heightPx) {
    if (!videoArea) return;
    const hostHeight = videoArea.clientHeight || window.innerHeight;
    const minHeight = 120;
    const maxHeight = Math.max(minHeight + 24, Math.floor(hostHeight * 0.64));
    const clamped = Math.min(maxHeight, Math.max(minHeight, Math.round(heightPx)));
    videoArea.style.setProperty('--mobile-video-pane', `${clamped}px`);
}

function setDefaultMobileVideoPane() {
    if (!videoArea || !isPhoneLayout()) return;
    const hostHeight = videoArea.clientHeight || window.innerHeight;
    setMobileVideoPane(hostHeight * 0.4);
}
/*
async function initializeVideoChat() {
    if (!videoArea) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support camera access. Please use a modern browser.');
        return;
    }

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        document.body.classList.add('in-chat');
        if (isPhoneLayout()) {
            setTimeout(setDefaultMobileVideoPane, 40);
        }

        const localVideo = document.getElementById('localVideo');
        if (localVideo) localVideo.srcObject = localStream;
        startNewMatch('Searching for a stranger...');
    } catch (err) {
        alert('Please allow camera access to start video chat.');
        console.error(err);
        document.body.classList.remove('in-chat');
        if (videoArea) videoArea.style.removeProperty('--mobile-video-pane');
    }
} */

if (videoResizeHandle && videoContainer) {
    videoResizeHandle.addEventListener('pointerdown', (event) => {
        if (!document.body.classList.contains('in-chat') || !isPhoneLayout()) return;
        event.preventDefault();
        resizeState = {
            startY: event.clientY,
            startHeight: videoContainer.getBoundingClientRect().height
        };
        videoResizeHandle.classList.add('active');
    });

    document.addEventListener('pointermove', (event) => {
        if (!resizeState) return;
        const deltaY = event.clientY - resizeState.startY;
        setMobileVideoPane(resizeState.startHeight + deltaY);
    });

    document.addEventListener('pointerup', () => {
        if (!resizeState) return;
        resizeState = null;
        videoResizeHandle.classList.remove('active');
    });
}

window.addEventListener('resize', () => {
    if (!videoArea) return;
    if (document.body.classList.contains('in-chat') && isPhoneLayout()) {
        const currentHeight = videoContainer ? videoContainer.getBoundingClientRect().height : videoArea.clientHeight * 0.4;
        setMobileVideoPane(currentHeight);
    } else {
        videoArea.style.removeProperty('--mobile-video-pane');
    }
});

// 18+ Confirmation Logic
const ageCheckbox = document.getElementById('age-confirm');
const loadingSpinner = document.getElementById('loading-spinner');

if (startBtn) {
    startBtn.addEventListener('click', () => {
        if (ageCheckbox && !ageCheckbox.checked) {
            startBtn.classList.add('shake');
            setTimeout(() => startBtn.classList.remove('shake'), 500);
            return;
        }

        if (loadingSpinner) loadingSpinner.style.display = 'block';
        startBtn.style.display = 'none';

        const selectedGender = document.querySelector('input[name="gender"]:checked');
        const gender = selectedGender ? selectedGender.value : 'male';
        window.location.href = `chat.html?gender=${encodeURIComponent(gender)}`;
    });
}

// Mute Button Logic
const muteBtn = document.getElementById('muteBtn');
/*????if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                muteBtn.innerHTML = audioTrack.enabled
                    ? '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>'
                    : '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
                muteBtn.classList.toggle('muted');
            }
        }
    });
}*/

// Stop Button
/*?????const stopChatBtn = document.getElementById('stopChat');
if (stopChatBtn) {
    stopChatBtn.addEventListener('click', () => {
        clearPendingReplies();
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        window.location.href = 'index.html';
    });
}*/

// Chat Functionality
const chatInput = document.getElementById('chat-msg');
const sendBtn = document.getElementById('send-btn');
const chatLog = document.getElementById('chat-log');
const blobs = document.querySelectorAll('.blob');
const typingSound = new Audio('typing.mp3'); // Make sure you have a 'typing.mp3' file
// const remoteVideo = document.getElementById('remoteVideo');
const strangerOverlay = document.getElementById('strangerOverlay');
const strangerStatus = document.getElementById('strangerStatus');

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function clearPendingReplies() {
    replyTimers.forEach((timerId) => clearTimeout(timerId));
    replyTimers = [];
    typingSound.pause();
    typingSound.currentTime = 0;
}

function queueReply(fn, delay) {
    const timerId = setTimeout(() => {
        replyTimers = replyTimers.filter((id) => id !== timerId);
        fn();
    }, delay);
    replyTimers.push(timerId);
}

function setChatInputState(disabled, placeholderText) {
    if (chatInput) {
        chatInput.disabled = disabled;
        chatInput.placeholder = placeholderText;
    }
    if (sendBtn) {
        sendBtn.disabled = disabled;
    }
}

function showSearchLoader(text) {
    if (!chatLog) return;

    chatLog.innerHTML = '';
    const loader = document.createElement('div');
    loader.className = 'match-loading';
    loader.innerHTML = `<div class="match-spinner"></div><p>${text}</p>`;
    chatLog.appendChild(loader);
}

function setStrangerOverlay(visible, text = 'Searching for a stranger...') {
    if (strangerStatus) strangerStatus.textContent = text;
    if (strangerOverlay) strangerOverlay.classList.toggle('hidden', !false); // visible instaead of false
}
setStrangerOverlay(false)
function startNewMatch(text = 'Searching for a new stranger...') {
   /* if (!chatLog) return;
    if (matchTimer) {
        clearTimeout(matchTimer);
        matchTimer = null;
    }

    isSearchingMatch = true;
    clearPendingReplies();
    if (blobs[0]) blobs[0].style.background = '';
    if (blobs[1]) blobs[1].style.background = '';
    setChatInputState(false, 'Searching for stranger...');
    showSearchLoader(text);
    setStrangerOverlay(false, text);
    if (remoteVideo) remoteVideo.srcObject = null;

    matchTimer = setTimeout(() => {
        isSearchingMatch = false;
        chatLog.innerHTML = '<div class="msg msg-stranger">Stranger found! Say hi!</div>';
        setChatInputState(false, 'Type a message...');
        setStrangerOverlay(false);
        // if (remoteVideo && localStream) remoteVideo.srcObject = localStream;
        if (chatInput) chatInput.focus();
        matchTimer = null;
    }, 1600);*/
}

function sendMessage() {
    if (!chatInput || !chatLog || isSearchingMatch) return;

    const msg = chatInput.value.trim();
    if (msg) {
        // Add User Message
        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg msg-me';
        msgDiv.textContent = msg;
        chatLog.appendChild(msgDiv);
        chatLog.scrollTop = chatLog.scrollHeight; // Auto scroll
        chatInput.value = '';

        // Change background to User Theme (Blue/Cool)
        if (blobs[0]) blobs[0].style.background = 'linear-gradient(45deg, #00d2ff, #3a7bd5)';
        if (blobs[1]) blobs[1].style.background = '#48dbfb';

        // Simulate Stranger Reply
        setTimeout(simulateStrangerReply, 600);
    }
}

function simulateStrangerReply() {
    if (!chatLog) return;

    // Change background to Stranger Theme (Warm/Pink)
    if (blobs[0]) blobs[0].style.background = 'linear-gradient(45deg, #ff9a9e, #fecfef)';
    if (blobs[1]) blobs[1].style.background = '#ff6b6b';

    // Play Typing Sound
    typingSound.loop = true;
    typingSound.play().catch(() => {});

    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg msg-stranger';
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatLog.appendChild(typingDiv);
    chatLog.scrollTop = chatLog.scrollHeight;

    setTimeout(() => {
        typingSound.pause();
        typingSound.currentTime = 0;

        if (!typingDiv.parentNode) return; // Stop if chat was cleared
        typingDiv.remove();

        const replies = ['Hey!', 'Where are you from?', 'Nice to meet you', 'What\'s up?', 'Cool', 'I am a bot [demo]'];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg msg-stranger';
        msgDiv.textContent = randomReply;
        chatLog.appendChild(msgDiv);
        chatLog.scrollTop = chatLog.scrollHeight;
    }, 2000);
}

if (sendBtn && chatInput) {
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Skip Button Logic
const skipBtn = document.getElementById('skipBtn');

if (skipBtn) {
    skipBtn.addEventListener('click', () => {
        if (!chatLog) return;
        startNewMatch('Skipping... Searching for a new stranger...');
    });
}
/*
if (isChatPage && videoArea) {
    initializeVideoChat();
}*/

// Dark Mode Toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    const isDarkAtStart = document.body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDarkAtStart
        ? '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        try {
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        } catch (err) {
            console.warn('Unable to persist theme:', err);
        }
        themeToggle.innerHTML = isDark
            ? '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    });
}

// Report Button Logic
const reportBtn = document.getElementById('reportBtn');
if (reportBtn) {
    reportBtn.addEventListener('click', () => alert('User reported for violating terms.'));
}

// Screenshot Functionality
const screenshotBtn = document.getElementById('screenshotBtn');
if (screenshotBtn) {
    screenshotBtn.addEventListener('click', async () => {
        const target = document.getElementById('video-chat-area');
        if (!target) return;

        // Workaround: Replace video elements with canvas for capture
        // (html2canvas often renders video as black, so we draw the frame manually)
        const videos = target.querySelectorAll('video');
        const tempCanvases = [];

        videos.forEach(video => {
            const canvas = document.createElement('canvas');
            canvas.width = video.offsetWidth;
            canvas.height = video.offsetHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Style canvas to look like the video
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.borderRadius = '10px';

            video.parentNode.insertBefore(canvas, video);
            video.style.display = 'none';
            tempCanvases.push({ video, canvas });
        });

        try {
            const canvas = await html2canvas(target, { backgroundColor: null, scale: 2 });
            const link = document.createElement('a');
            link.download = `omegle-moment-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (err) {
            console.error('Screenshot failed:', err);
        } finally {
            // Restore videos immediately
            tempCanvases.forEach(item => {
                item.video.style.display = 'block';
                item.canvas.remove();
            });
        }
    });
}

// Fullscreen Logic
const fullscreenBtn = document.getElementById('fullscreenBtn');
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
        if (!videoArea) return;

        if (!document.fullscreenElement) {
            videoArea.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    });
}
