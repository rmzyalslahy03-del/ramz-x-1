// ===================== notifications.js - Ramz-X (Ø§Ù„Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ) =====================
// Ù†Ø¸Ø§Ù… Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…ÙˆØ­Ù‘Ø¯: Toast + ØµÙˆØªÙŠØ§Øª + ØªØ±Ø­ÙŠØ¨ + Ù…Ø²Ø§Ù…Ù†Ø© + Ù…Ø±ÙƒØ² Ø¥Ø´Ø¹Ø§Ø±Ø§Øª
// ÙŠØ¹ØªÙ…Ø¯ Ø¹Ù„Ù‰ Supabase client Ù…Ù† common.js
// =================================================================================

(function () {
  'use strict';

  if (typeof supabase === 'undefined') {
    console.warn('notifications.js: supabase client ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯. ØªØ£ÙƒØ¯ Ù…Ù† ØªØ­Ù…ÙŠÙ„ common.js Ø£ÙˆÙ„Ø§Ù‹.');
  }

  // ========== Ø¥Ù†Ø´Ø§Ø¡ Ø¹Ù†ØµØ± Ø§Ù„Ù€ Toast Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ ==========
  function createToastContainer() {
    if (document.getElementById('ramzToastContainer')) return;
    const container = document.createElement('div');
    container.id = 'ramzToastContainer';
    container.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      z-index: 9999; display: flex; flex-direction: column; gap: 10px;
      pointer-events: none; width: auto; max-width: 90vw;
    `;
    document.body.appendChild(container);
  }

  // ========== Ø¥Ø¯Ø±Ø§Ø¬ Ø£Ù†Ù…Ø§Ø· CSS ==========
  function injectStyles() {
    if (document.getElementById('ramz-toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'ramz-toast-styles';
    style.textContent = `
      .ramz-toast {
        background: #ffffff !important; color: #000000 !important;
        padding: 12px 20px !important; border-radius: 30px !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
        display: flex !important; align-items: center !important; gap: 10px !important;
        font-family: 'Cairo', sans-serif !important; font-size: 15px !important;
        font-weight: 600 !important; white-space: nowrap !important;
        max-width: 90vw !important; opacity: 0 !important;
        transform: translateY(-15px) !important;
        transition: opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1) !important;
        pointer-events: auto !important; cursor: pointer !important;
        border: 1px solid #e0e0e0 !important;
        width: auto !important; min-width: 220px !important;
        justify-content: center !important;
        user-select: none; -webkit-user-select: none;
        will-change: opacity, transform;
      }
      .ramz-toast.show { opacity: 1 !important; transform: translateY(0) !important; }
      .ramz-toast .toast-icon { font-size: 20px !important; line-height:1; flex-shrink:0; width:24px; text-align:center; }
      .ramz-toast .toast-msg { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      body.dark .ramz-toast { background: #1e1e1e !important; color: #f0f0f0 !important; border-color: #333 !important; box-shadow:0 4px 16px rgba(0,0,0,0.4) !important; }
      .ramz-toast.toast-success { border-left:4px solid #4caf50; }
      .ramz-toast.toast-error { border-left:4px solid #f44336; }
      .ramz-toast.toast-warning { border-left:4px solid #ff9800; }
      .ramz-toast.toast-info { border-left:4px solid #2196f3; }
      @media (max-width:600px) {
        .ramz-toast { white-space:normal; min-width:200px; max-width:85vw; padding:10px 16px; font-size:14px; border-radius:24px; }
        .ramz-toast .toast-msg { white-space:normal; }
        #ramzToastContainer { top:12px; gap:6px; }
      }
      @keyframes ramzToastPulse {
        0% { transform:translateY(-15px) scale(0.95); opacity:0; }
        50% { transform:translateY(2px) scale(1.02); opacity:0.8; }
        100% { transform:translateY(0) scale(1); opacity:1; }
      }
      .ramz-toast.animate-pulse { animation:ramzToastPulse 0.5s ease-out; }
    `;
    document.head.appendChild(style);
  }

  // ========== Ù†Ø¸Ø§Ù… Ø§Ù„ØµÙˆØªÙŠØ§Øª Ø§Ù„Ù…Ø¯Ù…Ø¬ ==========
  class AudioSystem {
    constructor() {
      this.enabled = localStorage.getItem('ramz_sound_enabled') !== 'false';
      this.volume = parseFloat(localStorage.getItem('ramz_sound_volume') || '0.5');
      this.selectedSound = localStorage.getItem('ramz_sound_type') || 'gentle';
      this.audioContext = null;
      this.sounds = {
        gentle: { frequency: 880, duration: 0.3, type: 'sine' },
        chime: { frequency: 1200, duration: 0.4, type: 'sine' },
        alert: { frequency: 600, duration: 0.5, type: 'square' },
        message: { frequency: 1000, duration: 0.2, type: 'triangle' },
        like: { frequency: 1500, duration: 0.15, type: 'sine' },
        follow: { frequency: 2000, duration: 0.1, type: 'sine' },
      };
    }

    getContext() {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext());
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      return this.audioContext;
    }

    play(soundType = 'gentle') {
      if (!this.enabled) return;
      try {
        const ctx = this.getContext();
        const sound = this.sounds[soundType] || this.sounds.gentle;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = sound.frequency;
        oscillator.type = sound.type;
        gainNode.gain.value = this.volume * 0.3;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + sound.duration);
        oscillator.stop(ctx.currentTime + sound.duration);
      } catch (e) {}
    }

    playMessageSound() { this.play('message'); }
    playLikeSound() { this.play('like'); }
    playFollowSound() { this.play('follow'); }
    playAlertSound() { this.play('alert'); }
    playChimeSound() { this.play('chime'); }
    playNotificationSound() { this.play('gentle'); }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('ramz_sound_enabled', this.enabled);
      return this.enabled;
    }

    setEnabled(enabled) {
      this.enabled = enabled;
      localStorage.setItem('ramz_sound_enabled', enabled);
    }

    isEnabled() { return this.enabled; }
    setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); localStorage.setItem('ramz_sound_volume', this.volume); }
    getVolume() { return this.volume; }
    setSoundType(type) { if (this.sounds[type]) { this.selectedSound = type; localStorage.setItem('ramz_sound_type', type); } }
    getSoundType() { return this.selectedSound; }
    getAvailableSounds() { return Object.keys(this.sounds); }

    previewSound(type) {
      const was = this.enabled;
      this.enabled = true;
      this.play(type);
      this.enabled = was;
    }
  }

  // ========== ÙƒÙ„Ø§Ø³ RamzNotifications ==========
  class RamzNotifications {
    constructor() {
      createToastContainer();
      injectStyles();
      this.toastContainer = document.getElementById('ramzToastContainer');
      this.activeToasts = new Set();
      this.audio = new AudioSystem();
    }

    // ---------- Ø¹Ø±Ø¶ Toast Ø¹Ø§Ù… ----------
    showToast(message, icon = 'ðŸ””', duration = 4000, link = null, options = {}) {
      const key = message + icon;
      if (this.activeToasts.has(key)) return;
      this.activeToasts.add(key);
      setTimeout(() => this.activeToasts.delete(key), 1000);

      const toast = document.createElement('div');
      toast.className = 'ramz-toast';
      if (options.type) toast.classList.add(`toast-${options.type}`);
      if (options.animatePulse) toast.classList.add('animate-pulse');
      toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;
      this.toastContainer.appendChild(toast);

      requestAnimationFrame(() => toast.classList.add('show'));

      if (link) {
        toast.addEventListener('click', () => { window.location.href = link; });
      }

      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
      }, duration);

      // ØªØ´ØºÙŠÙ„ Ø§Ù„ØµÙˆØª ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹
      if (options.soundType) {
        this.audio.play(options.soundType);
      }
    }

    // ---------- Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„ØªÙØ§Ø¹Ù„Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© ----------
    likeNotification(actorName, postId) {
      this.showToast(`${actorName} Ø£Ø¹Ø¬Ø¨ Ø¨Ù…Ù†Ø´ÙˆØ±Ùƒ`, 'â¤ï¸', 4000, `home.html?post=${postId}`, { soundType: 'like' });
    }
    favoriteNotification(actorName, postId) {
      this.showToast(`${actorName} Ø£Ø¶Ø§Ù Ù…Ù†Ø´ÙˆØ±Ùƒ Ù„Ù…ÙØ¶Ù„Ø§ØªÙ‡`, 'â­', 4000, `home.html?post=${postId}`, { soundType: 'like' });
    }
    commentNotification(actorName, postId) {
      this.showToast(`${actorName} Ø¹Ù„Ù‚ Ø¹Ù„Ù‰ Ù…Ù†Ø´ÙˆØ±Ùƒ`, 'ðŸ’¬', 4000, `home.html?post=${postId}`, { soundType: 'like' });
    }
    repostNotification(actorName, postId) {
      this.showToast(`${actorName} Ø£Ø¹Ø§Ø¯ Ù†Ø´Ø± Ù…Ù†Ø´ÙˆØ±Ùƒ`, 'ðŸ”„', 4000, `home.html?post=${postId}`, { soundType: 'chime' });
    }
    mentionNotification(actorName, postId) {
      this.showToast(`${actorName} Ø£Ø´Ø§Ø± Ø¥Ù„ÙŠÙƒ ÙÙŠ Ù…Ù†Ø´ÙˆØ±`, 'ðŸ“Œ', 4000, `home.html?post=${postId}`, { soundType: 'chime' });
    }
    generalInteractionNotification(actorName, postId) {
      this.showToast(`ØªÙØ§Ø¹Ù„ ${actorName} Ø­ÙˆÙ„ Ù…Ù†Ø´ÙˆØ±Ùƒ`, 'ðŸ’¡', 4000, `home.html?post=${postId}`);
    }

    // ---------- Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ ÙˆØ§Ù„Ø²ÙŠØ§Ø±Ø§Øª ----------
    profileVisitNotification(visitorName, visitorId) {
      this.showToast(`${visitorName} Ø²Ø§Ø± Ù…Ù„ÙÙƒ Ø§Ù„Ø´Ø®ØµÙŠ`, 'ðŸ‘¤', 4000, `public-profile.html?user=${visitorId || visitorName}`);
    }
    followRequestNotification(requesterName) {
      this.showToast(`${requesterName} Ø·Ù„Ø¨ Ù…ØªØ§Ø¨Ø¹ØªÙƒ`, 'âž•', 5000, 'inbox.html?tab=notifications', { soundType: 'follow' });
    }
    followAcceptedNotification(accepterName) {
      this.showToast(`${accepterName} Ù‚Ø¨Ù„ Ø·Ù„Ø¨ Ù…ØªØ§Ø¨Ø¹ØªÙƒ`, 'âœ…', 4000, null, { soundType: 'follow' });
    }

    // ---------- Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø£ØµØ¯Ù‚Ø§Ø¡ ÙˆØ§Ù„Ù…Ø­ØªÙˆÙ‰ ----------
    friendPostNotification(friendName, postId) {
      this.showToast(`ØµØ¯ÙŠÙ‚Ùƒ ${friendName} Ø´Ø§Ø±Ùƒ Ù…Ù†Ø´ÙˆØ±Ø§Ù‹`, 'ðŸ“°', 4000, `home.html?post=${postId}`);
    }
    friendPhotoNotification(friendName, postId) {
      this.showToast(`ØµØ¯ÙŠÙ‚Ùƒ ${friendName} Ø´Ø§Ø±Ùƒ ØµÙˆØ±Ø©`, 'ðŸ“·', 4000, `home.html?post=${postId}`);
    }
    friendStoryNotification(friendName) {
      this.showToast(`ØµØ¯ÙŠÙ‚Ùƒ ${friendName} Ø´Ø§Ø±Ùƒ Ù‚ØµØ©`, 'ðŸ“–', 4000, 'home.html');
    }
    friendVideoNotification(friendName, postId) {
      this.showToast(`ØµØ¯ÙŠÙ‚Ùƒ ${friendName} Ø´Ø§Ø±Ùƒ ÙÙŠØ¯ÙŠÙˆ`, 'ðŸŽ¬', 4000, `home.html?post=${postId}`);
    }

    // ---------- Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø§Øª ÙˆØ§Ù„Ø¯Ø¹ÙˆØ§Øª ----------
    groupInviteNotification(friendName, groupId) {
      this.showToast(`ØµØ¯ÙŠÙ‚Ùƒ ${friendName} ÙŠØ¯Ø¹ÙˆÙƒ Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ø¬Ù…Ø§Ø¹ÙŠØ©`, 'ðŸ‘¥', 5000, `group-chat.html?group=${groupId}`, { soundType: 'message' });
    }
    diaryInviteNotification(friendName) {
      this.showToast(`ØµØ¯ÙŠÙ‚Ùƒ ${friendName} ÙŠØ¯Ø¹ÙˆÙƒ Ù„Ù…ØªØ§Ø¨Ø¹Ø© ÙŠÙˆÙ…ÙŠØ§ØªÙ‡`, 'ðŸ“…', 4000, `public-profile.html?user=${friendName}`);
    }

    // ---------- Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ ----------
    messageRequestNotification(senderName) {
      this.showToast(`${senderName} ÙŠØ±ÙŠØ¯ Ù…Ø±Ø§Ø³Ù„ØªÙƒ`, 'âœ‰ï¸', 5000, 'inbox.html', { soundType: 'message' });
    }
    newMessageNotification(senderName, chatId) {
      this.showToast(`Ø±Ø³Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø© Ù…Ù† ${senderName}`, 'ðŸ’¬', 5000, `inbox.html?chat=${chatId || senderName}`, { soundType: 'message' });
    }

    // ---------- Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¹Ø§Ù…Ø© ----------
    welcomeNotification(userName) {
      this.showToast(`Ù…Ø±Ø­Ø¨Ø§Ù‹ ${userName}! Ø£Ù‡Ù„Ø§Ù‹ Ø¨Ùƒ ÙÙŠ Ramz-X`, 'ðŸŽˆ', 5000);
    }
    friendJoinedNotification(friendName, friendId) {
      this.showToast(`ØµØ¯ÙŠÙ‚Ùƒ ${friendName} Ø§Ù†Ø¶Ù… Ø¥Ù„Ù‰ Ramz-X!`, 'ðŸŽ‰', 5000, `public-profile.html?user=${friendId || friendName}`);
    }
    newFollowerNotification(followerName) {
      this.showToast(`Ù„Ø¯ÙŠÙƒ Ù…ØªØ§Ø¨Ø¹ Ø¬Ø¯ÙŠØ¯: ${followerName}`, 'ðŸ‘£', 5000, `public-profile.html?user=${followerName}`, { soundType: 'follow' });
    }

    // ---------- Ù†Ø¸Ø§Ù… Ø§Ù„ØªØ±Ø­ÙŠØ¨ Ø¨Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ø§Ù„Ø¬Ø¯Ø¯ ----------
    async welcomeNewUser(userId, userName) {
      if (!supabase) { this.welcomeNotification(userName); return; }
      try {
        const { data: contacts } = await supabase.from('user_contacts').select('contact_user_id').eq('user_id', userId);
        if (contacts && contacts.length > 0) {
          contacts.forEach(c => this.friendJoinedNotification(userName, c.contact_user_id));
        }
      } catch (err) { console.error('Ø®Ø·Ø£ ÙÙŠ Ø§Ù„ØªØ±Ø­ÙŠØ¨:', err); }
      this.welcomeNotification(userName);
    }

    // ---------- Ù…Ø²Ø§Ù…Ù†Ø© Ø¬Ù‡Ø§Øª Ø§Ù„Ø§ØªØµØ§Ù„ ----------
    async syncContacts(userId) {
      if (!supabase) return;
      if (!navigator.contacts) { console.warn('Contacts API ØºÙŠØ± Ù…Ø¯Ø¹ÙˆÙ…Ø©'); return; }
      try {
        const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: true });
        if (!contacts?.length) return;
        const phones = contacts.flatMap(c => c.tel).filter(Boolean);
        const { data: matched, error } = await supabase.from('users').select('id, username').in('phone', phones);
        if (error) throw error;
        if (matched?.length) {
          matched.forEach(u => this.showToast(`ØµØ¯ÙŠÙ‚Ùƒ ${u.username} Ù…ÙˆØ¬ÙˆØ¯ Ø¹Ù„Ù‰ Ramz-X`, 'ðŸ‘‹', 5000, `public-profile.html?user=${u.id}`));
        } else {
          this.showToast('Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø£ØµØ¯Ù‚Ø§Ø¡ Ù…Ø·Ø§Ø¨Ù‚ÙŠÙ†', 'ðŸ”', 3000);
        }
      } catch (err) { console.error('Ù…Ø²Ø§Ù…Ù†Ø©:', err); this.showToast('ØªØ¹Ø°Ø±Øª Ø§Ù„Ù…Ø²Ø§Ù…Ù†Ø©', 'âš ï¸', 3000); }
    }

    // ---------- Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„ØªØ­Ø¯ÙŠØ§Øª ÙˆØ§Ù„Ù…Ø³Ø§Ø¨Ù‚Ø§Øª ----------
    challengeNotification(actorName, challengeId) {
      this.showToast(`${actorName} Ø¯Ø¹Ø§Ùƒ Ù„ØªØ­Ø¯Ù`, 'ðŸ†', 5000, `challenge.html?id=${challengeId}`, { soundType: 'alert' });
    }
    contestWinnerNotification(title) {
      this.showToast(`ðŸŽ‰ ÙØ²Øª ÙÙŠ "${title}"!`, 'ðŸ…', 6000, null, { soundType: 'alert', animatePulse: true });
    }

    // ---------- Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù… ----------
    systemNotification(message, link = null) {
      this.showToast(message, 'âš™ï¸', 5000, link);
    }

    // ---------- Ø¯ÙˆØ§Ù„ Ø§Ù„ØµÙˆØª Ø§Ù„Ø¹Ø§Ù…Ø© ----------
    getAudio() { return this.audio; }
    toggleSound() { return this.audio.toggle(); }
    isSoundEnabled() { return this.audio.isEnabled(); }
  }

  // ========== ØªØµØ¯ÙŠØ± Ù†Ø³Ø®Ø© Ø¹Ø§Ù„Ù…ÙŠØ© ==========
  window.RamzNotif = new RamzNotifications();

  // ========== ØªÙ‡ÙŠØ¦Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ© ==========
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user?.id && !sessionStorage.getItem('ramz_visited')) {
            setTimeout(() => window.RamzNotif.welcomeNotification(user.username), 1500);
            sessionStorage.setItem('ramz_visited', 'true');
          }
        } catch (e) {}
      }
    }, 2000);
  });

  console.log('âœ… notifications.js (Ø§Ù„Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ) Ø¬Ø§Ù‡Ø²');
})();
