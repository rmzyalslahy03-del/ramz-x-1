// ===================== audio-notifications.js - Ramz-X =====================
// نظام الإشعارات الصوتية: تفعيل/تعطيل، أصوات متعددة، إعدادات محفوظة
// =====================================================================

(function () {
  'use strict';

  class AudioNotifications {
    constructor() {
      this.enabled = localStorage.getItem('ramz_sound_enabled') !== 'false';
      this.volume = parseFloat(localStorage.getItem('ramz_sound_volume') || '0.5');
      this.selectedSound = localStorage.getItem('ramz_sound_type') || 'gentle';
      this.audioContext = null;
      
      // تعريف الأصوات المختلفة
      this.sounds = {
        gentle: { frequency: 880, duration: 0.3, type: 'sine' },
        chime: { frequency: 1200, duration: 0.4, type: 'sine' },
        alert: { frequency: 600, duration: 0.5, type: 'square' },
        message: { frequency: 1000, duration: 0.2, type: 'triangle' },
        like: { frequency: 1500, duration: 0.15, type: 'sine' },
        follow: { frequency: 2000, duration: 0.1, type: 'sine' },
      };
    }

    // ---------- تهيئة AudioContext ----------
    getContext() {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      return this.audioContext;
    }

    // ---------- تشغيل صوت ----------
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
      } catch (e) {
        // فشل صامت
      }
    }

    // ---------- أصوات جاهزة للتفاعلات ----------
    playMessageSound() { this.play('message'); }
    playLikeSound() { this.play('like'); }
    playFollowSound() { this.play('follow'); }
    playAlertSound() { this.play('alert'); }
    playChimeSound() { this.play('chime'); }
    playNotificationSound() { this.play('gentle'); }

    // ---------- تفعيل/تعطيل ----------
    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('ramz_sound_enabled', this.enabled);
      return this.enabled;
    }

    setEnabled(enabled) {
      this.enabled = enabled;
      localStorage.setItem('ramz_sound_enabled', enabled);
    }

    isEnabled() {
      return this.enabled;
    }

    // ---------- مستوى الصوت ----------
    setVolume(volume) {
      this.volume = Math.max(0, Math.min(1, volume));
      localStorage.setItem('ramz_sound_volume', this.volume);
    }

    getVolume() {
      return this.volume;
    }

    // ---------- نوع الصوت ----------
    setSoundType(type) {
      if (this.sounds[type]) {
        this.selectedSound = type;
        localStorage.setItem('ramz_sound_type', type);
      }
    }

    getSoundType() {
      return this.selectedSound;
    }

    getAvailableSounds() {
      return Object.keys(this.sounds);
    }

    // ---------- معاينة الصوت ----------
    previewSound(type) {
      const wasEnabled = this.enabled;
      this.enabled = true;
      this.play(type);
      this.enabled = wasEnabled;
    }
  }

  // ========== تصدير نسخة عالمية ==========
  window.AudioNotifications = AudioNotifications;
  window.RamzAudio = new AudioNotifications();

  console.log('✅ audio-notifications.js جاهز');
})();
