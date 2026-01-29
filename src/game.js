/**
 * GOD SLASH - Samurai Gunn-style arena fighter
 * Single player vs AI
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    // Canvas (internal resolution - pixel art scale) - DOUBLED for new sprites
    WIDTH: 768,
    HEIGHT: 432,
    
    // Physics (doubled for new scale)
    GRAVITY: 0.76,
    FRICTION: 0.85,
    
    // Player (doubled for new scale)
    PLAYER_SPEED: 4.4,
    PLAYER_JUMP: -16,
    PLAYER_WALL_SLIDE: 3,
    PLAYER_WALL_JUMP_X: 10,
    PLAYER_WALL_JUMP_Y: -14,
    PLAYER_DASH_SPEED: 24,
    PLAYER_DASH_DURATION: 8,
    PLAYER_DASH_COOLDOWN: 30,
    PLAYER_FAST_FALL: 16,
    
    // Combat (doubled for new scale)
    SLASH_WIDTH: 60,  // Slash hitbox width (longer dimension)
    SLASH_HEIGHT: 24, // Slash hitbox height (shorter dimension)
    SWORD_DURATION: 8,
    SWORD_COOLDOWN: 15,
    SURFACE_DEFLECT_SPEED: 16, // Knockback from slashing surfaces
    HIT_STUN_DURATION: 20,
    HIT_STUN_KNOCKBACK: 16,
    CLASH_KNOCKBACK: 20,
    
    // Gun (DISABLED for now)
    GUN_ENABLED: false,
    BULLET_SPEED: 10,
    BULLET_COUNT: 3,
    GUN_COOLDOWN: 20,
    
    // AI
    AI_REACTION_TIME: 15,
    AI_AGGRESSION: 0.5,
    AI_WANDER_CHANCE: 0.3,
    AI_IDLE_TIME: 60,
    
    // Game
    LIVES_PER_CHARACTER: 5,
    RESPAWN_TIME: 60,
    
    // Physics
    BOP_BOUNCE_UP: -10,      // Bounce up when landing on enemy
    BOP_PUSH_DOWN: 6,        // Push down the character below
    GROUND_SLASH_BOUNCE: -8, // Upward bounce from slashing ground
    WALL_SLASH_DELAY: 3,     // Frames before movement can counter wall bounce (0.05s at 60fps)
    
    // Hit Stop
    HIT_STOP_DURATION: 18, // ~0.3 seconds at 60fps
    CLASH_HIT_STOP_DURATION: 9, // ~0.15 seconds at 60fps
    
    // Multi-enemy
    ENEMY_COUNT: 3,
};

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
    bgVideo: null,
    tiles: null,
    player: null,
    enemies: [],
};

function loadAssets() {
    let loadCount = 0;
    const totalAssets = 5; // video, tiles, player, 3 enemies
    
    function onLoad() {
        loadCount++;
        if (loadCount >= totalAssets) {
            ASSETS.loaded = true;
            console.log('All assets loaded!');
        }
    }
    
    // Background video - autoplay, loop, muted
    ASSETS.bgVideo = document.createElement('video');
    ASSETS.bgVideo.src = 'assets/bg-video.mp4';
    ASSETS.bgVideo.loop = true;
    ASSETS.bgVideo.muted = true;
    ASSETS.bgVideo.playsInline = true;
    ASSETS.bgVideo.preload = 'auto';
    ASSETS.bgVideo.oncanplaythrough = () => {
        ASSETS.bgVideo.play().catch(() => {});
        onLoad();
    };
    ASSETS.bgVideo.onerror = onLoad;
    
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

// =============================================================================
// SOUND SYSTEM
// =============================================================================

const AUDIO = {
    ctx: null,
    initialized: false,
    music: null,
    musicGain: null,
    muted: false,
    volume: 0.5,
};

function initAudio() {
    if (AUDIO.initialized) return;
    AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)();
    AUDIO.initialized = true;
    
    // Start background music
    startBackgroundMusic();
}

function startBackgroundMusic() {
    if (AUDIO.music) return; // Already playing
    
    AUDIO.music = new Audio('assets/music-bg.mp3');
    AUDIO.music.loop = true;
    AUDIO.music.volume = AUDIO.muted ? 0 : AUDIO.volume;
    
    // Play (may be blocked by autoplay policy, but we init on keypress so should be fine)
    AUDIO.music.play().catch(e => {
        console.log('Music autoplay blocked, will start on interaction');
    });
}

function setMusicVolume(vol) {
    AUDIO.volume = Math.max(0, Math.min(1, vol));
    if (AUDIO.music && !AUDIO.muted) {
        AUDIO.music.volume = AUDIO.volume;
    }
    // Update slider
    document.getElementById('volume-slider').value = AUDIO.volume * 100;
}

function toggleMute() {
    AUDIO.muted = !AUDIO.muted;
    if (AUDIO.music) {
        AUDIO.music.volume = AUDIO.muted ? 0 : AUDIO.volume;
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

// =============================================================================
// PIXEL ART DRAWING FUNCTIONS
// =============================================================================

// Draw blue samurai (player)
function drawSamurai(ctx, x, y, w, h, facing, frame, stunned) {
    ctx.save();
    
    const centerX = x + w / 2;
    
    // Flip if facing left
    if (facing === -1) {
        ctx.translate(centerX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-centerX, 0);
    }
    
    // Colors
    const blue = stunned ? '#fff' : '#2563eb';
    const darkBlue = stunned ? '#ccc' : '#1d4ed8';
    const skin = stunned ? '#fcc' : '#fcd5b8';
    const white = '#fff';
    
    // Animation offsets
    let legOffset = 0;
    let armOffset = 0;
    let bodyBob = 0;
    
    if (frame === 'run') {
        legOffset = Math.sin(Date.now() * 0.02) * 3;
        bodyBob = Math.abs(Math.sin(Date.now() * 0.02)) * 1;
    } else if (frame === 'jump') {
        legOffset = 2;
    }
    
    const bx = Math.floor(x);
    const by = Math.floor(y - bodyBob);
    
    // Helmet (kabuto)
    ctx.fillStyle = darkBlue;
    ctx.fillRect(bx + 2, by, w - 4, 6);
    ctx.fillRect(bx + 4, by - 2, w - 8, 3); // Helmet crest
    
    // Face
    ctx.fillStyle = skin;
    ctx.fillRect(bx + 4, by + 6, w - 8, 5);
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(bx + 6, by + 7, 2, 2);
    
    // Body armor
    ctx.fillStyle = blue;
    ctx.fillRect(bx + 3, by + 11, w - 6, 8);
    ctx.fillStyle = darkBlue;
    ctx.fillRect(bx + 3, by + 11, w - 6, 2); // Shoulder
    
    // Legs
    ctx.fillStyle = darkBlue;
    ctx.fillRect(bx + 4, by + 19, 4, 6 + legOffset);
    ctx.fillRect(bx + w - 8, by + 19, 4, 6 - legOffset);
    
    // Sword on back (when not slashing)
    if (frame !== 'slash') {
        ctx.fillStyle = '#888';
        ctx.fillRect(bx + w - 4, by + 8, 2, 12);
        ctx.fillStyle = '#654321';
        ctx.fillRect(bx + w - 4, by + 8, 2, 3);
    }
    
    ctx.restore();
}

// Draw red oni demon (enemy)
function drawOni(ctx, x, y, w, h, facing, frame, stunned) {
    ctx.save();
    
    const centerX = x + w / 2;
    
    if (facing === -1) {
        ctx.translate(centerX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-centerX, 0);
    }
    
    // Colors
    const red = stunned ? '#fff' : '#dc2626';
    const darkRed = stunned ? '#ccc' : '#991b1b';
    const yellow = stunned ? '#ffc' : '#fbbf24';
    
    let legOffset = 0;
    let bodyBob = 0;
    
    if (frame === 'run') {
        legOffset = Math.sin(Date.now() * 0.02) * 3;
        bodyBob = Math.abs(Math.sin(Date.now() * 0.02)) * 1;
    }
    
    const bx = Math.floor(x);
    const by = Math.floor(y - bodyBob);
    
    // Horns
    ctx.fillStyle = '#888';
    ctx.fillRect(bx + 2, by - 4, 3, 5);
    ctx.fillRect(bx + w - 5, by - 4, 3, 5);
    
    // Head
    ctx.fillStyle = red;
    ctx.fillRect(bx + 3, by, w - 6, 8);
    
    // Eyes (yellow glowing)
    ctx.fillStyle = yellow;
    ctx.fillRect(bx + 5, by + 3, 3, 2);
    ctx.fillRect(bx + w - 8, by + 3, 3, 2);
    
    // Fangs
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx + 6, by + 7, 2, 2);
    ctx.fillRect(bx + w - 8, by + 7, 2, 2);
    
    // Body
    ctx.fillStyle = red;
    ctx.fillRect(bx + 2, by + 10, w - 4, 9);
    ctx.fillStyle = darkRed;
    ctx.fillRect(bx + 4, by + 12, w - 8, 2); // Chest shadow
    
    // Legs
    ctx.fillStyle = darkRed;
    ctx.fillRect(bx + 3, by + 19, 5, 6 + legOffset);
    ctx.fillRect(bx + w - 8, by + 19, 5, 6 - legOffset);
    
    // Tail
    ctx.fillStyle = red;
    ctx.fillRect(bx + w - 2, by + 15, 4, 3);
    ctx.fillRect(bx + w + 1, by + 17, 3, 2);
    
    ctx.restore();
}

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
        console.log('Debug mode:', state.debugMode);
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

function clearJustPressed() {
    for (const k in keysJustPressed) delete keysJustPressed[k];
}

// =============================================================================
// GAME STATE
// =============================================================================

const state = {
    players: [],
    bullets: [],
    particles: [],
    slashEffects: [],
    platforms: [],
    screenShake: 0,
    round: 1,
    paused: false,
    message: '',
    messageTimer: 0,
    hitStopTimer: 0, // Characters freeze but particles continue
    isClashHitStop: false, // Whether hit stop is from clash (vs death)
    debugMode: false, // Show collision boxes
};

// =============================================================================
// STAGE
// =============================================================================

function createStage() {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;
    
    state.platforms = [
        // Ground
        { x: 0, y: H - 32, w: W, h: 32 },
        
        // Left wall
        { x: 0, y: 0, w: 32, h: H - 32 },
        
        // Right wall
        { x: W - 32, y: 0, w: 32, h: H - 32 },
        
        // Floating platforms (doubled)
        { x: 120, y: H - 140, w: 120, h: 16 },
        { x: W - 240, y: H - 140, w: 120, h: 16 },
        { x: W/2 - 80, y: H - 220, w: 160, h: 16 },
        
        // Upper platforms (doubled)
        { x: 60, y: H - 300, w: 100, h: 16 },
        { x: W - 160, y: H - 300, w: 100, h: 16 },
    ];
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
        this.canDoubleJump = true;
        
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
        
        // AI state
        this.aiTarget = null;
        this.aiDecisionTimer = 0;
        this.aiAction = 'idle';
        this.aiWanderDir = 1;
        this.aiIdleTimer = 0;
        this.aiPatrolTarget = null;
    }
    
    update() {
        if (!this.alive) {
            if (this.respawnTimer > 0) {
                this.respawnTimer--;
                if (this.respawnTimer <= 0) this.respawn();
            }
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
            if (this.dashTimer <= 0) this.dashing = false;
        }
    }
    
    handleInput() {
        // Horizontal movement (blocked during movement lock)
        if (this.movementLockTimer <= 0) {
            if (keys['ArrowLeft'] || keys['KeyA']) {
                this.vx = -CONFIG.PLAYER_SPEED;
                this.facing = -1;
            } else if (keys['ArrowRight'] || keys['KeyD']) {
                this.vx = CONFIG.PLAYER_SPEED;
                this.facing = 1;
            }
        }
        
        // Jump (X key)
        if (keysJustPressed['KeyX'] || keysJustPressed['KeyK']) {
            if (this.grounded) {
                this.vy = CONFIG.PLAYER_JUMP;
                this.grounded = false;
                this.canDoubleJump = true;
            } else if (this.wallSliding) {
                // Wall jump
                this.vx = CONFIG.PLAYER_WALL_JUMP_X * -this.wallDir;
                this.vy = CONFIG.PLAYER_WALL_JUMP_Y;
                this.wallSliding = false;
                this.facing = -this.wallDir;
            } else if (this.canDoubleJump) {
                this.vy = CONFIG.PLAYER_JUMP * 0.85;
                this.canDoubleJump = false;
            }
        }
        
        // Fast fall
        if ((keys['ArrowDown'] || keys['KeyS']) && !this.grounded) {
            this.vy = Math.max(this.vy, CONFIG.PLAYER_FAST_FALL);
        }
        
        // Dash
        if ((keysJustPressed['ShiftLeft'] || keysJustPressed['ShiftRight']) && this.dashCooldown <= 0) {
            this.dash();
        }
        
        // Sword slash (Z key) - 4 directional based on arrow keys
        if ((keysJustPressed['KeyZ'] || keysJustPressed['KeyJ']) && this.slashCooldown <= 0) {
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
        // Find nearest alive target (any other player/enemy)
        let target = null;
        let minDist = Infinity;
        
        for (const other of state.players) {
            if (other === this || !other.alive) continue;
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
            this.aiDecisionTimer = CONFIG.AI_REACTION_TIME + Math.random() * 15;
            this.makeAIDecision(target, dist);
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
                // Move in current wander direction
                this.vx = this.aiWanderDir * CONFIG.PLAYER_SPEED * 0.6;
                this.facing = this.aiWanderDir;
                
                // Change direction at walls or randomly
                if (this.x < 60 || this.wallDir === -1) this.aiWanderDir = 1;
                else if (this.x > CONFIG.WIDTH - 60 || this.wallDir === 1) this.aiWanderDir = -1;
                else if (Math.random() < 0.02) this.aiWanderDir *= -1;
                
                // Random jump while wandering
                if (this.grounded && Math.random() < 0.03) {
                    this.vy = CONFIG.PLAYER_JUMP * 0.8;
                }
                break;
                
            case 'chase':
                this.vx = Math.sign(dx) * CONFIG.PLAYER_SPEED;
                this.facing = dx > 0 ? 1 : -1;
                
                // Jump if target is above
                if (dy < -40 && this.grounded) {
                    this.vy = CONFIG.PLAYER_JUMP;
                }
                // Jump gaps
                if (this.grounded && Math.random() < 0.05) {
                    this.vy = CONFIG.PLAYER_JUMP * 0.9;
                }
                break;
                
            case 'attack':
                this.facing = dx > 0 ? 1 : -1;
                if (dist < CONFIG.SLASH_WIDTH * 1.5 && this.slashCooldown <= 0) {
                    // AI picks slash direction toward target using all 4 directions
                    const absDx = Math.abs(dx);
                    const absDy = Math.abs(dy);
                    
                    if (absDy > absDx * 1.2 && dy < 0) {
                        // Target is above
                        this.slashDir = { x: 0, y: -1 };
                    } else if (absDy > absDx * 1.2 && dy > 0) {
                        // Target is below
                        this.slashDir = { x: 0, y: 1 };
                    } else {
                        // Target is horizontal
                        this.slashDir = { x: dx > 0 ? 1 : -1, y: 0 };
                    }
                    this.slash();
                    this.aiAction = 'retreat';
                    this.aiDecisionTimer = 20;
                } else if (dist < CONFIG.SLASH_WIDTH * 2.5) {
                    // Close in for attack
                    this.vx = Math.sign(dx) * CONFIG.PLAYER_SPEED;
                    // Random whiff while approaching
                    if (Math.random() < 0.03 && this.slashCooldown <= 0) {
                        this.aiRandomSlash();
                    }
                }
                break;
                
            case 'retreat':
                this.vx = -Math.sign(dx) * CONFIG.PLAYER_SPEED;
                this.facing = dx > 0 ? 1 : -1; // Still face player
                if (this.grounded && Math.random() < 0.15) {
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
    
    aiWander() {
        this.vx = this.aiWanderDir * CONFIG.PLAYER_SPEED * 0.5;
        this.facing = this.aiWanderDir;
        if (this.x < 60) this.aiWanderDir = 1;
        else if (this.x > CONFIG.WIDTH - 60) this.aiWanderDir = -1;
        else if (Math.random() < 0.01) this.aiWanderDir *= -1;
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
        
        if (dist < CONFIG.SWORD_RANGE * 1.5) {
            // Close range - attack or dodge
            if (rand < CONFIG.AI_AGGRESSION) {
                this.aiAction = 'attack';
            } else {
                this.aiAction = 'dodge';
            }
        } else if (dist < 100) {
            // Medium range - approach or wander
            if (rand < CONFIG.AI_AGGRESSION) {
                this.aiAction = 'chase';
            } else if (rand < 0.7) {
                this.aiAction = 'wander';
            } else {
                this.aiAction = 'idle';
                this.aiIdleTimer = CONFIG.AI_IDLE_TIME;
            }
        } else {
            // Far - wander or chase
            if (rand < CONFIG.AI_WANDER_CHANCE) {
                this.aiAction = 'wander';
            } else if (rand < 0.6) {
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
                    this.canDoubleJump = true; // Reset double jump on pogo
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
                    
                    // Clash particles - slick radial spark burst
                    const clashX = (this.x + other.x) / 2 + 8;
                    const clashY = (this.y + other.y) / 2 + 10;
                    spawnClashParticles(clashX, clashY);
                    
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
                    
                    // Blood particles
                    spawnBloodParticles(hitX, hitY, 25, this.facing);
                    
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
        // Gravity (reduced if wall sliding)
        if (!this.dashing) {
            if (this.wallSliding) {
                this.vy = Math.min(this.vy + CONFIG.GRAVITY * 0.2, CONFIG.PLAYER_WALL_SLIDE);
            } else {
                this.vy += CONFIG.GRAVITY;
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
                    const pushForce = 2;
                    if (this.x < other.x) {
                        this.x = other.x - this.w;
                        this.vx = -pushForce;
                        other.vx = pushForce;
                    } else {
                        this.x = other.x + other.w;
                        this.vx = pushForce;
                        other.vx = -pushForce;
                    }
                }
            }
        }
        
        // Friction (only when not dashing)
        if (!this.dashing && this.grounded) {
            this.vx *= CONFIG.FRICTION;
        }
        
        // Collision with platforms
        this.grounded = false;
        this.wallSliding = false;
        this.wallDir = 0;
        
        for (const p of state.platforms) {
            if (this.collides(p)) {
                // Resolve collision
                const overlapX = Math.min(this.x + this.w - p.x, p.x + p.w - this.x);
                const overlapY = Math.min(this.y + this.h - p.y, p.y + p.h - this.y);
                
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
                        this.canDoubleJump = true;
                    } else {
                        this.y = p.y + p.h;
                    }
                    this.vy = 0;
                }
            }
        }
        
        // Keep in bounds
        this.x = Math.max(0, Math.min(CONFIG.WIDTH - this.w, this.x));
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
        updateUI();
        checkGameOver();
    }
    
    respawn() {
        if (this.lives <= 0) return; // Stay dead if no lives
        this.alive = true;
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.vx = 0;
        this.vy = 0;
        this.bullets = CONFIG.BULLET_COUNT;
        this.dashing = false;
        this.slashing = false;
        this.stunned = false;
        this.movementLockTimer = 0;
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
            ctx.restore();
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = this.isAI ? COLORS.player2 : COLORS.player1;
            ctx.fillRect(this.x, this.y, this.w, this.h);
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
// UI
// =============================================================================

function updateUI() {
    // Show player lives
    const player = state.players[0];
    document.getElementById('p1-lives').textContent = player ? '❤'.repeat(player.lives) : '';
    
    // Show enemy lives (sum of all enemy lives remaining)
    const enemyLives = state.players.slice(1).reduce((sum, p) => sum + Math.max(0, p.lives), 0);
    document.getElementById('p2-lives').textContent = '❤'.repeat(enemyLives);
    
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
    // Check if player is out of lives
    const player = state.players[0];
    if (player.lives <= 0) {
        showMessage('GAME OVER', 180);
        setTimeout(() => {
            state.round++;
            resetMatch();
        }, 3000);
        return;
    }
    
    // Check if all enemies are out of lives
    const aliveEnemies = state.players.slice(1).filter(p => p.lives > 0);
    if (aliveEnemies.length === 0) {
        showMessage('YOU WIN!', 180);
        setTimeout(() => {
            state.round++;
            resetMatch();
        }, 3000);
    }
}

function resetMatch() {
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
    updateUI();
    hideMessage();
    showMessage('FIGHT!', 60);
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
    showMessage('FIGHT!', 60);
}

function update() {
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
    
    // Screen shake decay
    if (state.screenShake > 0) state.screenShake *= 0.9;
    
    clearJustPressed();
}

function draw() {
    ctx.save();
    
    // Screen shake
    if (state.screenShake > 0.5) {
        ctx.translate(
            (Math.random() - 0.5) * state.screenShake,
            (Math.random() - 0.5) * state.screenShake
        );
    }
    
    // Draw background video
    if (ASSETS.loaded && ASSETS.bgVideo && ASSETS.bgVideo.readyState >= 2) {
        ctx.drawImage(ASSETS.bgVideo, 0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        // Darken slightly for contrast
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    } else {
        // Fallback solid color
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
    drawSlashEffects(ctx);
    drawBullets(ctx);
    drawParticles(ctx);
    
    // Draw players
    for (const p of state.players) p.draw(ctx);
    
    // Debug overlay
    drawDebug(ctx);
    
    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

init();
gameLoop();
