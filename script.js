const CONFIG = {
    DISCORD_USER_ID: '1050643297527418910',
    SPOTIFY_CLIENT_ID: '885fc96166d24dbaa943d950bb4194e2',
    UPDATE_INTERVAL: 3000,
    SPOTIFY_UPDATE_INTERVAL: 3000
};

let currentDiscordHandle = '@quitcaring';
let lastDiscordUpdate = 0;
let lastSpotifyUpdate = 0;
let spotifyProgress = 0;
let spotifyDuration = 0;
let spotifyCurrentTime = 0;
let progressInterval = null;
let backgroundMusic = null;
let hasEnteredSite = false;
let isMuted = false;
let currentSpotifyData = null;
let accessToken = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeCursor();
    initializeEntryPage();
    initializeSocialLinks();
    initSpotify();
});

// ------------------- CURSOR -------------------
function initializeCursor() {
    const cursor = document.querySelector('.cursor');
    if (!cursor) return;

    let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

    function updateCursor() {
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    const interactiveElements = document.querySelectorAll('a, .avatar, .main-avatar-img, .album-art, .social-link, .entry-text, .audio-control');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
}

// ------------------- ENTRY PAGE -------------------
function initializeEntryPage() {
    const entryPage = document.getElementById('entry-page');
    const entryButton = document.getElementById('entry-button');
    const mainSite = document.getElementById('main-site');
    const audioControl = document.getElementById('audio-control');
    const audioIcon = document.getElementById('audio-icon');

    backgroundMusic = document.getElementById('background-music');

    audioControl.addEventListener('click', e => { e.stopPropagation(); toggleAudio(); });

    entryButton.addEventListener('click', () => {
        if (hasEnteredSite) return;
        hasEnteredSite = true;

        audioControl.classList.add('visible');

        if (backgroundMusic && !isMuted) {
            backgroundMusic.currentTime = 0;
            const playPromise = backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise.then(() => console.log('Music started successfully')).catch(err => console.log('Error:', err));
            }
            backgroundMusic.addEventListener('ended', function() {
                if (!isMuted) { this.currentTime = 0; this.play(); }
            });
        }

        entryPage.classList.add('fade-out');
        setTimeout(() => {
            entryPage.style.display = 'none';
            mainSite.style.display = 'block';
            initializeMainSite();
        }, 800);
    });

    function toggleAudio() {
        isMuted = !isMuted;
        if (isMuted) {
            if (backgroundMusic) backgroundMusic.pause();
            audioIcon.className = 'fas fa-volume-mute';
            audioControl.classList.add('muted');
        } else {
            if (backgroundMusic && hasEnteredSite) backgroundMusic.play().catch(err => console.log(err));
            audioIcon.className = 'fas fa-volume-up';
            audioControl.classList.remove('muted');
        }
    }
}

// ------------------- MAIN SITE -------------------
function initializeMainSite() {
    initializeTypingEffect();
    initializeLastSeen();
    updateDiscordStatus();
    updateSpotifyStatus();

    setInterval(updateDiscordStatus, CONFIG.UPDATE_INTERVAL);
    setInterval(updateSpotifyStatus, CONFIG.SPOTIFY_UPDATE_INTERVAL);
    setInterval(updateLastSeen, 60000);
    setInterval(updateSpotifyProgress, 1000);
}

// ------------------- TYPING EFFECT -------------------
function initializeTypingEffect() {
    const typingText = document.querySelector('.typing-text');
    if (!typingText) return;

    const texts = ['Guilty Forver','innocent since 1901','@gxilty.xyz','@innocent','@gone forever'];
    let textIndex = 0, charIndex = 0, isDeleting = false;

    function typeWriter() {
        const currentText = texts[textIndex];
        if (isDeleting) { typingText.textContent = currentText.substring(0, charIndex - 1); charIndex--; }
        else { typingText.textContent = currentText.substring(0, charIndex + 1); charIndex++; }

        let typeSpeed = isDeleting ? 50 : 100;
        if (!isDeleting && charIndex === currentText.length) { typeSpeed = 2000; isDeleting = true; }
        else if (isDeleting && charIndex === 0) { isDeleting = false; textIndex = (textIndex + 1) % texts.length; typeSpeed = 500; }

        setTimeout(typeWriter, typeSpeed);
    }

    typeWriter();
}

// ------------------- LAST SEEN -------------------
function initializeLastSeen() { updateLastSeen(); }
function updateLastSeen() {
    const el = document.getElementById('last-seen');
    if (!el) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'});
    el.textContent = `Last seen: ${timeString}`;
}

// ------------------- DISCORD -------------------
async function updateDiscordStatus() {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.DISCORD_USER_ID}`);
        const data = await response.json();
        if (data.success && data.data) updateDiscordUI(data.data);
    } catch (err) { console.log('Discord error:', err); }
}
function updateDiscordUI(userData) {
    const avatar = document.getElementById('discord-avatar');
    const username = document.getElementById('discord-username');
    const activity = document.getElementById('discord-activity');
    const statusDot = document.getElementById('discord-status-dot');
    const statusBadge = document.getElementById('discord-status');
    const mainAvatar = document.getElementById('main-avatar');
    const mainStatusDot = document.getElementById('main-status-dot');
    const mainStatusText = document.getElementById('main-status-text');

    if (avatar && userData.discord_user) {
        const avatarUrl = userData.discord_user.avatar
            ? `https://cdn.discordapp.com/avatars/${userData.discord_user.id}/${userData.discord_user.avatar}.png?size=128`
            : `https://cdn.discordapp.com/embed/avatars/${userData.discord_user.discriminator % 5}.png`;
        avatar.src = avatarUrl;
        if (mainAvatar) mainAvatar.src = avatarUrl;
    }

    if (username && userData.discord_user) username.textContent = userData.discord_user.global_name || userData.discord_user.username;

    const status = userData.discord_status || 'offline';
    if (statusDot) statusDot.className = `status-indicator ${status}`;
    if (statusBadge) statusBadge.className = `status-badge ${status}`;
    if (mainStatusDot) mainStatusDot.className = `status-dot ${status}`;

    const statusTexts = { 'online':'Online - available','idle':'Idle - away','dnd':'Busy - do not disturb','offline':'Offline - leave message' };
    if (mainStatusText) mainStatusText.textContent = statusTexts[status] || 'Unknown status';

    if (activity) {
        const activityText = activity.querySelector('.activity-text');
        if (userData.activities && userData.activities.length>0) {
            const customStatus = userData.activities.find(act => act.type===4);
            if (customStatus) { activityText.textContent = `${customStatus.emoji?.name||''} ${customStatus.state||''}`.trim(); }
            else { activityText.textContent = userData.activities[0].name; }
        } else { activityText.textContent = statusTexts[status] || 'Offline'; }
    }
}

// ------------------- SPOTIFY -------------------
function getHashParams() {
    const hash = window.location.hash.substring(1);
    return hash.split('&').reduce((res,item)=>{const parts=item.split('=');res[parts[0]]=decodeURIComponent(parts[1]);return res;},{});
}
function redirectToSpotifyAuth() {
    const url = `https://accounts.spotify.com/authorize?client_id=${CONFIG.SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&scope=user-read-currently-playing user-read-playback-state`;
    window.location = url;
}

function initSpotify() {
    const params = getHashParams();
    accessToken = params.access_token;

    if (!accessToken) { redirectToSpotifyAuth(); return; }
    window.history.replaceState({}, document.title, window.location.pathname);

    updateSpotifyStatus();
    setInterval(updateSpotifyStatus, CONFIG.SPOTIFY_UPDATE_INTERVAL);
    setInterval(() => { if (currentSpotifyData) updateSpotifyUI(currentSpotifyData); }, 1000);
}

async function updateSpotifyStatus() {
    if (!accessToken) return;
    try {
        const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.status===204 || res.status===202) { currentSpotifyData=null; updateSpotifyUI(null); return; }
        const data = await res.json();
        if (data && data.item) {
            const spotifyData = {
                song: data.item.name,
                artist: data.item.artists.map(a=>a.name).join(', '),
                album_art_url: data.item.album.images[0].url,
                timestamps: { start: Date.now()-data.progress_ms, end: Date.now()-data.progress_ms+data.item.duration_ms }
            };
            currentSpotifyData = spotifyData;
            updateSpotifyUI(spotifyData);
        } else { currentSpotifyData = null; updateSpotifyUI(null); }
    } catch (err) { console.error('Spotify error:',err); currentSpotifyData=null; updateSpotifyUI(null); }
}

function updateSpotifyProgress() {
    if (!currentSpotifyData) return;
    const progressFill=document.getElementById('spotify-progress');
    const currentTimeElement=document.getElementById('current-time');
    const totalTimeElement=document.getElementById('total-time');
    const now=Date.now(), start=currentSpotifyData.timestamps.start, end=currentSpotifyData.timestamps.end;
    const progress=((now-start)/(end-start))*100;
    const clampedProgress=Math.min(Math.max(progress,0),100);
    if(progressFill) progressFill.style.width=`${clampedProgress}%`;
    if(currentTimeElement) currentTimeElement.textContent=formatTime(Math.max(0, now-start));
    if(totalTimeElement) totalTimeElement.textContent=formatTime(end-start);
}

function updateSpotifyUI(spotifyData) {
    const trackElement=document.getElementById('spotify-track');
    const artistElement=document.getElementById('spotify-artist');
    const albumElement=document.getElementById('spotify-album');
    const albumContainer=document.querySelector('.album-container');
    const playingIndicator=document.getElementById('spotify-playing');
    const progressContainer=document.getElementById('spotify-progress-container');

    if(spotifyData){
        if(trackElement) trackElement.textContent=spotifyData.song;
        if(artistElement) artistElement.textContent=spotifyData.artist;
        if(albumElement){ albumElement.src=spotifyData.album_art_url; albumElement.classList.add('visible'); }
        if(albumContainer) albumContainer.classList.remove('hidden');
        if(playingIndicator) playingIndicator.classList.add('playing');
        if(progressContainer) progressContainer.classList.add('visible');
        updateSpotifyProgress();
    } else {
        if(trackElement) trackElement.textContent='Not playing';
        if(artistElement) artistElement.textContent='-';
        if(albumElement){ albumElement.src=''; albumElement.classList.remove('visible'); }
        if(albumContainer) albumContainer.classList.add('hidden');
        if(playingIndicator) playingIndicator.classList.remove('playing');
        if(progressContainer) progressContainer.classList.remove('visible');
    }
}

// ------------------- UTILS -------------------
function formatTime(ms){ const seconds=Math.floor(ms/1000); const minutes=Math.floor(seconds/60); const remaining=seconds%60; return `${minutes}:${remaining.toString().padStart(2,'0')}`; }