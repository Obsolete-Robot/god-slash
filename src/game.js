/**
 * GOD SLASH - Samurai Gunn-style arena fighter
 * Single player vs AI
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    // Canvas (internal resolution - pixel art scale)
    WIDTH: 768,
    HEIGHT: 432,
    
    // Physics - Core (tuned to 80% feel)
    GRAVITY: 0.61,
    MAX_FALL_SPEED: 9.6,
    FRICTION: 0.85,
    
    // Player - Movement (tuned to 80% feel)
    PLAYER_SPEED: 3.52,
    PLAYER_ACCEL: 0.6,        // Ground acceleration
    PLAYER_DECEL: 0.75,       // Ground deceleration (friction when not moving)
    PLAYER_AIR_ACCEL: 0.35,   // Air acceleration (less control in air)
    PLAYER_AIR_DECEL: 0.95,   // Air deceleration (less friction in air)
    PLAYER_JUMP: -12.8,
    PLAYER_WALL_SLIDE: 2.4,
    PLAYER_WALL_JUMP_X: 8,
    PLAYER_WALL_JUMP_Y: -11.2,
    PLAYER_DASH_SPEED: 19.2,
    PLAYER_DASH_DURATION: 10,
    PLAYER_DASH_COOLDOWN: 38,
    
    // Combat - Slash (tuned to 80% feel)
    SLASH_WIDTH: 60,
    SLASH_HEIGHT: 24,
    SWORD_DURATION: 10,
    SWORD_COOLDOWN: 19,
    
    // Combat - Knockback (tuned to 80% feel)
    SURFACE_DEFLECT_SPEED: 12.8,
    HIT_STUN_DURATION: 25,
    HIT_STUN_KNOCKBACK: 12.8,
    CLASH_KNOCKBACK: 16,
    GROUND_SLASH_BOUNCE: -6.4,
    WALL_SLASH_DELAY: 4,
    
    // Combat - Hit Stop (tuned to 80% feel)
    HIT_STOP_DURATION: 23,
    CLASH_HIT_STOP_DURATION: 11,
    
    // Character Collision (tuned to 80% feel)
    BOP_BOUNCE_UP: -8,
    BOP_PUSH_DOWN: 4.8,
    PUSH_FORCE: 1.6,
    
    // Air Slash
    AIR_SLASH_FRICTION: 0.15, // Horizontal slowdown when slashing in air
    AIR_SLASH_FALL_MULT: 0.15, // Gravity multiplier when slashing in air
    
    // AI (tuned to 80% feel)
    AI_REACTION_TIME: 19,
    AI_AGGRESSION: 0.5,
    AI_WANDER_CHANCE: 0.3,
    AI_IDLE_TIME: 75,
    AI_WANDER_SPEED_MULT: 0.6,
    AI_WHIFF_CHANCE: 0.015,
    AI_JUMP_CHANCE: 0.03,
    
    // Game
    LIVES_PER_CHARACTER: 5,
    RESPAWN_TIME: 45, // Reduced to 60% of original (was 75)
    RESPAWN_INVULN: 90, // Invulnerability frames after respawn (~1.5 sec)
    ENEMY_COUNT: 3,
    
    // AI Behavior
    AI_ATTACK_HESITATION: 0.03, // Lower = more hesitation before attacking
    AI_RETREAT_CHANCE: 0.15,    // Chance to retreat after decisions
    AI_RETREAT_DURATION: 120,   // Frames to retreat (~2 sec)
    
    // Dash Collision
    DASH_BUMP_SPEED: 10,        // Speed to bump non-dashing player
    DASH_BUMP_UP: -5,           // Upward pop on bump
    DASH_RICOCHET_SPEED: 14,    // Speed when two dashes collide
    DASH_RICOCHET_UP: -6,       // Upward pop on ricochet
    BUMP_LOCK_DURATION: 9,      // Frames of movement lock after bump (~0.15 sec)
    
    // VFX Timers
    CLASH_GLOW_DURATION: 25,    // Frames of white glow after clash
    DASH_ECHO_DURATION: 15,     // Frames each echo lasts
    DASH_ECHO_INTERVAL: 2,      // Spawn echo every N frames during dash
    BLOOD_BALL_COUNT_MIN: 4,    // Min blood balls on kill
    BLOOD_BALL_COUNT_MAX: 7,    // Max blood balls on kill
    
    // Gun (DISABLED)
    GUN_ENABLED: false,
    BULLET_SPEED: 8,
    BULLET_COUNT: 3,
    GUN_COOLDOWN: 25,
};

// Tunable settings (subset of CONFIG that can be adjusted in debug panel)
const TUNABLE_KEYS = [
    'GRAVITY', 'MAX_FALL_SPEED', 'FRICTION',
    'PLAYER_SPEED', 'PLAYER_ACCEL', 'PLAYER_DECEL', 'PLAYER_AIR_ACCEL', 'PLAYER_AIR_DECEL',
    'PLAYER_JUMP', 'PLAYER_WALL_SLIDE', 'PLAYER_WALL_JUMP_X', 'PLAYER_WALL_JUMP_Y',
    'PLAYER_DASH_SPEED', 'PLAYER_DASH_DURATION', 'PLAYER_DASH_COOLDOWN',
    'SLASH_WIDTH', 'SLASH_HEIGHT', 'SWORD_DURATION', 'SWORD_COOLDOWN',
    'SURFACE_DEFLECT_SPEED', 'HIT_STUN_DURATION', 'HIT_STUN_KNOCKBACK', 'CLASH_KNOCKBACK',
    'GROUND_SLASH_BOUNCE', 'WALL_SLASH_DELAY', 'HIT_STOP_DURATION', 'CLASH_HIT_STOP_DURATION',
    'BOP_BOUNCE_UP', 'BOP_PUSH_DOWN', 'PUSH_FORCE',
    'AIR_SLASH_FRICTION', 'AIR_SLASH_FALL_MULT',
    'AI_REACTION_TIME', 'AI_AGGRESSION', 'AI_WANDER_CHANCE', 'AI_IDLE_TIME',
    'AI_ATTACK_HESITATION', 'AI_RETREAT_CHANCE', 'AI_RETREAT_DURATION',
    'LIVES_PER_CHARACTER', 'RESPAWN_TIME', 'RESPAWN_INVULN', 'ENEMY_COUNT',
];

// =============================================================================
// COLORS (Pixel art palette)
// =============================================================================

const COLORS = {
    bg: '#16213e',
    platform: '#1a1a2e',
    platformLight: '#2a2a4e',
    player1: '#4af',
    player2: '#f44',
    sword: '#fff',
    bullet: '#ff0',
    particle: '#fff',
    blood: '#c00',
    bloodLight: '#f33',
};

// =============================================================================
// SPRITES & ASSETS
// =============================================================================

const ASSETS = {
    loaded: false,
    bgVideos: {},      // Map of level index to video element
    activeBgIndex: 0,  // Which video to draw
    titleVideo: null,  // Title screen video
    tiles: null,
    player: null,
    enemies: [],
};

// Background video sources - one per level
const BG_VIDEO_SOURCES = {
    0: 'assets/bg-video.mp4',   // Dojo
    1: 'assets/bg-video-2.mp4', // Tower  
    2: 'assets/bg-video-3.mp4', // Pit
    3: 'assets/bg-video-4.mp4', // Scattered
};

function loadAssets() {
    let loadCount = 0;
    const uniqueVideos = [...new Set(Object.values(BG_VIDEO_SOURCES))];
    const totalAssets = 5 + uniqueVideos.length; // unique videos + title video + tiles + player + 3 enemies
    
    function onLoad() {
        loadCount++;
        if (loadCount >= totalAssets) {
            ASSETS.loaded = true;
            console.log('All assets loaded!');
            // Start all videos playing (they loop silently)
            Object.values(ASSETS.bgVideos).forEach(v => {
                v.play().catch(() => {});
            });
            // Start title video
            if (ASSETS.titleVideo) {
                ASSETS.titleVideo.play().catch(() => {});
            }
        }
    }
    
    // Load title screen video
    const titleVideo = document.createElement('video');
    titleVideo.src = 'assets/title-video.mp4';
    titleVideo.loop = true;
    titleVideo.muted = true;
    titleVideo.playsInline = true;
    titleVideo.preload = 'auto';
    titleVideo.autoplay = true;
    titleVideo.addEventListener('canplaythrough', () => {
        if (!titleVideo._loaded) {
            titleVideo._loaded = true;
            onLoad();
        }
    }, { once: false });
    titleVideo.addEventListener('error', () => {
        if (!titleVideo._loaded) {
            titleVideo._loaded = true;
            onLoad();
        }
    }, { once: true });
    titleVideo.load();
    ASSETS.titleVideo = titleVideo;
    
    // Create video elements for each unique source
    const videoCache = {}; // Cache to reuse same video for duplicate sources
    
    Object.entries(BG_VIDEO_SOURCES).forEach(([levelIdx, src]) => {
        if (videoCache[src]) {
            // Reuse existing video element for same source
            ASSETS.bgVideos[levelIdx] = videoCache[src];
        } else {
            // Create new video element
            const video = document.createElement('video');
            video.src = src;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.autoplay = true;
            
            // Load handler
            video.addEventListener('canplaythrough', () => {
                if (!video._loaded) {
                    video._loaded = true;
                    onLoad();
                }
            }, { once: false });
            
            video.addEventListener('error', () => {
                if (!video._loaded) {
                    video._loaded = true;
                    onLoad();
                }
            }, { once: true });
            
            // Start loading
            video.load();
            
            videoCache[src] = video;
            ASSETS.bgVideos[levelIdx] = video;
        }
    });
    
    ASSETS.tiles = new Image();
    ASSETS.tiles.onload = onLoad;
    ASSETS.tiles.onerror = onLoad;
    ASSETS.tiles.src = 'assets/tiles-wood.png';
    
    // Load character sprites
    ASSETS.player = new Image();
    ASSETS.player.onload = onLoad;
    ASSETS.player.onerror = onLoad;
    ASSETS.player.src = 'assets/player.png';
    
    // Load enemy sprites
    for (let i = 1; i <= 3; i++) {
        const enemy = new Image();
        enemy.onload = onLoad;
        enemy.onerror = onLoad;
        enemy.src = `assets/enemy${i}.png`;
        ASSETS.enemies.push(enemy);
    }
}

function setBackgroundForLevel(levelIndex) {
    ASSETS.activeBgIndex = levelIndex;
}

// =============================================================================
// SOUND SYSTEM
// =============================================================================

const AUDIO = {
    ctx: null,
    initialized: false,
    musicTracks: {},  // Music per level
    currentMusic: null,
    muted: false,
    volume: 0.05,
};

// Music tracks per level
const MUSIC_SOURCES = {
    0: 'assets/music-bg.mp3',        // Dojo - Shadow of the Pixel Blade
    1: 'assets/music-tower.mp3',     // Tower - Shadow Edge Oath
    2: 'assets/music-pit.mp3',       // Pit - Shadow Beast
    3: 'assets/music-scattered.mp3', // Scattered - Shadow Steel Showdown
};

function initAudio() {
    if (AUDIO.initialized) return;
    AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)();
    AUDIO.initialized = true;
    
    // Load all music tracks
    loadMusicTracks();
    
    // Start music for current level
    switchMusicForLevel(state.currentLevelIndex);
}

function loadMusicTracks() {
    // Preload all music tracks
    Object.entries(MUSIC_SOURCES).forEach(([levelIdx, src]) => {
        const audio = new Audio();
        audio.src = src;
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = AUDIO.muted ? 0 : AUDIO.volume;
        AUDIO.musicTracks[levelIdx] = audio;
    });
}

function switchMusicForLevel(levelIndex) {
    const newTrack = AUDIO.musicTracks[levelIndex];
    if (!newTrack) return;
    
    // Stop current music
    if (AUDIO.currentMusic && AUDIO.currentMusic !== newTrack) {
        AUDIO.currentMusic.pause();
        AUDIO.currentMusic.currentTime = 0;
    }
    
    // Start new track
    newTrack.volume = AUDIO.muted ? 0 : AUDIO.volume;
    newTrack.play().catch(() => {});
    AUDIO.currentMusic = newTrack;
}

function setMusicVolume(vol) {
    AUDIO.volume = Math.max(0, Math.min(1, vol));
    if (AUDIO.currentMusic && !AUDIO.muted) {
        AUDIO.currentMusic.volume = AUDIO.volume;
    }
    // Update slider
    document.getElementById('volume-slider').value = AUDIO.volume * 100;
}

function toggleMute() {
    AUDIO.muted = !AUDIO.muted;
    if (AUDIO.currentMusic) {
        AUDIO.currentMusic.volume = AUDIO.muted ? 0 : AUDIO.volume;
    }
    // Update button
    document.getElementById('mute-btn').textContent = AUDIO.muted ? '🔇' : '🔊';
}

// Setup audio controls
function setupAudioControls() {
    const muteBtn = document.getElementById('mute-btn');
    const volumeSlider = document.getElementById('volume-slider');
    
    muteBtn.addEventListener('click', () => {
        // Initialize audio if not yet (first interaction)
        if (!AUDIO.initialized) initAudio();
        toggleMute();
    });
    
    volumeSlider.addEventListener('input', (e) => {
        // Initialize audio if not yet
        if (!AUDIO.initialized) initAudio();
        setMusicVolume(e.target.value / 100);
    });
    
    // Set initial slider value
    volumeSlider.value = AUDIO.volume * 100;
}

// Metallic clash sound - sword on sword
function playClashSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // High metallic ring
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);
    
    // Harsh impact layer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(400, now);
    osc2.frequency.exponentialRampToValueAtTime(100, now + 0.08);
    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.1);
    
    // Noise burst for impact
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    noise.connect(noiseGain).connect(ctx.destination);
    noise.start(now);
}

// Death sound - dramatic slice
function playDeathSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // Low thud
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);
    
    // Slice whoosh
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.15);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.15);
}

// Dash sound - quick whoosh
function playDashSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // Fast whoosh with noise
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        // Filtered noise that sweeps down
        const t = i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * (1 - t) * Math.sin(t * 50);
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.12);
    filter.Q.value = 1;
    
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    noise.connect(filter).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
    
    // Add a quick pitch sweep
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(oscGain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
}

// Respawn sound - ethereal materialization
function playRespawnSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // Rising shimmer
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    gain1.gain.setValueAtTime(0.01, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);
    
    // Harmonic layer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(400, now);
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    gain2.gain.setValueAtTime(0.01, now);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.25);
    
    // Sparkle noise burst
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.1, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    noise.connect(filter).connect(noiseGain).connect(ctx.destination);
    noise.start(now + 0.05);
}

// Dash bump/ricochet sound - pinball bumper style
function playBumperSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // Sharp attack with pitch bend (pinball bumper)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);
    
    // Bright high harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1600, now);
    osc2.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    gain2.gain.setValueAtTime(0.25, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.1);
    
    // Punchy low thud
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(150, now);
    osc3.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    gain3.gain.setValueAtTime(0.3, now);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc3.connect(gain3).connect(ctx.destination);
    osc3.start(now);
    osc3.stop(now + 0.1);
}

// =============================================================================
// MATCH INTRO SOUNDS
// =============================================================================

// Whoosh sound for text slide-in
function playSlideSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // Swoosh noise
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * (1 - t * 0.5);
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.2);
    filter.Q.value = 2;
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    noise.connect(filter).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
}

// Letter tick sound for READY text
function playTickSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.03);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
}

// Countdown beep sound (3, 2, 1)
function playCountdownSound(num) {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // Higher pitch for lower numbers
    const baseFreq = num === 1 ? 600 : (num === 2 ? 500 : 400);
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.15);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
    
    // Add harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2, now);
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.15);
}

// FIGHT! sound - big impact
function playFightSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // Big low impact
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(60, now + 0.3);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);
    
    // Bright attack
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    gain2.gain.setValueAtTime(0.25, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.15);
    
    // Impact noise
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    noise.connect(noiseGain).connect(ctx.destination);
    noise.start(now);
}

// =============================================================================
// MATCH OUTRO SOUNDS
// =============================================================================

// Heavy letter slam sound
function playLetterSlamSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // Heavy impact
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
    
    // Impact noise
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    noise.connect(noiseGain).connect(ctx.destination);
    noise.start(now);
}

// Typewriter tick for message text
function playTypeSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
}

// Victory fanfare - triumphant
function playVictorySound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // Triumphant chord - root
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(220, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);
    
    // Major third
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(277, now);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.7);
    
    // Fifth
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sawtooth';
    osc3.frequency.setValueAtTime(330, now);
    gain3.gain.setValueAtTime(0.15, now);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc3.connect(gain3).connect(ctx.destination);
    osc3.start(now);
    osc3.stop(now + 0.6);
    
    // High octave
    const osc4 = ctx.createOscillator();
    const gain4 = ctx.createGain();
    osc4.type = 'triangle';
    osc4.frequency.setValueAtTime(440, now);
    gain4.gain.setValueAtTime(0.2, now);
    gain4.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc4.connect(gain4).connect(ctx.destination);
    osc4.start(now);
    osc4.stop(now + 0.5);
    
    // Impact
    const osc5 = ctx.createOscillator();
    const gain5 = ctx.createGain();
    osc5.type = 'sine';
    osc5.frequency.setValueAtTime(150, now);
    osc5.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    gain5.gain.setValueAtTime(0.35, now);
    gain5.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc5.connect(gain5).connect(ctx.destination);
    osc5.start(now);
    osc5.stop(now + 0.3);
}

// Game over somber tone
function playGameOverSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    // Descending minor - somber
    const notes = [220, 196, 165, 147]; // A3 -> G3 -> E3 -> D3
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.5);
    });
}

// Prompt appear sound
function playPromptSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(800, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
}

// Confirm/restart sound
function playConfirmSound() {
    if (!AUDIO.ctx) initAudio();
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.08);
    osc.frequency.setValueAtTime(880, now + 0.16);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
}

// =============================================================================
// VISUAL EFFECTS - Drawing Functions
// =============================================================================

// Draw rectangular slash effect matching hitbox
function drawSlashRect(ctx, hitbox, dirX, dirY, progress) {
    ctx.save();
    
    // Fade out over duration
    const alpha = 1 - progress * 0.8;
    ctx.globalAlpha = alpha;
    
    const x = hitbox.x;
    const y = hitbox.y;
    const w = hitbox.w;
    const h = hitbox.h;
    
    // Glow effect
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 15;
    
    // Outer white slash
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(x, y, w, h);
    
    // Inner gradient - Strider-style fade
    const gradient = ctx.createLinearGradient(
        dirX !== 0 ? (dirX > 0 ? x : x + w) : x,
        dirY !== 0 ? (dirY > 0 ? y : y + h) : y,
        dirX !== 0 ? (dirX > 0 ? x + w : x) : x + w,
        dirY !== 0 ? (dirY > 0 ? y + h : y) : y + h
    );
    gradient.addColorStop(0, 'rgba(170, 238, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(170, 238, 255, 0.4)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    
    // Sharp edge line on leading edge
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    if (dirX > 0) {
        ctx.moveTo(x + w, y);
        ctx.lineTo(x + w, y + h);
    } else if (dirX < 0) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h);
    } else if (dirY < 0) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
    } else {
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + w, y + h);
    }
    ctx.stroke();
    
    ctx.restore();
}

// =============================================================================
// INPUT
// =============================================================================

const keys = {};
const keysJustPressed = {};

window.addEventListener('keydown', e => {
    if (!keys[e.code]) keysJustPressed[e.code] = true;
    keys[e.code] = true;
    // Initialize audio on first keypress (browser autoplay policy)
    if (!AUDIO.initialized) initAudio();
    // Toggle debug mode with D
    if (e.code === 'KeyD' && !e.repeat) {
        state.debugMode = !state.debugMode;
        toggleDebugPanel(state.debugMode);
        console.log('Debug mode:', state.debugMode);
    }
    // Time scale controls (O = slower, P = faster)
    if (e.code === 'KeyO') {
        state.timeScale = Math.max(0.01, state.timeScale - 0.01);
        console.log('Time scale:', Math.round(state.timeScale * 100) + '%');
    }
    if (e.code === 'KeyP') {
        state.timeScale = Math.min(2.0, state.timeScale + 0.01);
        console.log('Time scale:', Math.round(state.timeScale * 100) + '%');
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

// =============================================================================
// DEBUG PANEL
// =============================================================================

function toggleDebugPanel(show) {
    const panel = document.getElementById('debug-panel');
    if (!panel) return;
    
    if (show) {
        panel.classList.remove('hidden');
        buildDebugPanel();
    } else {
        panel.classList.add('hidden');
    }
}

function buildDebugPanel() {
    const content = document.getElementById('debug-content');
    if (!content) return;
    
    // Group settings by category
    const categories = {
        'Physics': ['GRAVITY', 'MAX_FALL_SPEED', 'FRICTION'],
        'Movement': ['PLAYER_SPEED', 'PLAYER_ACCEL', 'PLAYER_DECEL', 'PLAYER_AIR_ACCEL', 'PLAYER_AIR_DECEL', 'PLAYER_JUMP', 'PLAYER_WALL_SLIDE', 'PLAYER_WALL_JUMP_X', 'PLAYER_WALL_JUMP_Y', 'PLAYER_DASH_SPEED', 'PLAYER_DASH_DURATION', 'PLAYER_DASH_COOLDOWN'],
        'Combat': ['SLASH_WIDTH', 'SLASH_HEIGHT', 'SWORD_DURATION', 'SWORD_COOLDOWN', 'SURFACE_DEFLECT_SPEED', 'HIT_STUN_DURATION', 'HIT_STUN_KNOCKBACK', 'CLASH_KNOCKBACK', 'GROUND_SLASH_BOUNCE', 'WALL_SLASH_DELAY'],
        'Air Slash': ['AIR_SLASH_FRICTION', 'AIR_SLASH_FALL_MULT'],
        'Hit Stop': ['HIT_STOP_DURATION', 'CLASH_HIT_STOP_DURATION'],
        'Collision': ['BOP_BOUNCE_UP', 'BOP_PUSH_DOWN', 'PUSH_FORCE'],
        'AI': ['AI_REACTION_TIME', 'AI_AGGRESSION', 'AI_WANDER_CHANCE', 'AI_IDLE_TIME', 'AI_ATTACK_HESITATION', 'AI_RETREAT_CHANCE', 'AI_RETREAT_DURATION'],
        'Game': ['LIVES_PER_CHARACTER', 'RESPAWN_TIME', 'RESPAWN_INVULN', 'ENEMY_COUNT'],
    };
    
    let html = '';
    
    for (const [category, keys] of Object.entries(categories)) {
        html += `<div class="debug-section"><div class="debug-section-title">${category}</div>`;
        for (const key of keys) {
            const value = CONFIG[key];
            const step = Number.isInteger(value) ? 1 : 0.01;
            html += `
                <div class="debug-row">
                    <label>${key}</label>
                    <input type="number" id="cfg-${key}" value="${value}" step="${step}" data-key="${key}">
                </div>
            `;
        }
        html += '</div>';
    }
    
    content.innerHTML = html;
    
    // Add event listeners
    content.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                CONFIG[key] = value;
                console.log(`CONFIG.${key} = ${value}`);
            }
        });
    });
}

function copySettingsToClipboard() {
    const settings = {};
    TUNABLE_KEYS.forEach(key => {
        settings[key] = CONFIG[key];
    });
    
    const text = JSON.stringify(settings, null, 2);
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copy-settings-btn');
        const original = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = original, 1500);
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

function setupDebugPanel() {
    const copyBtn = document.getElementById('copy-settings-btn');
    const closeBtn = document.getElementById('close-debug-btn');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', copySettingsToClipboard);
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            state.debugMode = false;
            toggleDebugPanel(false);
        });
    }
}

function clearJustPressed() {
    for (const k in keysJustPressed) delete keysJustPressed[k];
}

// =============================================================================
// GAME STATE
// =============================================================================

const state = {
    // Title screen state
    titleScreen: true,
    titleTransition: false,
    titleTransitionTimer: 0,
    titleFlashAlpha: 0,
    
    players: [],
    bullets: [],
    particles: [],
    slashEffects: [],
    spawnTelegraphs: [], // Respawn telegraph effects
    bloodBalls: [],      // Flying blood projectiles that drip and splash
    dashEchoes: [],      // Afterimage echoes when dashing
    platforms: [],
    currentLevel: '',
    currentLevelIndex: 0,
    verticalWrap: false,
    screenShake: 0,
    timeScale: 1.0, // 1.0 = normal speed
    round: 1,
    paused: false,
    message: '',
    messageTimer: 0,
    hitStopTimer: 0, // Characters freeze but particles continue
    isClashHitStop: false, // Whether hit stop is from clash (vs death)
    debugMode: false, // Show collision boxes
    
    // Match intro state
    introActive: false,
    introPhase: 'none', // 'round', 'ready', 'countdown', 'fight', 'none'
    introTimer: 0,
    introData: {
        roundSlideX: 0,      // X position for round text slide-in
        readyLetters: 0,     // How many letters of "READY" to show
        countdownNum: 3,     // Current countdown number
        fightScale: 0,       // Scale for FIGHT! pop-in
    },
    
    // Game over state (prevents multiple reset triggers)
    gameOverPending: false,
    
    // Final hit state (delay before outro to let effects resolve)
    finalHitActive: false,
    finalHitTimer: 0,
    finalHitType: 'none', // 'gameover' or 'victory'
    
    // Match outro state (game over / victory)
    outroActive: false,
    outroType: 'none', // 'gameover', 'victory', 'none'
    outroPhase: 'none',
    outroTimer: 0,
    outroData: {
        lettersSlammed: 0,      // How many letters have slammed in
        fadeAlpha: 0,           // Screen fade to black
        messageLetters: 0,      // Typewriter effect for message
        promptVisible: false,   // Show X prompt
        promptBlink: 0,         // Blink timer for prompt
        victoryScale: 0,        // Victory text scale
        echoScales: [],         // Victory echo scales
    },
};

// =============================================================================
// STAGE
// =============================================================================

// Level configurations
// solid: true = full collision (walls, floor), false/undefined = jump-through platform
const LEVELS = [
    {
        name: 'Dojo',
        verticalWrap: false,
        platforms: (W, H) => [
            { x: 0, y: H - 32, w: W, h: 32, solid: true },           // Ground
            { x: 0, y: 0, w: 32, h: H - 32, solid: true },           // Left wall
            { x: W - 32, y: 0, w: 32, h: H - 32, solid: true },      // Right wall
            { x: 120, y: H - 140, w: 120, h: 16 },
            { x: W - 240, y: H - 140, w: 120, h: 16 },
            { x: W/2 - 80, y: H - 220, w: 160, h: 16 },
            { x: 60, y: H - 300, w: 100, h: 16 },
            { x: W - 160, y: H - 300, w: 100, h: 16 },
        ],
    },
    {
        name: 'Tower',
        verticalWrap: false,
        platforms: (W, H) => [
            { x: 0, y: H - 32, w: W, h: 32, solid: true },           // Ground
            { x: 0, y: 0, w: 32, h: H - 32, solid: true },           // Left wall
            { x: W - 32, y: 0, w: 32, h: H - 32, solid: true },      // Right wall
            { x: W/2 - 60, y: H - 100, w: 120, h: 16 },
            { x: W/2 - 80, y: H - 180, w: 160, h: 16 },
            { x: W/2 - 60, y: H - 260, w: 120, h: 16 },
            { x: W/2 - 40, y: H - 340, w: 80, h: 16 },
            { x: 60, y: H - 200, w: 80, h: 16 },
            { x: W - 140, y: H - 200, w: 80, h: 16 },
        ],
    },
    {
        name: 'Pit',
        verticalWrap: true,
        platforms: (W, H) => [
            { x: 0, y: H - 32, w: 200, h: 32, solid: true },         // Left ground
            { x: W - 200, y: H - 32, w: 200, h: 32, solid: true },   // Right ground
            { x: 0, y: 0, w: 32, h: H, solid: true },                // Left wall
            { x: W - 32, y: 0, w: 32, h: H, solid: true },           // Right wall
            { x: W/2 - 50, y: H - 80, w: 100, h: 16 },
            { x: 80, y: H - 150, w: 100, h: 16 },
            { x: W - 180, y: H - 150, w: 100, h: 16 },
            { x: W/2 - 70, y: H - 230, w: 140, h: 16 },
            { x: 40, y: H - 300, w: 120, h: 16 },
            { x: W - 160, y: H - 300, w: 120, h: 16 },
        ],
    },
    {
        name: 'Scattered',
        verticalWrap: false,
        platforms: (W, H) => [
            { x: 0, y: H - 32, w: W, h: 32, solid: true },           // Ground
            { x: 0, y: 0, w: 32, h: H - 32, solid: true },           // Left wall
            { x: W - 32, y: 0, w: 32, h: H - 32, solid: true },      // Right wall
            { x: 80, y: H - 100, w: 80, h: 16 },
            { x: W - 160, y: H - 130, w: 80, h: 16 },
            { x: 200, y: H - 180, w: 80, h: 16 },
            { x: W/2 - 40, y: H - 140, w: 80, h: 16 },
            { x: W - 280, y: H - 230, w: 80, h: 16 },
            { x: 120, y: H - 280, w: 80, h: 16 },
            { x: W/2 - 40, y: H - 320, w: 80, h: 16 },
            { x: W - 200, y: H - 350, w: 80, h: 16 },
        ],
    },
];

function createStage(levelIndex) {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;
    
    // Use specified level or random
    const idx = levelIndex !== undefined ? levelIndex : Math.floor(Math.random() * LEVELS.length);
    const level = LEVELS[idx];
    state.currentLevel = level.name;
    state.currentLevelIndex = idx;
    state.verticalWrap = level.verticalWrap || false;
    state.platforms = level.platforms(W, H);
    
    // Set background video for this level
    setBackgroundForLevel(idx);
    
    // Switch music for this level
    if (AUDIO.initialized) {
        switchMusicForLevel(idx);
    }
}

// =============================================================================
// PLAYER CLASS
// =============================================================================

class Player {
    constructor(x, y, isAI = false, color = COLORS.player1, enemyIndex = 0) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.w = 32;  // Doubled hitbox
        this.h = 48;  // Doubled hitbox
        this.enemyIndex = enemyIndex; // Which enemy sprite (0, 1, 2)
        this.vx = 0;
        this.vy = 0;
        this.facing = 1; // 1 = right, -1 = left
        this.color = color;
        this.isAI = isAI;
        this.currentFrame = 'idle';
        
        // State flags
        this.grounded = false;
        this.wallSliding = false;
        this.wallDir = 0;
        this.dropThroughTimer = 0; // Frames to ignore jump-through platforms
        
        // Dash
        this.dashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashDir = 1;
        
        // Combat
        this.slashing = false;
        this.slashTimer = 0;
        this.slashCooldown = 0;
        this.slashDir = { x: 1, y: 0 }; // Direction of current slash (4-way)
        this.bullets = CONFIG.BULLET_COUNT;
        this.gunCooldown = 0;
        
        // Health
        this.alive = true;
        this.respawnTimer = 0;
        this.lives = CONFIG.LIVES_PER_CHARACTER;
        this.invulnTimer = 0; // Invulnerability after respawn
        this.spawnEffectTimer = 0; // Visual spawn effect
        
        // Movement lock (for wall slash delay)
        this.movementLockTimer = 0;
        
        // Hit stun
        this.stunned = false;
        this.stunTimer = 0;
        
        // Hit stop death pending
        this.pendingDeath = false;
        this.pendingKnockbackX = 0;
        this.pendingKnockbackY = 0;
        this.killer = null;
        
        // Clash knockback pending
        this.pendingClash = false;
        this.pendingClashKnockbackX = 0;
        this.pendingClashKnockbackY = 0;
        this.clashGlowTimer = 0; // Glowing white border during/after clash
        
        // AI state
        this.aiTarget = null;
        this.aiDecisionTimer = 0;
        this.aiAction = 'idle';
        this.aiWanderDir = 1;
        this.aiIdleTimer = 0;
        this.aiPatrolTarget = null;
        this.aiAttackDelay = 0; // Frames to wait before attacking
        this.aiRetreatTimer = 0; // Forced retreat duration
    }
    
    update() {
        if (!this.alive) {
            if (this.respawnTimer > 0) {
                this.respawnTimer--;
                if (this.respawnTimer <= 0) this.respawn();
            }
            return;
        }
        
        // Freeze during match intro (except fight phase)
        if (isIntroBlocking()) {
            return;
        }
        
        // Update stun
        if (this.stunned) {
            this.stunTimer--;
            if (this.stunTimer <= 0) {
                this.stunned = false;
            }
            // Still apply physics when stunned, but no control
            this.applyPhysics();
            return;
        }
        
        // Cooldowns
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.slashCooldown > 0) this.slashCooldown--;
        if (this.gunCooldown > 0) this.gunCooldown--;
        if (this.movementLockTimer > 0) this.movementLockTimer--;
        if (this.invulnTimer > 0) this.invulnTimer--;
        if (this.spawnEffectTimer > 0) this.spawnEffectTimer--;
        if (this.clashGlowTimer > 0) this.clashGlowTimer--;
        
        // Handle input
        if (this.isAI) {
            this.updateAI();
        } else {
            this.handleInput();
        }
        
        // Physics
        this.applyPhysics();
        
        // Update slash
        if (this.slashing) {
            this.slashTimer--;
            if (this.slashTimer <= 0) this.slashing = false;
        }
        
        // Update dash
        if (this.dashing) {
            this.dashTimer--;
            // Spawn echo every 2 frames during dash
            if (this.dashTimer % CONFIG.DASH_ECHO_INTERVAL === 0 && this.dashTimer > 0) {
                spawnDashEcho(this);
            }
            if (this.dashTimer <= 0) this.dashing = false;
        }
    }
    
    handleInput() {
        // Horizontal movement with momentum (blocked during movement lock or mid-dash)
        // Allow input in last 2 frames of dash for responsive exit
        const dashLocked = this.dashing && this.dashTimer > 2;
        if (this.movementLockTimer <= 0 && !dashLocked) {
            const accel = this.grounded ? CONFIG.PLAYER_ACCEL : CONFIG.PLAYER_AIR_ACCEL;
            const decel = this.grounded ? CONFIG.PLAYER_DECEL : CONFIG.PLAYER_AIR_DECEL;
            
            if (keys['ArrowLeft'] || keys['KeyA']) {
                // Accelerate left
                this.vx -= accel;
                if (this.vx < -CONFIG.PLAYER_SPEED) this.vx = -CONFIG.PLAYER_SPEED;
                this.facing = -1;
            } else if (keys['ArrowRight'] || keys['KeyD']) {
                // Accelerate right
                this.vx += accel;
                if (this.vx > CONFIG.PLAYER_SPEED) this.vx = CONFIG.PLAYER_SPEED;
                this.facing = 1;
            } else {
                // Decelerate (slide to stop)
                this.vx *= decel;
                if (Math.abs(this.vx) < 0.1) this.vx = 0;
            }
        }
        
        // Jump (X key)
        if (keysJustPressed['KeyX'] || keysJustPressed['KeyK']) {
            const holdingDown = keys['ArrowDown'] || keys['KeyS'];
            
            if (this.grounded && holdingDown) {
                // Drop through platform
                this.dropThroughTimer = 10; // Ignore platforms for 10 frames
                this.grounded = false;
            } else if (this.grounded) {
                // Normal jump
                this.vy = CONFIG.PLAYER_JUMP;
                this.grounded = false;
            } else if (this.wallSliding) {
                // Wall jump
                this.vx = CONFIG.PLAYER_WALL_JUMP_X * -this.wallDir;
                this.vy = CONFIG.PLAYER_WALL_JUMP_Y;
                this.wallSliding = false;
                this.facing = -this.wallDir;
            }
        }
        
        // Dash
        if ((keysJustPressed['ShiftLeft'] || keysJustPressed['ShiftRight']) && this.dashCooldown <= 0) {
            this.dash();
        }
        
        // Sword slash (Z key) - 4 directional based on arrow keys (not while dashing)
        if ((keysJustPressed['KeyZ'] || keysJustPressed['KeyJ']) && this.slashCooldown <= 0 && !this.dashing) {
            // Determine slash direction from arrow keys
            const up = keys['ArrowUp'] || keys['KeyW'];
            const down = keys['ArrowDown'] || keys['KeyS'];
            const left = keys['ArrowLeft'] || keys['KeyA'];
            const right = keys['ArrowRight'] || keys['KeyD'];
            
            if (up && !down) {
                this.slashDir = { x: 0, y: -1 };
            } else if (down && !up) {
                this.slashDir = { x: 0, y: 1 };
            } else if (left && !right) {
                this.slashDir = { x: -1, y: 0 };
                this.facing = -1;
            } else if (right && !left) {
                this.slashDir = { x: 1, y: 0 };
                this.facing = 1;
            } else {
                // Default to facing direction
                this.slashDir = { x: this.facing, y: 0 };
            }
            
            this.slash();
        }
    }
    
    updateAI() {
        // Decrement retreat timer
        if (this.aiRetreatTimer > 0) {
            this.aiRetreatTimer--;
            this.aiWander(); // Just wander while in retreat mode
            return;
        }
        
        // Find nearest alive target (any other player/enemy)
        let target = null;
        let minDist = Infinity;
        
        for (const other of state.players) {
            if (other === this || !other.alive) continue;
            // Don't target invulnerable players
            if (other.invulnTimer > 0) continue;
            const d = Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2);
            if (d < minDist) {
                minDist = d;
                target = other;
            }
        }
        
        if (!target) {
            // No target - wander and occasionally whiff attack
            this.aiWander();
            if (Math.random() < 0.02 && this.slashCooldown <= 0) {
                this.aiRandomSlash();
            }
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = minDist;
        
        this.aiDecisionTimer--;
        if (this.aiDecisionTimer <= 0) {
            this.aiDecisionTimer = CONFIG.AI_REACTION_TIME + Math.random() * 20;
            this.makeAIDecision(target, dist);
            
            // Random chance to retreat instead
            if (Math.random() < CONFIG.AI_RETREAT_CHANCE) {
                this.aiRetreatTimer = CONFIG.AI_RETREAT_DURATION;
                this.aiAction = 'wander';
            }
        }
        
        // Execute current action
        switch (this.aiAction) {
            case 'idle':
                // Stand still, maybe face player
                this.aiIdleTimer--;
                if (this.aiIdleTimer <= 0) {
                    this.aiAction = Math.random() < 0.5 ? 'wander' : 'chase';
                }
                if (dist < 80) this.facing = dx > 0 ? 1 : -1;
                break;
                
            case 'wander':
                // Move in current wander direction with momentum
                this.aiAccelerate(this.aiWanderDir);
                
                // Change direction at walls (but commit for a while)
                if (this.x < 60 || this.wallDir === -1) this.aiWanderDir = 1;
                else if (this.x > CONFIG.WIDTH - 60 || this.wallDir === 1) this.aiWanderDir = -1;
                else if (Math.random() < 0.005) this.aiWanderDir *= -1; // Less frequent direction changes
                
                // Random jump while wandering
                if (this.grounded && Math.random() < 0.03) {
                    this.vy = CONFIG.PLAYER_JUMP * 0.8;
                }
                
                // Occasionally drop through platforms
                if (this.grounded && Math.random() < 0.01) {
                    this.dropThroughTimer = 10;
                    this.grounded = false;
                }
                break;
                
            case 'chase':
                // Chase with momentum - commit to horizontal direction
                this.aiAccelerate(Math.sign(dx));
                this.facing = dx > 0 ? 1 : -1;
                
                // Attack while chasing if in range (with hesitation)
                const chaseAttackRange = CONFIG.SLASH_WIDTH + 30;
                if (dist < chaseAttackRange && this.slashCooldown <= 0 && Math.random() < CONFIG.AI_ATTACK_HESITATION) {
                    const absDx = Math.abs(dx);
                    const absDy = Math.abs(dy);
                    if (absDy > absDx * 1.2 && dy < 0) {
                        this.slashDir = { x: 0, y: -1 };
                    } else if (absDy > absDx * 1.2 && dy > 0) {
                        this.slashDir = { x: 0, y: 1 };
                    } else {
                        this.slashDir = { x: dx > 0 ? 1 : -1, y: 0 };
                    }
                    this.slash();
                }
                
                // Only jump if target is significantly above
                if (dy < -60 && this.grounded && Math.random() < 0.1) {
                    this.vy = CONFIG.PLAYER_JUMP;
                }
                // Random jump gaps (less frequent)
                if (this.grounded && Math.random() < 0.02) {
                    this.vy = CONFIG.PLAYER_JUMP * 0.9;
                }
                
                // Drop through platform if target is below
                if (dy > 40 && this.grounded && Math.random() < 0.05) {
                    this.dropThroughTimer = 10;
                    this.grounded = false;
                }
                break;
                
            case 'attack':
                this.facing = dx > 0 ? 1 : -1;
                const attackRange = CONFIG.SLASH_WIDTH + 20; // Attack range
                
                // Decrement attack delay
                if (this.aiAttackDelay > 0) this.aiAttackDelay--;
                
                // Move toward target while attacking
                if (dist > attackRange * 0.5) {
                    this.aiAccelerate(Math.sign(dx));
                }
                
                // Attack when in range and delay is done
                if (dist < attackRange && this.slashCooldown <= 0 && this.aiAttackDelay <= 0) {
                    // AI picks slash direction toward target
                    const absDx = Math.abs(dx);
                    const absDy = Math.abs(dy);
                    
                    if (absDy > absDx * 1.2 && dy < 0) {
                        this.slashDir = { x: 0, y: -1 };
                    } else if (absDy > absDx * 1.2 && dy > 0) {
                        this.slashDir = { x: 0, y: 1 };
                    } else {
                        this.slashDir = { x: dx > 0 ? 1 : -1, y: 0 };
                    }
                    this.slash();
                    this.aiAction = 'retreat';
                    this.aiDecisionTimer = 15 + Math.floor(Math.random() * 15);
                }
                break;
                
            case 'retreat':
                // Retreat with momentum - commit to direction
                this.aiAccelerate(-Math.sign(dx));
                this.facing = dx > 0 ? 1 : -1; // Still face target
                if (this.grounded && Math.random() < 0.08) {
                    this.vy = CONFIG.PLAYER_JUMP * 0.7;
                }
                break;
                
            case 'dodge':
                if (this.dashCooldown <= 0) {
                    this.dashDir = Math.random() < 0.5 ? 1 : -1;
                    this.dash();
                    this.aiAction = 'idle';
                    this.aiIdleTimer = 20;
                }
                break;
        }
        
        // Wall jump if sliding
        if (this.wallSliding && Math.random() < 0.4) {
            this.vx = CONFIG.PLAYER_WALL_JUMP_X * -this.wallDir;
            this.vy = CONFIG.PLAYER_WALL_JUMP_Y;
            this.wallSliding = false;
        }
    }
    
    aiAccelerate(dir) {
        // AI uses momentum-based movement like player
        const accel = this.grounded ? CONFIG.PLAYER_ACCEL : CONFIG.PLAYER_AIR_ACCEL;
        const maxSpeed = CONFIG.PLAYER_SPEED * 0.9; // Slightly slower than player
        
        if (dir < 0) {
            this.vx -= accel;
            if (this.vx < -maxSpeed) this.vx = -maxSpeed;
            this.facing = -1;
        } else if (dir > 0) {
            this.vx += accel;
            if (this.vx > maxSpeed) this.vx = maxSpeed;
            this.facing = 1;
        }
    }
    
    aiWander() {
        // Wander with momentum
        this.aiAccelerate(this.aiWanderDir);
        
        if (this.x < 60) this.aiWanderDir = 1;
        else if (this.x > CONFIG.WIDTH - 60) this.aiWanderDir = -1;
        else if (Math.random() < 0.005) this.aiWanderDir *= -1; // Less direction changes
        
        if (this.grounded && Math.random() < 0.02) this.vy = CONFIG.PLAYER_JUMP * 0.7;
        
        // Occasional whiff attack while wandering
        if (Math.random() < 0.015 && this.slashCooldown <= 0) {
            this.aiRandomSlash();
        }
    }
    
    aiRandomSlash() {
        // Pick a random slash direction
        const dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: -1 },
            { x: 0, y: 1 },
        ];
        this.slashDir = dirs[Math.floor(Math.random() * dirs.length)];
        if (this.slashDir.x !== 0) this.facing = this.slashDir.x;
        this.slash();
    }
    
    makeAIDecision(target, dist) {
        const dx = target.x - this.x;
        const rand = Math.random();
        const attackRange = CONFIG.SLASH_WIDTH + CONFIG.SLASH_HEIGHT; // ~84 pixels
        
        if (dist < attackRange * 1.5) {
            // Close range - attack or dodge
            if (rand < CONFIG.AI_AGGRESSION) {
                this.aiAction = 'attack';
                this.aiAttackDelay = Math.floor(Math.random() * 20); // Random delay 0-20 frames
            } else {
                this.aiAction = 'dodge';
            }
        } else if (dist < 150) {
            // Medium range - approach and maybe attack
            if (rand < CONFIG.AI_AGGRESSION * 0.8) {
                this.aiAction = 'chase';
            } else if (rand < 0.7) {
                this.aiAction = 'attack'; // Sometimes attack from range
                this.aiAttackDelay = Math.floor(Math.random() * 15);
            } else {
                this.aiAction = 'wander';
            }
        } else {
            // Far - wander or chase
            if (rand < CONFIG.AI_WANDER_CHANCE) {
                this.aiAction = 'wander';
            } else if (rand < 0.7) {
                this.aiAction = 'chase';
            } else {
                this.aiAction = 'idle';
                this.aiIdleTimer = CONFIG.AI_IDLE_TIME * 0.5;
            }
        }
    }
    
    dash() {
        this.dashing = true;
        this.dashTimer = CONFIG.PLAYER_DASH_DURATION;
        this.dashCooldown = CONFIG.PLAYER_DASH_COOLDOWN;
        this.dashDir = this.facing;
        this.vx = this.dashDir * CONFIG.PLAYER_DASH_SPEED;
        this.vy = 0;
        spawnParticles(this.x, this.y + this.h/2, 5, this.color);
        // Spawn initial dash echo
        spawnDashEcho(this);
        playDashSound();
    }
    
    slash() {
        this.slashing = true;
        this.slashTimer = CONFIG.SWORD_DURATION;
        this.slashCooldown = CONFIG.SWORD_COOLDOWN;
        
        // Get the hitbox for the visual effect
        const hitbox = this.getSlashHitbox();
        
        // Add slash effect with hitbox info
        state.slashEffects.push({
            hitbox: hitbox,
            dirX: this.slashDir.x,
            dirY: this.slashDir.y,
            timer: CONFIG.SWORD_DURATION,
            owner: this,
        });
        
        // Check for hits (enemies and surfaces)
        this.checkSlashHits();
        this.checkSurfaceSlash();
    }
    
    checkSurfaceSlash() {
        // Check if slash hits a platform/wall and deflect player away
        const hitbox = this.getSlashHitbox();
        
        for (const p of state.platforms) {
            // Rectangle vs rectangle collision
            const hit = hitbox.x < p.x + p.w &&
                        hitbox.x + hitbox.w > p.x &&
                        hitbox.y < p.y + p.h &&
                        hitbox.y + hitbox.h > p.y;
            
            if (hit) {
                const slashX = hitbox.x + hitbox.w/2;
                const slashY = hitbox.y + hitbox.h/2;
                
                // Deflect player away from the surface they slashed
                if (this.slashDir.x !== 0) {
                    // Horizontal slash (wall) - push back with movement delay
                    this.vx = -this.slashDir.x * CONFIG.SURFACE_DEFLECT_SPEED;
                    this.vy = -3; // Small upward boost
                    this.movementLockTimer = CONFIG.WALL_SLASH_DELAY;
                } else if (this.slashDir.y < 0) {
                    // Upward slash hitting ceiling - push down and away
                    this.vy = CONFIG.SURFACE_DEFLECT_SPEED * 0.7;
                } else if (this.slashDir.y > 0) {
                    // Downward slash hitting floor - immediate bounce up
                    this.vy = CONFIG.GROUND_SLASH_BOUNCE;
                }
                
                // Spawn spark particles at impact point
                spawnParticles(slashX, slashY, 8, '#fff');
                spawnParticles(slashX, slashY, 5, '#ffee88');
                
                state.screenShake = 5;
                break; // Only deflect once
            }
        }
    }
    
    getSlashHitbox() {
        // Returns {x, y, w, h} for the rectangular slash hitbox
        const sw = CONFIG.SLASH_WIDTH;
        const sh = CONFIG.SLASH_HEIGHT;
        
        if (this.slashDir.x > 0) {
            // Right slash - extends from right edge of character
            return { x: this.x + this.w, y: this.y + this.h/2 - sh/2, w: sw, h: sh };
        } else if (this.slashDir.x < 0) {
            // Left slash - extends from left edge of character
            return { x: this.x - sw, y: this.y + this.h/2 - sh/2, w: sw, h: sh };
        } else if (this.slashDir.y < 0) {
            // Up slash - extends from top, rotated (swap w/h)
            return { x: this.x + this.w/2 - sh/2, y: this.y - sw, w: sh, h: sw };
        } else {
            // Down slash - extends from bottom, rotated (swap w/h)
            return { x: this.x + this.w/2 - sh/2, y: this.y + this.h, w: sh, h: sw };
        }
    }
    
    checkSlashHits() {
        // Get rectangular slash hitbox
        const hitbox = this.getSlashHitbox();
        const cx = hitbox.x + hitbox.w/2;
        const cy = hitbox.y + hitbox.h/2;
        
        // Hit other players
        for (const other of state.players) {
            if (other === this || !other.alive) continue;
            if (other.dashing) continue; // Dash i-frames
            if (other.invulnTimer > 0) continue; // Respawn invulnerability
            
            // Rectangle vs rectangle collision
            const hit = hitbox.x < other.x + other.w &&
                        hitbox.x + hitbox.w > other.x &&
                        hitbox.y < other.y + other.h &&
                        hitbox.y + hitbox.h > other.y;
            
            if (hit) {
                const otherCx = other.x + other.w/2;
                const otherCy = other.y + other.h/2;
                // Check for CLASH - both players slashing
                if (other.slashing) {
                    // Clash! Store pending knockback for after hit stop
                    const knockDir = this.x < other.x ? -1 : 1;
                    this.pendingClashKnockbackX = knockDir * CONFIG.CLASH_KNOCKBACK;
                    this.pendingClashKnockbackY = -5;
                    other.pendingClashKnockbackX = -knockDir * CONFIG.CLASH_KNOCKBACK;
                    other.pendingClashKnockbackY = -5;
                    this.pendingClash = true;
                    other.pendingClash = true;
                    
                    // Set clash glow on both players
                    this.clashGlowTimer = CONFIG.CLASH_GLOW_DURATION;
                    other.clashGlowTimer = CONFIG.CLASH_GLOW_DURATION;
                    
                    // Enhanced clash particles - bigger radial spark burst
                    const clashX = (this.x + other.x) / 2 + 8;
                    const clashY = (this.y + other.y) / 2 + 10;
                    spawnEnhancedClashParticles(clashX, clashY);
                    
                    // Trigger hit stop for clash
                    state.hitStopTimer = CONFIG.CLASH_HIT_STOP_DURATION;
                    state.isClashHitStop = true;
                    
                    state.screenShake = 15;
                    
                    // Play clash sound
                    playClashSound();
                    
                    // Cancel both slashes
                    this.slashing = false;
                    other.slashing = false;
                    this.slashCooldown = CONFIG.SWORD_COOLDOWN;
                    other.slashCooldown = CONFIG.SWORD_COOLDOWN;
                } else {
                    // Hit! Apply hit stop, blood, then kill
                    const hitX = otherCx;
                    const hitY = otherCy;
                    
                    // Blood particles (small spray)
                    spawnBloodParticles(hitX, hitY, 25, this.facing);
                    
                    // Blood balls - flying chunks that drip and splash
                    spawnBloodBalls(hitX, hitY, this.slashDir.x, this.slashDir.y);
                    
                    // Store knockback for after hit stop
                    other.pendingKnockbackX = this.facing * CONFIG.HIT_STUN_KNOCKBACK;
                    other.pendingKnockbackY = -3;
                    other.pendingDeath = true;
                    other.killer = this;
                    
                    // Trigger hit stop - freeze characters
                    state.hitStopTimer = CONFIG.HIT_STOP_DURATION;
                    
                    state.screenShake = 10;
                }
            }
        }
        
        // Deflect bullets (DISABLED when gun is disabled)
        if (CONFIG.GUN_ENABLED) {
            for (let i = state.bullets.length - 1; i >= 0; i--) {
                const b = state.bullets[i];
                if (b.owner === this) continue;
                
                const dist = Math.sqrt((b.x - cx) ** 2 + (b.y - cy) ** 2);
                if (dist < CONFIG.SWORD_RANGE) {
                    // Reflect bullet
                    b.vx = -b.vx * 1.2;
                    b.vy = (Math.random() - 0.5) * 2;
                    b.owner = this;
                    spawnParticles(b.x, b.y, 8, COLORS.bullet);
                    state.screenShake = 5;
                }
            }
        }
    }
    
    shoot() {
        this.bullets--;
        this.gunCooldown = CONFIG.GUN_COOLDOWN;
        
        state.bullets.push({
            x: this.x + this.w/2 + this.facing * 10,
            y: this.y + this.h/2,
            vx: this.facing * CONFIG.BULLET_SPEED,
            vy: 0,
            owner: this,
        });
        
        state.screenShake = 3;
        updateUI();
    }
    
    applyPhysics() {
        // Gravity (reduced if wall sliding or air slashing)
        if (!this.dashing) {
            if (this.wallSliding) {
                this.vy = Math.min(this.vy + CONFIG.GRAVITY * 0.2, CONFIG.PLAYER_WALL_SLIDE);
            } else if (this.slashing && !this.grounded) {
                // Air slash: reduced gravity and horizontal friction
                this.vy += CONFIG.GRAVITY * CONFIG.AIR_SLASH_FALL_MULT;
                this.vx *= CONFIG.AIR_SLASH_FRICTION;
            } else {
                this.vy += CONFIG.GRAVITY;
            }
            // Cap fall speed
            if (this.vy > CONFIG.MAX_FALL_SPEED) {
                this.vy = CONFIG.MAX_FALL_SPEED;
            }
        }
        
        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // Character-to-character collision
        for (const other of state.players) {
            if (other === this || !other.alive || !this.alive) continue;
            
            // Check overlap
            if (this.x < other.x + other.w &&
                this.x + this.w > other.x &&
                this.y < other.y + other.h &&
                this.y + this.h > other.y) {
                
                // Calculate overlap
                const overlapX = Math.min(this.x + this.w - other.x, other.x + other.w - this.x);
                const overlapY = Math.min(this.y + this.h - other.y, other.y + other.h - this.y);
                
                // Check for dash collision
                const thisDashing = this.dashing;
                const otherDashing = other.dashing;
                const collisionX = (this.x + other.x) / 2 + this.w / 2;
                const collisionY = (this.y + other.y) / 2 + this.h / 2;
                
                // Both dashing and facing each other = ricochet
                if (thisDashing && otherDashing) {
                    const facingEachOther = (this.dashDir === 1 && other.dashDir === -1 && this.x < other.x) ||
                                           (this.dashDir === -1 && other.dashDir === 1 && this.x > other.x);
                    
                    if (facingEachOther) {
                        // Dash ricochet! Both bounce away
                        const bounceSpeed = CONFIG.DASH_RICOCHET_SPEED;
                        const bounceUp = CONFIG.DASH_RICOCHET_UP;
                        
                        if (this.x < other.x) {
                            this.x = other.x - this.w;
                            this.vx = -bounceSpeed;
                            other.vx = bounceSpeed;
                        } else {
                            this.x = other.x + other.w;
                            this.vx = bounceSpeed;
                            other.vx = -bounceSpeed;
                        }
                        this.vy = bounceUp;
                        other.vy = bounceUp;
                        
                        // Cancel both dashes
                        this.dashing = false;
                        other.dashing = false;
                        
                        // Movement lock for both
                        this.movementLockTimer = CONFIG.BUMP_LOCK_DURATION;
                        other.movementLockTimer = CONFIG.BUMP_LOCK_DURATION;
                        
                        // VFX and SFX
                        spawnDashBumpParticles(collisionX, collisionY);
                        playBumperSound();
                        state.screenShake = 12;
                        
                        continue; // Skip normal collision handling
                    }
                }
                
                // One dashing into non-dashing = bump
                if (thisDashing && !otherDashing) {
                    const pushDir = this.x < other.x ? 1 : -1;
                    
                    // Bump the other player
                    other.vx = pushDir * CONFIG.DASH_BUMP_SPEED;
                    other.vy = CONFIG.DASH_BUMP_UP;
                    other.movementLockTimer = CONFIG.BUMP_LOCK_DURATION;
                    
                    // Slight recoil for dasher
                    this.vx *= 0.5;
                    
                    // Separate them
                    if (this.x < other.x) {
                        other.x = this.x + this.w + 2;
                    } else {
                        other.x = this.x - other.w - 2;
                    }
                    
                    // Small particle burst
                    spawnParticles(collisionX, collisionY, 8, '#fff');
                    state.screenShake = 5;
                    
                    continue; // Skip normal collision handling
                }
                
                // Normal collision (neither dashing, or other is dashing into this)
                if (overlapY < overlapX) {
                    // Vertical collision - check for bop
                    if (this.y < other.y && this.vy > 0) {
                        // This character is above and falling - bop bounce!
                        this.y = other.y - this.h;
                        this.vy = CONFIG.BOP_BOUNCE_UP;
                        // Push the bottom character down
                        if (!other.grounded) {
                            other.vy = Math.max(other.vy, CONFIG.BOP_PUSH_DOWN);
                        }
                    } else if (this.y > other.y) {
                        // This character is below
                        this.y = other.y + other.h;
                        if (this.vy < 0) this.vy = CONFIG.BOP_PUSH_DOWN;
                    }
                } else {
                    // Horizontal collision - push apart
                    if (this.x < other.x) {
                        this.x = other.x - this.w;
                        this.vx = -CONFIG.PUSH_FORCE;
                        other.vx = CONFIG.PUSH_FORCE;
                    } else {
                        this.x = other.x + other.w;
                        this.vx = CONFIG.PUSH_FORCE;
                        other.vx = -CONFIG.PUSH_FORCE;
                    }
                }
            }
        }
        
        // Friction only applies when dashing ends or for AI
        if (this.isAI && !this.dashing) {
            const decel = this.grounded ? CONFIG.PLAYER_DECEL : CONFIG.PLAYER_AIR_DECEL;
            this.vx *= decel;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }
        
        // Decrement drop-through timer
        if (this.dropThroughTimer > 0) this.dropThroughTimer--;
        
        // Collision with platforms
        this.grounded = false;
        this.wallSliding = false;
        this.wallDir = 0;
        
        for (const p of state.platforms) {
            const isSolid = p.solid === true;
            const isJumpThrough = !isSolid;
            
            // Skip jump-through platforms if dropping through
            if (isJumpThrough && this.dropThroughTimer > 0) continue;
            
            if (this.collides(p)) {
                const overlapX = Math.min(this.x + this.w - p.x, p.x + p.w - this.x);
                const overlapY = Math.min(this.y + this.h - p.y, p.y + p.h - this.y);
                
                if (isJumpThrough) {
                    // Jump-through platform: only collide from above when falling
                    const feetY = this.y + this.h - this.vy; // Previous feet position
                    if (this.vy > 0 && feetY <= p.y + 4) {
                        // Landing on top
                        this.y = p.y - this.h;
                        this.grounded = true;
                        this.vy = 0;
                    }
                    // No collision from below or sides
                } else {
                    // Solid platform: full collision
                    if (overlapX < overlapY) {
                        // Horizontal collision (wall)
                        if (this.x < p.x) {
                            this.x = p.x - this.w;
                            this.wallDir = 1;
                        } else {
                            this.x = p.x + p.w;
                            this.wallDir = -1;
                        }
                        this.vx = 0;
                        if (!this.grounded && this.vy > 0) {
                            this.wallSliding = true;
                        }
                    } else {
                        // Vertical collision
                        if (this.y < p.y) {
                            this.y = p.y - this.h;
                            this.grounded = true;
                        } else {
                            this.y = p.y + p.h;
                        }
                        this.vy = 0;
                    }
                }
            }
        }
        
        // Keep in bounds horizontally
        this.x = Math.max(0, Math.min(CONFIG.WIDTH - this.w, this.x));
        
        // Vertical wrapping (for Pit level)
        if (state.verticalWrap) {
            if (this.y > CONFIG.HEIGHT) {
                // Fell off bottom - wrap to top
                this.y = -this.h;
            } else if (this.y + this.h < 0) {
                // Went off top - wrap to bottom
                this.y = CONFIG.HEIGHT;
            }
        }
    }
    
    collides(rect) {
        return this.x < rect.x + rect.w &&
               this.x + this.w > rect.x &&
               this.y < rect.y + rect.h &&
               this.y + this.h > rect.y;
    }
    
    die() {
        this.alive = false;
        this.lives--;
        this.respawnTimer = this.lives > 0 ? CONFIG.RESPAWN_TIME : -1; // Don't respawn if no lives
        spawnParticles(this.x + this.w/2, this.y + this.h/2, 20, this.color);
        state.screenShake = 10;
        playDeathSound();
        
        // Create spawn telegraph at future respawn location
        if (this.lives > 0) {
            const spawnPoints = [
                { x: 120, y: CONFIG.HEIGHT - 120 },
                { x: CONFIG.WIDTH - 160, y: CONFIG.HEIGHT - 120 },
                { x: CONFIG.WIDTH / 2, y: CONFIG.HEIGHT - 260 },
                { x: 160, y: CONFIG.HEIGHT - 340 },
                { x: CONFIG.WIDTH - 200, y: CONFIG.HEIGHT - 340 },
            ];
            const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            this.pendingSpawnX = spawn.x + this.w / 2;
            this.pendingSpawnY = spawn.y + this.h / 2;
            
            state.spawnTelegraphs.push({
                x: this.pendingSpawnX,
                y: this.pendingSpawnY,
                timer: CONFIG.RESPAWN_TIME,
                maxTimer: CONFIG.RESPAWN_TIME,
                color: this.isAI ? '#f44' : '#4af',
                owner: this,
            });
        }
        
        updateUI();
        checkGameOver();
    }
    
    respawn() {
        if (this.lives <= 0) return; // Stay dead if no lives
        this.alive = true;
        
        // Use pending spawn location from telegraph, or pick random
        if (this.pendingSpawnX !== undefined) {
            this.x = this.pendingSpawnX - this.w / 2;
            this.y = this.pendingSpawnY - this.h / 2;
            this.pendingSpawnX = undefined;
            this.pendingSpawnY = undefined;
        } else {
            const spawnPoints = [
                { x: 120, y: CONFIG.HEIGHT - 120 },
                { x: CONFIG.WIDTH - 160, y: CONFIG.HEIGHT - 120 },
                { x: CONFIG.WIDTH / 2, y: CONFIG.HEIGHT - 260 },
                { x: 160, y: CONFIG.HEIGHT - 340 },
                { x: CONFIG.WIDTH - 200, y: CONFIG.HEIGHT - 340 },
            ];
            const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            this.x = spawn.x;
            this.y = spawn.y;
        }
        
        this.vx = 0;
        this.vy = 0;
        this.bullets = CONFIG.BULLET_COUNT;
        this.dashing = false;
        this.slashing = false;
        this.stunned = false;
        this.movementLockTimer = 0;
        this.invulnTimer = CONFIG.RESPAWN_INVULN;
        this.spawnEffectTimer = 30; // Spawn flash effect
        
        // AI should retreat after respawning
        if (this.isAI) {
            this.aiRetreatTimer = 60; // ~1 second before engaging
            this.aiAction = 'wander';
        }
        
        // Spawn particles
        spawnParticles(this.x + this.w/2, this.y + this.h/2, 15, '#fff');
        playRespawnSound();
        
        updateUI();
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        
        // Flash when dashing
        if (this.dashing && Math.floor(this.dashTimer / 2) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Flash white when stunned
        if (this.stunned && Math.floor(this.stunTimer / 3) % 2 === 0) {
            ctx.globalAlpha = 0.6;
        }
        
        // Invulnerability flash (blink effect)
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer / 4) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }
        
        // Spawn effect (bright flash)
        if (this.spawnEffectTimer > 0) {
            ctx.globalAlpha = 0.5 + (this.spawnEffectTimer / 30) * 0.5;
        }
        
        // Get the appropriate sprite
        let sprite;
        if (this.isAI) {
            sprite = ASSETS.enemies[this.enemyIndex % ASSETS.enemies.length];
        } else {
            sprite = ASSETS.player;
        }
        
        // Draw sprite
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            const spriteW = sprite.naturalWidth;
            const spriteH = sprite.naturalHeight;
            
            ctx.save();
            
            // Flip horizontally if facing left
            if (this.facing === -1) {
                ctx.translate(this.x + this.w / 2, 0);
                ctx.scale(-1, 1);
                ctx.translate(-(this.x + this.w / 2), 0);
            }
            
            // Center sprite on hitbox
            const drawX = this.x + (this.w - spriteW) / 2;
            const drawY = this.y + (this.h - spriteH);
            
            ctx.drawImage(sprite, drawX, drawY);
            
            // Clash glow effect - white glowing border
            if (this.clashGlowTimer > 0) {
                const glowAlpha = this.clashGlowTimer / CONFIG.CLASH_GLOW_DURATION;
                ctx.save();
                ctx.globalAlpha = glowAlpha;
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 15 + glowAlpha * 10;
                ctx.globalCompositeOperation = 'source-over';
                // Draw sprite again with glow
                ctx.drawImage(sprite, drawX, drawY);
                // Draw white overlay
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha * 0.5})`;
                ctx.fillRect(drawX, drawY, spriteW, spriteH);
                ctx.restore();
            }
            
            ctx.restore();
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = this.isAI ? COLORS.player2 : COLORS.player1;
            ctx.fillRect(this.x, this.y, this.w, this.h);
            
            // Clash glow for fallback
            if (this.clashGlowTimer > 0) {
                const glowAlpha = this.clashGlowTimer / CONFIG.CLASH_GLOW_DURATION;
                ctx.save();
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 15 + glowAlpha * 10;
                ctx.strokeStyle = `rgba(255, 255, 255, ${glowAlpha})`;
                ctx.lineWidth = 3;
                ctx.strokeRect(this.x - 1, this.y - 1, this.w + 2, this.h + 2);
                ctx.restore();
            }
        }
        
        // Slash effect is drawn in drawSlashEffects() - removed from here to avoid double render
        
        ctx.restore();
    }
}

// =============================================================================
// PARTICLES
// =============================================================================

function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        state.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 20 + Math.random() * 20,
            color,
            size: 2 + Math.random() * 2,
        });
    }
}

function spawnBloodParticles(x, y, count, direction) {
    for (let i = 0; i < count; i++) {
        // Blood sprays in hit direction
        const speed = 3 + Math.random() * 6;
        const angle = (direction > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.2;
        state.particles.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y + (Math.random() - 0.5) * 8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - Math.random() * 3,
            life: 30 + Math.random() * 30,
            color: Math.random() < 0.7 ? COLORS.blood : COLORS.bloodLight,
            size: 2 + Math.random() * 3,
            gravity: 0.3, // Blood falls faster
        });
    }
}

// Radial spark burst for sword clash
function spawnClashParticles(x, y) {
    // Bright center flash
    state.particles.push({
        x, y,
        vx: 0, vy: 0,
        life: 12,
        color: '#fff',
        size: 16,
        isFlash: true,
    });
    
    // Radial sparks shooting outward
    const sparkCount = 20;
    for (let i = 0; i < sparkCount; i++) {
        const angle = (i / sparkCount) * Math.PI * 2;
        const speed = 5 + Math.random() * 5;
        state.particles.push({
            x: x + (Math.random() - 0.5) * 4,
            y: y + (Math.random() - 0.5) * 4,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 15 + Math.random() * 10,
            color: Math.random() < 0.5 ? '#fff' : '#ffee88',
            size: 2 + Math.random() * 2,
            gravity: 0.1,
            trail: true,
        });
    }
    
    // Extra bright yellow sparks
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        state.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 20 + Math.random() * 15,
            color: '#fbbf24',
            size: 3,
            gravity: 0.25,
        });
    }
}

function updateParticles() {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity || 0.2; // Use custom gravity if set
        p.vx *= 0.99; // Slight air resistance
        p.life--;
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

function drawParticles(ctx) {
    for (const p of state.particles) {
        ctx.globalAlpha = p.life / 40;
        ctx.fillStyle = p.color;
        
        if (p.isFlash) {
            // Bright center flash - draw as circle with glow
            ctx.save();
            ctx.globalAlpha = p.life / 12;
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / 12), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (p.trail) {
            // Spark with trail
            ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.size), Math.floor(p.size));
            ctx.globalAlpha *= 0.5;
            ctx.fillRect(Math.floor(p.x - p.vx * 0.5), Math.floor(p.y - p.vy * 0.5), Math.floor(p.size * 0.7), Math.floor(p.size * 0.7));
        } else {
            ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.size), Math.floor(p.size));
        }
    }
    ctx.globalAlpha = 1;
}

// =============================================================================
// BULLETS
// =============================================================================

function updateBullets() {
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        
        // Check collision with players
        for (const player of state.players) {
            if (player === b.owner || !player.alive) continue;
            if (player.dashing) continue; // Dash i-frames
            
            if (b.x > player.x && b.x < player.x + player.w &&
                b.y > player.y && b.y < player.y + player.h) {
                player.die(); // die() handles lives, UI, game over
                state.bullets.splice(i, 1);
                break;
            }
        }
        
        // Check collision with platforms
        for (const p of state.platforms) {
            if (b.x > p.x && b.x < p.x + p.w && b.y > p.y && b.y < p.y + p.h) {
                spawnParticles(b.x, b.y, 5, COLORS.bullet);
                state.bullets.splice(i, 1);
                break;
            }
        }
        
        // Remove if out of bounds
        if (b.x < 0 || b.x > CONFIG.WIDTH || b.y < 0 || b.y > CONFIG.HEIGHT) {
            state.bullets.splice(i, 1);
        }
    }
}

function drawBullets(ctx) {
    ctx.fillStyle = COLORS.bullet;
    for (const b of state.bullets) {
        ctx.fillRect(Math.floor(b.x) - 2, Math.floor(b.y) - 2, 4, 4);
        // Trail
        ctx.globalAlpha = 0.5;
        ctx.fillRect(Math.floor(b.x - b.vx) - 1, Math.floor(b.y) - 1, 2, 2);
        ctx.globalAlpha = 1;
    }
}

// =============================================================================
// SLASH EFFECTS
// =============================================================================

function updateSlashEffects() {
    for (let i = state.slashEffects.length - 1; i >= 0; i--) {
        state.slashEffects[i].timer--;
        if (state.slashEffects[i].timer <= 0) {
            state.slashEffects.splice(i, 1);
        }
    }
}

function drawSlashEffects(ctx) {
    for (const s of state.slashEffects) {
        const progress = 1 - (s.timer / CONFIG.SWORD_DURATION);
        drawSlashRect(ctx, s.hitbox, s.dirX, s.dirY, progress);
    }
}

// Spawn telegraph - concentric rings shrinking
function updateSpawnTelegraphs() {
    for (let i = state.spawnTelegraphs.length - 1; i >= 0; i--) {
        state.spawnTelegraphs[i].timer--;
        if (state.spawnTelegraphs[i].timer <= 0) {
            state.spawnTelegraphs.splice(i, 1);
        }
    }
}

function drawSpawnTelegraphs(ctx) {
    for (const t of state.spawnTelegraphs) {
        const progress = 1 - (t.timer / t.maxTimer); // 0 to 1
        const numRings = 4;
        
        ctx.save();
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < numRings; i++) {
            // Each ring starts at different time and shrinks to center
            const ringDelay = i * 0.2;
            const ringProgress = Math.max(0, Math.min(1, (progress - ringDelay) / (1 - ringDelay)));
            
            if (ringProgress > 0 && ringProgress < 1) {
                const maxRadius = 80 + i * 20;
                const radius = maxRadius * (1 - ringProgress);
                const alpha = 0.8 - ringProgress * 0.6;
                
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        // Center point grows as rings converge
        if (progress > 0.7) {
            const centerAlpha = (progress - 0.7) / 0.3;
            const centerSize = centerAlpha * 8;
            ctx.globalAlpha = centerAlpha;
            ctx.fillStyle = t.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, centerSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// =============================================================================
// BLOOD BALL SYSTEM - Flying blood projectiles that drip and splash
// =============================================================================

function spawnBloodBalls(x, y, slashDirX, slashDirY) {
    const ballCount = CONFIG.BLOOD_BALL_COUNT_MIN + Math.floor(Math.random() * (CONFIG.BLOOD_BALL_COUNT_MAX - CONFIG.BLOOD_BALL_COUNT_MIN));
    
    for (let i = 0; i < ballCount; i++) {
        // Main direction follows slash, with spread
        const spreadAngle = (Math.random() - 0.5) * 0.8;
        let baseAngle;
        if (slashDirX !== 0) {
            baseAngle = slashDirX > 0 ? 0 : Math.PI;
        } else {
            baseAngle = slashDirY > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
        const angle = baseAngle + spreadAngle;
        const speed = 6 + Math.random() * 6;
        
        state.bloodBalls.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2, // Slight upward bias
            size: 6 + Math.random() * 6, // Medium sized balls
            life: 120,
            dripTimer: 0,
            dripInterval: 3 + Math.floor(Math.random() * 3), // Drip every 3-5 frames
        });
    }
}

function updateBloodBalls() {
    for (let i = state.bloodBalls.length - 1; i >= 0; i--) {
        const b = state.bloodBalls[i];
        
        // Physics
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.4; // Gravity
        b.vx *= 0.99; // Air resistance
        
        b.life--;
        
        // Drip blood drops while flying
        b.dripTimer++;
        if (b.dripTimer >= b.dripInterval) {
            b.dripTimer = 0;
            // Spawn small drip particle
            state.particles.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 1,
                vy: Math.random() * 2,
                life: 20 + Math.random() * 15,
                color: Math.random() < 0.6 ? COLORS.blood : COLORS.bloodLight,
                size: 2 + Math.random() * 2,
                gravity: 0.35,
            });
        }
        
        // Check collision with platforms for splash
        let splashed = false;
        for (const p of state.platforms) {
            if (b.x > p.x && b.x < p.x + p.w &&
                b.y > p.y && b.y < p.y + p.h) {
                // Splash on impact!
                spawnBloodSplash(b.x, b.y, b.vx, b.vy, b.size);
                splashed = true;
                break;
            }
        }
        
        // Remove if splashed, out of bounds, or expired
        if (splashed || b.life <= 0 || 
            b.x < -50 || b.x > CONFIG.WIDTH + 50 || 
            b.y > CONFIG.HEIGHT + 50) {
            state.bloodBalls.splice(i, 1);
        }
    }
}

function spawnBloodSplash(x, y, vx, vy, size) {
    // Splash particles spread based on impact velocity
    const impactSpeed = Math.sqrt(vx * vx + vy * vy);
    const splashCount = Math.floor(size * 1.5) + 5;
    
    for (let i = 0; i < splashCount; i++) {
        // Spread outward from impact point
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * (impactSpeed * 0.4);
        
        state.particles.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 4,
            vx: Math.cos(angle) * speed + vx * 0.2,
            vy: Math.sin(angle) * speed * 0.5 - Math.abs(vy) * 0.3, // Bounce up
            life: 25 + Math.random() * 20,
            color: Math.random() < 0.7 ? COLORS.blood : COLORS.bloodLight,
            size: 2 + Math.random() * 3,
            gravity: 0.4,
        });
    }
    
    // Add a few larger splatter globs
    for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI - Math.PI / 2; // Mostly upward
        state.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * (2 + Math.random() * 3),
            vy: -2 - Math.random() * 4,
            life: 30 + Math.random() * 20,
            color: COLORS.blood,
            size: 4 + Math.random() * 3,
            gravity: 0.5,
        });
    }
}

function drawBloodBalls(ctx) {
    for (const b of state.bloodBalls) {
        const alpha = Math.min(1, b.life / 30);
        ctx.globalAlpha = alpha;
        
        // Draw as circle with darker edge
        ctx.fillStyle = COLORS.blood;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = COLORS.bloodLight;
        ctx.beginPath();
        ctx.arc(b.x - b.size * 0.15, b.y - b.size * 0.15, b.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// =============================================================================
// DASH ECHO SYSTEM - Afterimage trails when dashing
// =============================================================================

function spawnDashEcho(player) {
    state.dashEchoes.push({
        x: player.x,
        y: player.y,
        w: player.w,
        h: player.h,
        facing: player.facing,
        isAI: player.isAI,
        enemyIndex: player.enemyIndex,
        life: CONFIG.DASH_ECHO_DURATION,
        maxLife: CONFIG.DASH_ECHO_DURATION,
    });
}

function updateDashEchoes() {
    for (let i = state.dashEchoes.length - 1; i >= 0; i--) {
        state.dashEchoes[i].life--;
        if (state.dashEchoes[i].life <= 0) {
            state.dashEchoes.splice(i, 1);
        }
    }
}

function drawDashEchoes(ctx) {
    for (const echo of state.dashEchoes) {
        const alpha = (echo.life / echo.maxLife) * 0.6;
        ctx.globalAlpha = alpha;
        
        // Get the appropriate sprite
        let sprite;
        if (echo.isAI) {
            sprite = ASSETS.enemies[echo.enemyIndex % ASSETS.enemies.length];
        } else {
            sprite = ASSETS.player;
        }
        
        // Draw ghostly echo
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            const spriteW = sprite.naturalWidth;
            const spriteH = sprite.naturalHeight;
            
            ctx.save();
            
            // Flip horizontally if facing left
            if (echo.facing === -1) {
                ctx.translate(echo.x + echo.w / 2, 0);
                ctx.scale(-1, 1);
                ctx.translate(-(echo.x + echo.w / 2), 0);
            }
            
            // Center sprite on hitbox
            const drawX = echo.x + (echo.w - spriteW) / 2;
            const drawY = echo.y + (echo.h - spriteH);
            
            // Tint the echo (cyan for player, red for enemies)
            ctx.filter = echo.isAI ? 'hue-rotate(0deg) brightness(1.5)' : 'hue-rotate(180deg) brightness(1.5)';
            ctx.drawImage(sprite, drawX, drawY);
            ctx.filter = 'none';
            
            ctx.restore();
        } else {
            // Fallback rectangle
            ctx.fillStyle = echo.isAI ? 'rgba(255, 100, 100, 0.5)' : 'rgba(100, 200, 255, 0.5)';
            ctx.fillRect(echo.x, echo.y, echo.w, echo.h);
        }
    }
    ctx.globalAlpha = 1;
}

// =============================================================================
// DASH BUMP/RICOCHET EFFECTS
// =============================================================================

function spawnDashBumpParticles(x, y) {
    // Bright center flash
    state.particles.push({
        x, y,
        vx: 0, vy: 0,
        life: 15,
        color: '#fff',
        size: 20,
        isFlash: true,
    });
    
    // Radial burst - fast expanding ring of sparks
    const sparkCount = 24;
    for (let i = 0; i < sparkCount; i++) {
        const angle = (i / sparkCount) * Math.PI * 2;
        const speed = 8 + Math.random() * 6;
        state.particles.push({
            x: x + (Math.random() - 0.5) * 4,
            y: y + (Math.random() - 0.5) * 4,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 12 + Math.random() * 8,
            color: Math.random() < 0.5 ? '#fff' : '#88eeff',
            size: 3 + Math.random() * 2,
            gravity: 0.05,
            trail: true,
        });
    }
    
    // Inner burst - slightly slower
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + Math.PI / 12;
        const speed = 4 + Math.random() * 4;
        state.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 18 + Math.random() * 10,
            color: '#aaeeff',
            size: 2 + Math.random() * 2,
            gravity: 0.15,
        });
    }
}

// =============================================================================
// ENHANCED CLASH EFFECTS
// =============================================================================

function spawnEnhancedClashParticles(x, y) {
    // Bigger center flash
    state.particles.push({
        x, y,
        vx: 0, vy: 0,
        life: 18,
        color: '#fff',
        size: 24,
        isFlash: true,
    });
    
    // More radial sparks shooting outward
    const sparkCount = 35;
    for (let i = 0; i < sparkCount; i++) {
        const angle = (i / sparkCount) * Math.PI * 2;
        const speed = 6 + Math.random() * 8;
        state.particles.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 6,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 20 + Math.random() * 15,
            color: Math.random() < 0.4 ? '#fff' : (Math.random() < 0.5 ? '#ffee88' : '#fbbf24'),
            size: 2 + Math.random() * 3,
            gravity: 0.15,
            trail: true,
        });
    }
    
    // Ring of bright sparks
    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const speed = 10 + Math.random() * 4;
        state.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 12,
            color: '#fff',
            size: 4,
            gravity: 0,
            trail: true,
        });
    }
    
    // Extra golden sparks
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 10;
        state.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            life: 25 + Math.random() * 20,
            color: '#fbbf24',
            size: 3 + Math.random() * 2,
            gravity: 0.3,
        });
    }
}

// Debug mode - draw collision boxes
function drawDebug(ctx) {
    if (!state.debugMode) return;
    
    ctx.save();
    ctx.lineWidth = 2;
    
    // Platform collision boxes (green)
    ctx.strokeStyle = '#0f0';
    for (const p of state.platforms) {
        ctx.strokeRect(p.x, p.y, p.w, p.h);
    }
    
    // Player collision boxes (cyan for player, magenta for AI)
    for (const p of state.players) {
        if (!p.alive) continue;
        ctx.strokeStyle = p.isAI ? '#f0f' : '#0ff';
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        
        // Draw slash hitbox if slashing (yellow)
        if (p.slashing) {
            ctx.strokeStyle = '#ff0';
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            const hitbox = p.getSlashHitbox();
            ctx.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
            ctx.strokeRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        }
    }
    
    // Slash effects (orange outline)
    ctx.strokeStyle = '#f80';
    for (const s of state.slashEffects) {
        ctx.strokeRect(s.hitbox.x, s.hitbox.y, s.hitbox.w, s.hitbox.h);
    }
    
    ctx.restore();
}

// =============================================================================
// TITLE SCREEN SYSTEM
// =============================================================================

function updateTitleScreen() {
    if (!state.titleScreen) return;
    
    // Handle transition
    if (state.titleTransition) {
        state.titleTransitionTimer++;
        
        // Flash to white then fade
        if (state.titleTransitionTimer < 15) {
            state.titleFlashAlpha = state.titleTransitionTimer / 15;
        } else if (state.titleTransitionTimer < 30) {
            state.titleFlashAlpha = 1;
        } else if (state.titleTransitionTimer < 50) {
            state.titleFlashAlpha = 1 - (state.titleTransitionTimer - 30) / 20;
        } else {
            // Transition complete - start the game
            state.titleScreen = false;
            state.titleTransition = false;
            state.titleFlashAlpha = 0;
            startMatchIntro();
        }
        return;
    }
    
    // Check for X key to start
    if (keysJustPressed['KeyX'] || keysJustPressed['KeyK']) {
        state.titleTransition = true;
        state.titleTransitionTimer = 0;
        playConfirmSound();
        // Initialize audio on first interaction
        if (!AUDIO.initialized) initAudio();
    }
}

function drawTitleScreen(ctx) {
    if (!state.titleScreen) return;
    
    // Draw title video background
    const video = ASSETS.titleVideo;
    if (video && video.readyState >= 2) {
        if (video.paused) video.play().catch(() => {});
        
        // Scale video to fill canvas while maintaining aspect ratio
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = CONFIG.WIDTH / CONFIG.HEIGHT;
        
        let drawWidth, drawHeight, drawX, drawY;
        if (videoAspect > canvasAspect) {
            drawHeight = CONFIG.HEIGHT;
            drawWidth = drawHeight * videoAspect;
            drawX = (CONFIG.WIDTH - drawWidth) / 2;
            drawY = 0;
        } else {
            drawWidth = CONFIG.WIDTH;
            drawHeight = drawWidth / videoAspect;
            drawX = 0;
            drawY = (CONFIG.HEIGHT - drawHeight) / 2;
        }
        
        ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
    } else {
        // Fallback dark background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }
    
    // Slight darken overlay at bottom for text readability
    const gradient = ctx.createLinearGradient(0, CONFIG.HEIGHT * 0.5, 0, CONFIG.HEIGHT);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    
    // "Press Start" text with pulsing glow
    const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.08;
    const textY = CONFIG.HEIGHT - 100;
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Outer glow
    ctx.font = `bold ${Math.floor(32 * pulse)}px "Press Start 2P", monospace`;
    ctx.shadowColor = '#4af';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#fff';
    ctx.fillText('Press Start', CONFIG.WIDTH / 2, textY);
    
    // Sharper layer
    ctx.shadowBlur = 10;
    ctx.fillText('Press Start', CONFIG.WIDTH / 2, textY);
    
    // "X" button indicator with blinking
    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    if (blink) {
        ctx.font = 'bold 20px "Press Start 2P", monospace';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('[ X ]', CONFIG.WIDTH / 2, textY + 45);
    }
    
    ctx.restore();
    
    // White flash overlay during transition
    if (state.titleFlashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${state.titleFlashAlpha})`;
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }
}

// =============================================================================
// MATCH INTRO SYSTEM
// =============================================================================

// Intro timing (frames at 60fps)
const INTRO_TIMING = {
    ROUND_SLIDE_DURATION: 25,    // Time for ROUND X to slide in
    ROUND_HOLD: 30,              // Time to hold ROUND X
    READY_LETTER_DELAY: 4,       // Frames between each letter of READY
    READY_HOLD: 20,              // Time to hold after READY complete
    COUNTDOWN_DURATION: 45,      // Time for each countdown number
    FIGHT_DURATION: 40,          // Time for FIGHT! to display
};

function startMatchIntro() {
    state.introActive = true;
    state.introPhase = 'round';
    state.introTimer = 0;
    state.introData = {
        roundSlideX: -CONFIG.WIDTH,
        readyLetters: 0,
        countdownNum: 3,
        fightScale: 0,
    };
    playSlideSound();
}

function updateIntro() {
    if (!state.introActive) return;
    
    state.introTimer++;
    const d = state.introData;
    
    switch (state.introPhase) {
        case 'round':
            // Slide ROUND X in from left
            const slideProgress = Math.min(1, state.introTimer / INTRO_TIMING.ROUND_SLIDE_DURATION);
            // Ease out quad
            const eased = 1 - Math.pow(1 - slideProgress, 3);
            d.roundSlideX = -CONFIG.WIDTH + (CONFIG.WIDTH / 2 + 100) * eased;
            
            if (state.introTimer >= INTRO_TIMING.ROUND_SLIDE_DURATION + INTRO_TIMING.ROUND_HOLD) {
                state.introPhase = 'ready';
                state.introTimer = 0;
            }
            break;
            
        case 'ready':
            // Type out READY one letter at a time
            const letterIndex = Math.floor(state.introTimer / INTRO_TIMING.READY_LETTER_DELAY);
            if (letterIndex > d.readyLetters && letterIndex <= 5) {
                d.readyLetters = letterIndex;
                playTickSound();
            }
            
            if (state.introTimer >= 5 * INTRO_TIMING.READY_LETTER_DELAY + INTRO_TIMING.READY_HOLD) {
                state.introPhase = 'countdown';
                state.introTimer = 0;
                d.countdownNum = 3;
                playCountdownSound(3);
            }
            break;
            
        case 'countdown':
            // 3, 2, 1 countdown
            const countdownPhase = Math.floor(state.introTimer / INTRO_TIMING.COUNTDOWN_DURATION);
            const newNum = 3 - countdownPhase;
            
            if (newNum !== d.countdownNum && newNum >= 1) {
                d.countdownNum = newNum;
                playCountdownSound(newNum);
            }
            
            if (state.introTimer >= INTRO_TIMING.COUNTDOWN_DURATION * 3) {
                state.introPhase = 'fight';
                state.introTimer = 0;
                playFightSound();
                state.screenShake = 15;
            }
            break;
            
        case 'fight':
            // FIGHT! pop-in and hold
            const fightProgress = Math.min(1, state.introTimer / 8);
            // Elastic ease out
            const elastic = 1 - Math.pow(2, -10 * fightProgress) * Math.cos(fightProgress * Math.PI * 2);
            d.fightScale = elastic * 1.2;
            
            if (state.introTimer >= INTRO_TIMING.FIGHT_DURATION) {
                state.introActive = false;
                state.introPhase = 'none';
            }
            break;
    }
}

function drawIntro(ctx) {
    if (!state.introActive) return;
    
    const d = state.introData;
    const centerX = CONFIG.WIDTH / 2;
    const centerY = CONFIG.HEIGHT / 2;
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Semi-transparent overlay with vignette
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    
    switch (state.introPhase) {
        case 'round':
            // ROUND X sliding in with motion blur effect
            ctx.font = 'bold 64px "Press Start 2P", monospace';
            
            // Motion blur trail (multiple faded copies behind)
            for (let i = 3; i > 0; i--) {
                ctx.globalAlpha = 0.15;
                ctx.fillStyle = '#4af';
                ctx.fillText(`ROUND ${state.round}`, d.roundSlideX - i * 30, centerY - 30);
            }
            ctx.globalAlpha = 1;
            
            // Main text with glow
            ctx.shadowColor = '#4af';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#fff';
            ctx.fillText(`ROUND ${state.round}`, d.roundSlideX, centerY - 30);
            
            // Sharp overlay
            ctx.shadowBlur = 0;
            ctx.shadowColor = '#000';
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            ctx.fillText(`ROUND ${state.round}`, d.roundSlideX, centerY - 30);
            break;
            
        case 'ready':
            // ROUND X (static with subtle pulse)
            const roundPulse = 1 + Math.sin(state.introTimer * 0.1) * 0.02;
            ctx.font = `bold ${Math.floor(64 * roundPulse)}px "Press Start 2P", monospace`;
            ctx.shadowColor = '#4af';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#fff';
            ctx.fillText(`ROUND ${state.round}`, centerX, centerY - 30);
            ctx.shadowBlur = 0;
            ctx.shadowColor = '#000';
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            ctx.fillText(`ROUND ${state.round}`, centerX, centerY - 30);
            
            // READY typing out with golden glow
            const readyText = 'READY'.substring(0, d.readyLetters);
            ctx.font = 'bold 40px "Press Start 2P", monospace';
            
            // Outer glow
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(readyText, centerX, centerY + 45);
            
            // Inner bright
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.fillText(readyText, centerX, centerY + 45);
            break;
            
        case 'countdown':
            // Big countdown number with intense scaling and glow
            const countdownProgress = (state.introTimer % INTRO_TIMING.COUNTDOWN_DURATION) / INTRO_TIMING.COUNTDOWN_DURATION;
            const countdownScale = 1.3 - countdownProgress * 0.3 + Math.sin(countdownProgress * Math.PI) * 0.15;
            const countdownAlpha = 1 - countdownProgress * 0.3;
            
            ctx.globalAlpha = countdownAlpha;
            ctx.font = `bold ${Math.floor(140 * countdownScale)}px "Press Start 2P", monospace`;
            
            // Color based on number
            const numColor = d.countdownNum === 1 ? '#f44' : (d.countdownNum === 2 ? '#fa0' : '#fff');
            const glowColor = d.countdownNum === 1 ? '#f00' : (d.countdownNum === 2 ? '#f80' : '#4af');
            
            // Outer glow ring
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 40;
            ctx.fillStyle = numColor;
            ctx.fillText(d.countdownNum.toString(), centerX, centerY);
            
            // Sharp center
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.floor(130 * countdownScale)}px "Press Start 2P", monospace`;
            ctx.fillText(d.countdownNum.toString(), centerX, centerY);
            ctx.globalAlpha = 1;
            break;
            
        case 'fight':
            // FIGHT! epic pop-in with multiple layers
            const scale = d.fightScale;
            const fightPulse = 1 + Math.sin(state.introTimer * 0.3) * 0.03;
            const finalScale = scale * fightPulse;
            
            // Background burst lines (radial)
            ctx.save();
            ctx.translate(centerX, centerY);
            for (let i = 0; i < 12; i++) {
                ctx.rotate(Math.PI / 6);
                ctx.fillStyle = `rgba(255, 68, 68, ${0.3 * scale})`;
                ctx.fillRect(-3, -CONFIG.HEIGHT, 6, CONFIG.HEIGHT * scale);
            }
            ctx.restore();
            
            // Outer red glow
            ctx.font = `bold ${Math.floor(85 * finalScale)}px "Press Start 2P", monospace`;
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 50 * scale;
            ctx.fillStyle = '#f44';
            ctx.fillText('FIGHT!', centerX, centerY);
            
            // Middle layer
            ctx.shadowBlur = 20 * scale;
            ctx.fillStyle = '#f88';
            ctx.font = `bold ${Math.floor(82 * finalScale)}px "Press Start 2P", monospace`;
            ctx.fillText('FIGHT!', centerX, centerY);
            
            // White hot center
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.floor(78 * finalScale)}px "Press Start 2P", monospace`;
            ctx.fillText('FIGHT!', centerX, centerY);
            break;
    }
    
    ctx.restore();
}

// Check if intro is blocking gameplay
function isIntroBlocking() {
    return state.introActive && state.introPhase !== 'fight';
}

// =============================================================================
// MATCH OUTRO SYSTEM (Game Over / Victory)
// =============================================================================

const OUTRO_TIMING = {
    LETTER_SLAM_DELAY: 8,       // Frames between each letter slam
    FADE_DURATION: 40,          // Frames to fade to black
    MESSAGE_LETTER_DELAY: 3,    // Frames between message letters
    MESSAGE_HOLD: 60,           // Hold after message complete
    PROMPT_DELAY: 30,           // Delay before showing prompt
    VICTORY_SLAM_DURATION: 15,  // Victory text slam-in
    ECHO_INTERVAL: 8,           // Frames between victory echoes
    ECHO_COUNT: 5,              // Number of echo rings
};

const OUTRO_MESSAGES = {
    gameover: 'A GOD CAN NEVER TRULY DIE...',
    victory: 'ONWARD TO THE NEXT BATTLE',
};

const OUTRO_PROMPTS = {
    gameover: 'Rise Again?',
    victory: 'Continue',
};

function startOutro(type) {
    state.outroActive = true;
    state.outroType = type;
    state.outroPhase = type === 'gameover' ? 'letters' : 'slam';
    state.outroTimer = 0;
    state.outroData = {
        lettersSlammed: 0,
        fadeAlpha: 0,
        messageLetters: 0,
        promptVisible: false,
        promptBlink: 0,
        victoryScale: 0,
        echoScales: [],
    };
    
    if (type === 'gameover') {
        playGameOverSound();
    } else {
        playVictorySound();
    }
}

function updateOutro() {
    if (!state.outroActive) return;
    
    state.outroTimer++;
    const d = state.outroData;
    const type = state.outroType;
    
    // Handle X key press to restart
    if (d.promptVisible && (keysJustPressed['KeyX'] || keysJustPressed['KeyK'])) {
        playConfirmSound();
        state.outroActive = false;
        state.outroPhase = 'none';
        state.round++;
        resetMatch();
        return;
    }
    
    if (type === 'gameover') {
        updateGameOverOutro();
    } else {
        updateVictoryOutro();
    }
    
    // Blink prompt
    if (d.promptVisible) {
        d.promptBlink++;
    }
}

function updateGameOverOutro() {
    const d = state.outroData;
    const title = 'GAME OVER';
    const message = OUTRO_MESSAGES.gameover;
    
    switch (state.outroPhase) {
        case 'letters':
            // Slam letters one by one
            const letterIndex = Math.floor(state.outroTimer / OUTRO_TIMING.LETTER_SLAM_DELAY);
            if (letterIndex > d.lettersSlammed && letterIndex <= title.length) {
                d.lettersSlammed = letterIndex;
                if (title[letterIndex - 1] !== ' ') {
                    playLetterSlamSound();
                    state.screenShake = 3;
                }
            }
            
            // Start fading
            d.fadeAlpha = Math.min(0.7, state.outroTimer / 60 * 0.7);
            
            if (state.outroTimer >= title.length * OUTRO_TIMING.LETTER_SLAM_DELAY + 30) {
                state.outroPhase = 'message';
                state.outroTimer = 0;
            }
            break;
            
        case 'message':
            // Type out message
            const msgIndex = Math.floor(state.outroTimer / OUTRO_TIMING.MESSAGE_LETTER_DELAY);
            if (msgIndex > d.messageLetters && msgIndex <= message.length) {
                d.messageLetters = msgIndex;
                if (message[msgIndex - 1] !== ' ' && message[msgIndex - 1] !== '.') {
                    playTypeSound();
                }
            }
            
            if (state.outroTimer >= message.length * OUTRO_TIMING.MESSAGE_LETTER_DELAY + OUTRO_TIMING.MESSAGE_HOLD) {
                state.outroPhase = 'prompt';
                state.outroTimer = 0;
            }
            break;
            
        case 'prompt':
            if (state.outroTimer >= OUTRO_TIMING.PROMPT_DELAY && !d.promptVisible) {
                d.promptVisible = true;
                playPromptSound();
            }
            break;
    }
}

function updateVictoryOutro() {
    const d = state.outroData;
    const message = OUTRO_MESSAGES.victory;
    
    switch (state.outroPhase) {
        case 'slam':
            // Victory slams in with elastic
            const slamProgress = Math.min(1, state.outroTimer / OUTRO_TIMING.VICTORY_SLAM_DURATION);
            const elastic = 1 - Math.pow(2, -10 * slamProgress) * Math.cos(slamProgress * Math.PI * 3);
            d.victoryScale = elastic;
            
            if (state.outroTimer === 1) {
                state.screenShake = 5;
            }
            
            // Spawn echo rings
            if (state.outroTimer % OUTRO_TIMING.ECHO_INTERVAL === 0 && d.echoScales.length < OUTRO_TIMING.ECHO_COUNT) {
                d.echoScales.push(1);
            }
            
            // Expand echoes
            for (let i = 0; i < d.echoScales.length; i++) {
                d.echoScales[i] += 0.08;
            }
            
            // Fade background
            d.fadeAlpha = Math.min(0.5, state.outroTimer / 60 * 0.5);
            
            if (state.outroTimer >= OUTRO_TIMING.VICTORY_SLAM_DURATION + 50) {
                state.outroPhase = 'message';
                state.outroTimer = 0;
            }
            break;
            
        case 'message':
            // Continue expanding echoes
            for (let i = 0; i < d.echoScales.length; i++) {
                d.echoScales[i] += 0.02;
            }
            
            // Type out message
            const msgIndex = Math.floor(state.outroTimer / OUTRO_TIMING.MESSAGE_LETTER_DELAY);
            if (msgIndex > d.messageLetters && msgIndex <= message.length) {
                d.messageLetters = msgIndex;
                if (message[msgIndex - 1] !== ' ') {
                    playTypeSound();
                }
            }
            
            if (state.outroTimer >= message.length * OUTRO_TIMING.MESSAGE_LETTER_DELAY + OUTRO_TIMING.MESSAGE_HOLD) {
                state.outroPhase = 'prompt';
                state.outroTimer = 0;
            }
            break;
            
        case 'prompt':
            // Keep echoes expanding slowly
            for (let i = 0; i < d.echoScales.length; i++) {
                d.echoScales[i] += 0.01;
            }
            
            if (state.outroTimer >= OUTRO_TIMING.PROMPT_DELAY && !d.promptVisible) {
                d.promptVisible = true;
                playPromptSound();
            }
            break;
    }
}

function drawOutro(ctx) {
    if (!state.outroActive) return;
    
    const d = state.outroData;
    const centerX = CONFIG.WIDTH / 2;
    const centerY = CONFIG.HEIGHT / 2;
    
    ctx.save();
    
    // Fade overlay
    ctx.fillStyle = `rgba(0, 0, 0, ${d.fadeAlpha})`;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (state.outroType === 'gameover') {
        drawGameOverOutro(ctx, centerX, centerY);
    } else {
        drawVictoryOutro(ctx, centerX, centerY);
    }
    
    ctx.restore();
}

function drawGameOverOutro(ctx, centerX, centerY) {
    const d = state.outroData;
    const title = 'GAME OVER';
    const message = OUTRO_MESSAGES.gameover;
    const prompt = OUTRO_PROMPTS.gameover;
    
    // Draw GAME OVER letters with impact effects
    const letterWidth = 48;
    const startX = centerX - (title.length * letterWidth) / 2 + letterWidth / 2;
    
    for (let i = 0; i < d.lettersSlammed; i++) {
        const char = title[i];
        const x = startX + i * letterWidth;
        
        // Letters slam from above with bounce
        const timeSinceSlam = state.outroTimer - i * OUTRO_TIMING.LETTER_SLAM_DELAY;
        const slamProgress = Math.min(1, timeSinceSlam / 8);
        const bounce = slamProgress >= 1 ? Math.sin(Math.min(timeSinceSlam - 8, 20) * 0.3) * Math.max(0, 1 - (timeSinceSlam - 8) / 20) * 5 : 0;
        const y = centerY - 60 + (slamProgress < 1 ? (1 - Math.pow(slamProgress, 0.5)) * -150 : bounce);
        const scale = slamProgress < 1 ? 0.3 + slamProgress * 0.7 : 1;
        const rotation = slamProgress < 1 ? (1 - slamProgress) * 0.2 * (i % 2 === 0 ? 1 : -1) : 0;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        
        // Red glow
        ctx.font = 'bold 56px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#c00';
        ctx.fillText(char, 0, 0);
        
        // White core on impact
        if (slamProgress >= 1) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = Math.max(0, 1 - timeSinceSlam / 30);
            ctx.fillText(char, 0, 0);
            ctx.globalAlpha = 1;
        }
        
        ctx.restore();
    }
    
    // Draw message with typewriter glow
    if (state.outroPhase === 'message' || state.outroPhase === 'prompt') {
        const visibleMessage = message.substring(0, d.messageLetters);
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#666';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#aaa';
        ctx.fillText(visibleMessage, centerX, centerY + 25);
    }
    
    // Draw prompt with pulsing glow
    if (d.promptVisible) {
        const blink = Math.floor(d.promptBlink / 20) % 2 === 0;
        const pulse = 1 + Math.sin(d.promptBlink * 0.1) * 0.05;
        
        if (blink) {
            ctx.font = `bold ${Math.floor(26 * pulse)}px "Press Start 2P", monospace`;
            ctx.textAlign = 'center';
            ctx.shadowColor = '#4af';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#fff';
            ctx.fillText(prompt, centerX, centerY + 85);
            
            ctx.font = '14px "Press Start 2P", monospace';
            ctx.shadowColor = '#fa0';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#fbbf24';
            ctx.fillText('[ Press X ]', centerX, centerY + 118);
        }
    }
}

function drawVictoryOutro(ctx, centerX, centerY) {
    const d = state.outroData;
    const message = OUTRO_MESSAGES.victory;
    const prompt = OUTRO_PROMPTS.victory;
    
    // Background starburst
    if (d.victoryScale > 0.5) {
        ctx.save();
        ctx.translate(centerX, centerY - 40);
        const burstAlpha = Math.min(1, (d.victoryScale - 0.5) * 2) * 0.3;
        for (let i = 0; i < 16; i++) {
            ctx.rotate(Math.PI / 8);
            ctx.fillStyle = `rgba(251, 191, 36, ${burstAlpha})`;
            ctx.fillRect(-2, -CONFIG.HEIGHT * 0.4, 4, CONFIG.HEIGHT * 0.4);
        }
        ctx.restore();
    }
    
    // Draw echo rings with golden glow
    for (let i = 0; i < d.echoScales.length; i++) {
        const scale = d.echoScales[i];
        const alpha = Math.max(0, 1 - (scale - 1) / 2.5);
        
        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        ctx.font = `bold ${Math.floor(68 * scale)}px "Press Start 2P", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.strokeText('VICTORY', centerX, centerY - 40);
        ctx.restore();
    }
    
    // Draw main VICTORY text with layered glow
    if (d.victoryScale > 0) {
        const pulse = 1 + Math.sin(state.outroTimer * 0.15) * 0.03;
        const finalScale = d.victoryScale * pulse;
        
        ctx.font = `bold ${Math.floor(68 * finalScale)}px "Press Start 2P", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Outer golden glow
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('VICTORY', centerX, centerY - 40);
        
        // Middle layer
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffe066';
        ctx.font = `bold ${Math.floor(66 * finalScale)}px "Press Start 2P", monospace`;
        ctx.fillText('VICTORY', centerX, centerY - 40);
        
        // White hot center
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(62 * finalScale)}px "Press Start 2P", monospace`;
        ctx.fillText('VICTORY', centerX, centerY - 40);
    }
    
    // Draw message with glow
    if (state.outroPhase === 'message' || state.outroPhase === 'prompt') {
        const visibleMessage = message.substring(0, d.messageLetters);
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#fff';
        ctx.fillText(visibleMessage, centerX, centerY + 35);
    }
    
    // Draw prompt with pulsing glow
    if (d.promptVisible) {
        const blink = Math.floor(d.promptBlink / 20) % 2 === 0;
        const pulse = 1 + Math.sin(d.promptBlink * 0.1) * 0.05;
        
        if (blink) {
            ctx.font = `bold ${Math.floor(26 * pulse)}px "Press Start 2P", monospace`;
            ctx.textAlign = 'center';
            ctx.shadowColor = '#4af';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#fff';
            ctx.fillText(prompt, centerX, centerY + 95);
            
            ctx.font = '14px "Press Start 2P", monospace';
            ctx.shadowColor = '#fa0';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#fbbf24';
            ctx.fillText('[ Press X ]', centerX, centerY + 128);
        }
    }
}

// =============================================================================
// UI
// =============================================================================

function createPips(count, maxCount, cssClass) {
    let html = '';
    for (let i = 0; i < maxCount; i++) {
        const filled = i < count;
        html += `<div class="pip ${cssClass} ${filled ? '' : 'empty'}"></div>`;
    }
    return html;
}

function updateUI() {
    // Show player health pips
    const player = state.players[0];
    const playerPips = document.getElementById('p1-pips');
    if (playerPips && player) {
        playerPips.innerHTML = createPips(player.lives, CONFIG.LIVES_PER_CHARACTER, 'player');
    }
    
    // Show individual enemy health bars
    const enemyContainer = document.getElementById('enemy-health-container');
    if (enemyContainer) {
        enemyContainer.innerHTML = '';
        const enemies = state.players.slice(1);
        enemies.forEach((enemy, idx) => {
            const row = document.createElement('div');
            row.className = 'health-row';
            row.innerHTML = `
                <span class="char-label enemy">ENEMY ${idx + 1}</span>
                <span class="health-pips">${createPips(enemy.lives, CONFIG.LIVES_PER_CHARACTER, 'enemy')}</span>
            `;
            enemyContainer.appendChild(row);
        });
    }
    
    document.getElementById('round-info').textContent = `ROUND ${state.round}`;
    
    // Bullet UI (only if gun enabled)
    if (CONFIG.GUN_ENABLED) {
        const p1 = state.players[0];
        const p2 = state.players[1];
        const p1Bullets = document.getElementById('p1-bullets');
        const p2Bullets = document.getElementById('p2-bullets');
        if (p1Bullets) p1Bullets.textContent = '●'.repeat(p1?.bullets || 0) + '○'.repeat(CONFIG.BULLET_COUNT - (p1?.bullets || 0));
        if (p2Bullets) p2Bullets.textContent = '●'.repeat(p2?.bullets || 0) + '○'.repeat(CONFIG.BULLET_COUNT - (p2?.bullets || 0));
    }
}

function showMessage(text, duration = 120) {
    state.message = text;
    state.messageTimer = duration;
    document.getElementById('message').textContent = text;
    document.getElementById('message').classList.remove('hidden');
}

function hideMessage() {
    document.getElementById('message').classList.add('hidden');
}

function checkGameOver() {
    // Prevent multiple triggers
    if (state.gameOverPending || state.outroActive || state.finalHitActive) return;
    
    // Check if player is out of lives
    const player = state.players[0];
    if (player.lives <= 0) {
        state.gameOverPending = true;
        startFinalHit('gameover');
        return;
    }
    
    // Check if all enemies are out of lives
    const aliveEnemies = state.players.slice(1).filter(p => p.lives > 0);
    if (aliveEnemies.length === 0) {
        state.gameOverPending = true;
        startFinalHit('victory');
    }
}

// Start final hit sequence - spawns extra blood and lets effects resolve before outro
function startFinalHit(type) {
    state.finalHitActive = true;
    state.finalHitTimer = 150; // ~2.5 seconds to let effects resolve
    state.finalHitType = type;
    
    // Slow motion for dramatic effect
    state.timeScale = 0.3;
    
    // Spawn extra blood balls at the death location
    // Find the player/enemy that just died
    for (const p of state.players) {
        if (!p.alive) {
            const x = p.x + p.w / 2;
            const y = p.y + p.h / 2;
            
            // Spawn blood balls in 8 directions (including diagonals and up)
            const angles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, -3*Math.PI/4, -Math.PI/2, -Math.PI/4];
            for (const angle of angles) {
                spawnBloodBalls(x, y, Math.cos(angle), Math.sin(angle));
            }
            
            // Spawn special large blood ball that pops up
            spawnLargeBloodBall(x, y);
            
            break;
        }
    }
}

// Special large blood ball for final hit
function spawnLargeBloodBall(x, y) {
    state.bloodBalls.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: -12 - Math.random() * 4, // Strong upward pop
        size: 18 + Math.random() * 8, // Much larger
        life: 180,
        dripTimer: 0,
        dripInterval: 2, // Drip more frequently
        isLarge: true,
    });
}

function resetMatch() {
    // Clear game over and final hit flags
    state.gameOverPending = false;
    state.finalHitActive = false;
    state.finalHitTimer = 0;
    state.screenShake = 0;
    state.timeScale = 1.0;
    
    // Select random level
    createStage();
    
    // Reset all lives and respawn everyone
    for (const p of state.players) {
        p.lives = CONFIG.LIVES_PER_CHARACTER;
        p.alive = true;
        p.x = p.spawnX;
        p.y = p.spawnY;
        p.vx = 0;
        p.vy = 0;
    }
    state.bullets = [];
    state.particles = [];
    state.slashEffects = [];
    state.bloodBalls = [];
    state.dashEchoes = [];
    state.spawnTelegraphs = [];
    updateUI();
    hideMessage();
    startMatchIntro();
}

// =============================================================================
// MAIN LOOP
// =============================================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.WIDTH;
canvas.height = CONFIG.HEIGHT;

function init() {
    // Load sprite assets
    loadAssets();
    
    // Setup audio controls
    setupAudioControls();
    
    // Setup debug panel
    setupDebugPanel();
    
    // Create first stage (random)
    createStage();
    
    // Create player
    state.players = [
        new Player(120, CONFIG.HEIGHT - 120, false, COLORS.player1),
    ];
    
    // Spawn multiple enemies at different positions with different sprites
    const enemySpawns = [
        { x: CONFIG.WIDTH - 160, y: CONFIG.HEIGHT - 120 },
        { x: CONFIG.WIDTH / 2, y: CONFIG.HEIGHT - 260 },
        { x: 160, y: CONFIG.HEIGHT - 340 },
    ];
    
    for (let i = 0; i < CONFIG.ENEMY_COUNT; i++) {
        const spawn = enemySpawns[i % enemySpawns.length];
        state.players.push(new Player(spawn.x, spawn.y, true, COLORS.player2, i));
    }
    
    updateUI();
    // Game starts on title screen - match intro starts when player presses X
}

function update() {
    // Title screen
    if (state.titleScreen) {
        updateTitleScreen();
        clearJustPressed();
        return;
    }
    
    // Update match intro
    if (state.introActive) {
        updateIntro();
    }
    
    // Update match outro
    if (state.outroActive) {
        updateOutro();
        // Still decay screen shake during outro
        if (state.screenShake > 0) {
            state.screenShake *= 0.85;
            if (state.screenShake < 0.3) state.screenShake = 0;
        }
        clearJustPressed();
        return; // Skip normal updates during outro
    }
    
    // Final hit state - let effects resolve before outro
    if (state.finalHitActive) {
        state.finalHitTimer--;
        
        // Gradually restore time scale
        if (state.finalHitTimer < 60) {
            state.timeScale = Math.min(1.0, state.timeScale + 0.02);
        }
        
        // Update effects so they can resolve
        updateParticles();
        updateBloodBalls();
        updateDashEchoes();
        
        // Decay screen shake
        if (state.screenShake > 0) {
            state.screenShake *= 0.85;
            if (state.screenShake < 0.3) state.screenShake = 0;
        }
        
        // When timer expires, start the outro
        if (state.finalHitTimer <= 0) {
            state.finalHitActive = false;
            state.timeScale = 1.0; // Ensure time scale is restored
            startOutro(state.finalHitType);
        }
        
        clearJustPressed();
        return;
    }
    
    if (state.messageTimer > 0) {
        state.messageTimer--;
        if (state.messageTimer <= 0) hideMessage();
    }
    
    // Hit stop - freeze characters but keep particles going
    if (state.hitStopTimer > 0) {
        state.hitStopTimer--;
        
        // Only update particles and effects during hit stop (dramatic freeze)
        updateParticles();
        updateSlashEffects();
        
        // When hit stop ends, apply pending deaths or clash knockbacks
        if (state.hitStopTimer <= 0) {
            // Handle clash knockbacks
            if (state.isClashHitStop) {
                for (const p of state.players) {
                    if (p.pendingClash) {
                        p.vx = p.pendingClashKnockbackX;
                        p.vy = p.pendingClashKnockbackY;
                        p.pendingClash = false;
                        p.pendingClashKnockbackX = 0;
                        p.pendingClashKnockbackY = 0;
                    }
                }
                state.isClashHitStop = false;
            }
            
            // Handle deaths
            for (const p of state.players) {
                if (p.pendingDeath) {
                    // Apply knockback then die
                    p.vx = p.pendingKnockbackX;
                    p.vy = p.pendingKnockbackY;
                    p.pendingDeath = false;
                    p.killer = null;
                    p.die(); // die() handles lives, UI, and game over check
                }
            }
        }
        
        clearJustPressed();
        return; // Skip normal updates during hit stop
    }
    
    // Update players
    for (const p of state.players) p.update();
    
    // Update bullets and effects
    updateBullets();
    updateParticles();
    updateSlashEffects();
    updateSpawnTelegraphs();
    updateBloodBalls();
    updateDashEchoes();
    
    // Screen shake decay (fast decay, hard cutoff for clean stop)
    if (state.screenShake > 0) {
        state.screenShake *= 0.85;
        if (state.screenShake < 0.3) state.screenShake = 0;
    }
    
    clearJustPressed();
}

function draw() {
    ctx.save();
    
    // Title screen
    if (state.titleScreen) {
        drawTitleScreen(ctx);
        ctx.restore();
        return;
    }
    
    // Screen shake
    if (state.screenShake > 0.5) {
        ctx.translate(
            (Math.random() - 0.5) * state.screenShake,
            (Math.random() - 0.5) * state.screenShake
        );
    }
    
    // Draw background video for current level
    const video = ASSETS.bgVideos[ASSETS.activeBgIndex];
    if (video && video.readyState >= 2) {
        // Keep video playing
        if (video.paused) video.play().catch(() => {});
        ctx.drawImage(video, 0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        // Darken slightly for contrast
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    } else {
        // Fallback solid color while loading
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }
    
    // Draw platforms with wood texture or fallback
    for (const p of state.platforms) {
        if (ASSETS.loaded && ASSETS.tiles && ASSETS.tiles.complete) {
            // Tile the wood texture across platform
            const pattern = ctx.createPattern(ASSETS.tiles, 'repeat');
            ctx.fillStyle = pattern;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            // Dark edge for depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(p.x, p.y + p.h - 2, p.w, 2);
            // Top highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(p.x, p.y, p.w, 2);
        } else {
            // Fallback solid platform
            ctx.fillStyle = COLORS.platform;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.fillStyle = COLORS.platformLight;
            ctx.fillRect(p.x, p.y, p.w, 2);
        }
    }
    
    // Draw effects
    drawSpawnTelegraphs(ctx);
    drawSlashEffects(ctx);
    drawBullets(ctx);
    drawBloodBalls(ctx);
    drawParticles(ctx);
    
    // Draw dash echoes (behind players)
    drawDashEchoes(ctx);
    
    // Draw players
    for (const p of state.players) p.draw(ctx);
    
    // Draw match intro overlay
    drawIntro(ctx);
    
    // Draw match outro overlay
    drawOutro(ctx);
    
    // Debug overlay
    drawDebug(ctx);
    
    ctx.restore();
}

let frameAccumulator = 0;

function gameLoop() {
    // Accumulate based on time scale
    frameAccumulator += state.timeScale;
    
    // Run updates for accumulated frames
    while (frameAccumulator >= 1) {
        update();
        frameAccumulator -= 1;
    }
    
    // Always draw
    draw();
    
    // Show time scale on screen if not 100%
    if (state.timeScale !== 1.0) {
        ctx.save();
        ctx.fillStyle = '#ff0';
        ctx.font = '16px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(state.timeScale * 100)}%`, CONFIG.WIDTH / 2, 30);
        ctx.restore();
    }
    
    requestAnimationFrame(gameLoop);
}

init();
gameLoop();
