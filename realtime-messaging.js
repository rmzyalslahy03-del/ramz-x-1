// ===================== realtime-messaging.js - Ramz-X =====================
// نظام المراسلة الفورية الكامل: كتابة، سحب/إفلات، تفاعلات، حالة اتصال
// يعتمد على Supabase Realtime + Broadcast
// =====================================================================

(function () {
  'use strict';

  if (typeof supabase === 'undefined') {
    console.warn('realtime-messaging.js: Supabase client غير موجود.');
    return;
  }

  // ========== كلاس المراسلة الفورية ==========
  class RealtimeMessaging {
    constructor(options = {}) {
      this.userId = options.userId || null;
      this.userName = options.userName || 'مستخدم';
      this.userAvatar = options.userAvatar || '';
      this.chatType = options.chatType || 'private'; // 'private' | 'group'
      this.chatId = options.chatId || null; // receiver_id أو group_id
      this.containerId = options.containerId || 'chatMessages';
      this.inputId = options.inputId || 'messageInput';
      this.typingIndicatorId = options.typingIndicatorId || 'typingIndicator';
      this.statusIndicatorId = options.statusIndicatorId || 'chatStatus';
      this.dropZoneId = options.dropZoneId || 'chatMessages';
      
      this.channel = null;
      this.typingTimeout = null;
      this.connectionStatus = 'unknown';
      this.reactions = ['❤️', '😂', '😮', '😢', '😡', '👍', '👏', '🔥', '🎉', '💯'];
      
      this.init();
    }

    async init() {
      if (!this.userId || !this.chatId) {
        console.warn('RealtimeMessaging: userId و chatId مطلوبان');
        return;
      }

      await this.setupRealtimeChannel();
      this.setupTypingIndicator();
      this.setupDragAndDrop();
      this.setupConnectionMonitoring();
      this.setupReactionListeners();
    }

    // ---------- قناة Realtime ----------
    async setupRealtimeChannel() {
      const channelName = `chat:${this.chatType}:${this.chatId}`;
      
      this.channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: this.userId },
        },
      });

      // استقبال الرسائل الجديدة
      this.channel.on('broadcast', { event: 'new_message' }, (payload) => {
        this.onNewMessage(payload.payload);
      });

      // استقبال مؤشر الكتابة
      this.channel.on('broadcast', { event: 'typing' }, (payload) => {
        this.onTyping(payload.payload);
      });

      // استقبال التفاعلات
      this.channel.on('broadcast', { event: 'reaction' }, (payload) => {
        this.onReaction(payload.payload);
      });

      // تتبع حالة الاتصال (Presence)
      this.channel.on('presence', { event: 'sync' }, () => {
        this.updatePresence();
      });

      await this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel.track({ online_at: new Date().toISOString() });
        }
      });
    }

    // ---------- إرسال رسالة ----------
    async sendMessage(text, imageUrl = null, replyTo = null) {
      if (!text && !imageUrl) return null;

      const message = {
        id: crypto.randomUUID(),
        text: text || '',
        image: imageUrl || null,
        sender_id: this.userId,
        sender_name: this.userName,
        sender_avatar: this.userAvatar,
        reply_to: replyTo,
        created_at: new Date().toISOString(),
        read: false,
        reactions: {},
      };

      // حفظ في قاعدة البيانات
      if (this.chatType === 'private') {
        await supabase.from('messages').insert({
          sender_id: this.userId,
          receiver_id: this.chatId,
          text: message.text,
          image: message.image,
          reply_to: message.reply_to,
          created_at: message.created_at,
          read: false,
        });
      } else {
        await supabase.from('group_messages').insert({
          group_id: this.chatId,
          sender_id: this.userId,
          text: message.text,
          image: message.image,
          created_at: message.created_at,
        });
      }

      // بث عبر Realtime
      this.channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: message,
      });

      return message;
    }

    // ---------- مؤشر الكتابة ----------
    setupTypingIndicator() {
      const input = document.getElementById(this.inputId);
      if (!input) return;

      input.addEventListener('input', () => {
        // إرسال حدث "يكتب"
        this.channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: this.userId,
            userName: this.userName,
            isTyping: true,
          },
        });

        // إيقاف مؤشر الكتابة بعد ثانيتين من التوقف
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
          this.channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              userId: this.userId,
              userName: this.userName,
              isTyping: false,
            },
          });
        }, 2000);
      });
    }

    onTyping(payload) {
      if (payload.userId === this.userId) return;
      
      const indicator = document.getElementById(this.typingIndicatorId);
      if (!indicator) return;

      if (payload.isTyping) {
        indicator.textContent = `${payload.userName} يكتب...`;
        indicator.style.display = 'block';
      } else {
        indicator.style.display = 'none';
      }
    }

    // ---------- السحب والإفلات ----------
    setupDragAndDrop() {
      const dropZone = document.getElementById(this.dropZoneId);
      if (!dropZone) return;

      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });

      dropZone.addEventListener('dragenter', () => {
        dropZone.style.border = '2px dashed #ff0050';
        dropZone.style.background = 'rgba(255,0,80,0.05)';
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.style.border = '';
        dropZone.style.background = '';
      });

      dropZone.addEventListener('drop', async (e) => {
        dropZone.style.border = '';
        dropZone.style.background = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          await this.handleFileUpload(files);
        }
      });
    }

    async handleFileUpload(files) {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          this.showToast('الملفات المدعومة: صور فقط', true);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          this.showToast('حجم الملف يجب أن يكون أقل من 10 ميجابايت', true);
          continue;
        }

        this.showToast('جاري رفع الصورة...');
        const fileName = `messages/${Date.now()}_${Math.random().toString(36)}.${file.name.split('.').pop()}`;
        
        const { data, error } = await supabase.storage
          .from('ramz-x-images')
          .upload(fileName, file);

        if (error) {
          this.showToast('فشل رفع الصورة', true);
          continue;
        }

        const imageUrl = `https://zlkpoghjbqtnhzhmmdbw.supabase.co/storage/v1/object/public/ramz-x-images/${data.path}`;
        await this.sendMessage('', imageUrl);
      }
    }

    // ---------- التفاعلات (Reactions) ----------
    setupReactionListeners() {
      // سيتم إضافة مستمعي التفاعل ديناميكياً عند عرض الرسائل
    }

    async addReaction(messageId, reaction) {
      // تحديث في قاعدة البيانات
      if (this.chatType === 'private') {
        const { data: msg } = await supabase.from('messages').select('reactions').eq('id', messageId).single();
        const reactions = msg?.reactions || {};
        if (!reactions[reaction]) reactions[reaction] = [];
        if (!reactions[reaction].includes(this.userId)) {
          reactions[reaction].push(this.userId);
        }
        await supabase.from('messages').update({ reactions }).eq('id', messageId);
      }

      // بث عبر Realtime
      this.channel.send({
        type: 'broadcast',
        event: 'reaction',
        payload: {
          messageId,
          reaction,
          userId: this.userId,
          userName: this.userName,
        },
      });
    }

    onReaction(payload) {
      // سيتم تحديث واجهة التفاعل
      const msgElement = document.querySelector(`[data-msg-id="${payload.messageId}"]`);
      if (msgElement) {
        const reactionBar = msgElement.querySelector('.reaction-bar');
        if (reactionBar) {
          reactionBar.innerHTML += `<span class="reaction-item">${payload.reaction}</span>`;
        }
      }
    }

    // ---------- حالة الاتصال ----------
    setupConnectionMonitoring() {
      this.updateConnectionStatus();
      
      window.addEventListener('online', () => {
        this.updateConnectionStatus();
        this.channel?.track({ online_at: new Date().toISOString() });
      });
      
      window.addEventListener('offline', () => {
        this.updateConnectionStatus();
      });

      setInterval(() => this.updateConnectionStatus(), 30000);
    }

    updateConnectionStatus() {
      const statusEl = document.getElementById(this.statusIndicatorId);
      if (!statusEl) return;

      if (navigator.onLine) {
        this.connectionStatus = 'online';
        statusEl.textContent = 'متصل';
        statusEl.style.color = '#4ade80';
      } else {
        this.connectionStatus = 'offline';
        statusEl.textContent = 'غير متصل';
        statusEl.style.color = '#f87171';
      }
    }

    updatePresence() {
      const state = this.channel.presenceState();
      const onlineUsers = Object.keys(state).length;
      
      const statusEl = document.getElementById(this.statusIndicatorId);
      if (statusEl && this.chatType === 'private') {
        statusEl.textContent = onlineUsers > 0 ? 'متصل' : 'غير متصل';
        statusEl.style.color = onlineUsers > 0 ? '#4ade80' : '#f87171';
      }
    }

    // ---------- عرض رسالة جديدة ----------
    onNewMessage(message) {
      if (message.sender_id === this.userId) return;
      
      this.showToast(`رسالة جديدة من ${message.sender_name || 'مستخدم'}`);
      this.playNotificationSound();
      
      // سيتم استدعاء دالة العرض من الصفحة المستخدمة
      if (typeof this.onMessageReceived === 'function') {
        this.onMessageReceived(message);
      }
    }

    // ---------- دوال مساعدة ----------
    showToast(msg, isError = false) {
      if (typeof window.showToast === 'function') {
        window.showToast(msg, isError);
        return;
      }
      // احتياطي
      const toast = document.createElement('div');
      toast.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${isError?'#ef4444':'#ff0050'};color:#fff;padding:10px 20px;border-radius:30px;z-index:9999;font-family:'Cairo';font-size:14px;`;
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    playNotificationSound() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.1;
        osc.type = 'sine';
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {}
    }

    // ---------- تنظيف ----------
    disconnect() {
      if (this.channel) {
        this.channel.unsubscribe();
        this.channel = null;
      }
      clearTimeout(this.typingTimeout);
    }
  }

  // ========== تصدير ==========
  window.RealtimeMessaging = RealtimeMessaging;
  console.log('✅ realtime-messaging.js جاهز');
})();
