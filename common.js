// ================== common.js - Ramz-X Platform ==================
// الرابط: https://zlkpoghjbqtnhzhmmdbw.supabase.co
// المفتاح: sb_publishable_7evDsA5aEgPMsRBTFjntrg_XZQFmNLw
// الدلو: ramz-x-images

// ================== تكوين Supabase ==================
const SUPABASE_URL = "https://zlkpoghjbqtnhzhmmdbw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7evDsA5aEgPMsRBTFjntrg_XZQFmNLw";

if (typeof window._supabaseClient === 'undefined') {
    window._supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
var supabase = window._supabaseClient;

// ================== أنماط الإشعارات ==================
if (!document.getElementById('ramz-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'ramz-toast-styles';
    style.textContent = `
        #globalToast, .progress-toast {
            background: transparent !important;
            backdrop-filter: none !important;
            border: none !important;
            border-radius: 0 !important;
            color: #10b981 !important;
            font-weight: 700 !important;
            box-shadow: none !important;
            letter-spacing: 0.5px;
            padding: 8px 16px !important;
            display: inline-block !important;
            width: auto !important;
            max-width: 90vw;
            margin: 0 auto;
            text-align: center;
            -webkit-text-stroke: 0.7px black !important;
            text-stroke: 0.7px black !important;
            font-size: 14px;
            text-shadow: none;
        }
        body.light #globalToast, body.light .progress-toast {
            background: transparent !important;
            border: none !important;
            color: #10b981 !important;
            -webkit-text-stroke: 0.7px black !important;
        }
        .progress-toast .progress-bar {
            background: rgba(0, 0, 0, 0.1) !important;
            border-radius: 4px;
            overflow: hidden;
        }
        .progress-toast .progress-fill {
            background: #10b981 !important;
            height: 100%;
        }
        #globalToast.toast-error {
            color: #ff6b6b !important;
            -webkit-text-stroke: 0.7px black !important;
        }
        #globalToast {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
        }
        @media (max-width: 640px) {
            #globalToast {
                white-space: normal;
                width: 90%;
                text-align: center;
            }
        }
    `;
    document.head.appendChild(style);
}

// ================== دوال مساعدة ==================
function showToast(msg, isError = false) {
    const toast = document.getElementById('globalToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.opacity = '1';
    if (isError) {
        toast.classList.add('toast-error');
    } else {
        toast.classList.remove('toast-error');
    }
    setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

function showProgress(message, duration = 5000) {
    const toast = document.getElementById('progressToast');
    if (!toast) return;
    const textEl = document.getElementById('progressText');
    const fillEl = document.getElementById('progressFill');
    if (!textEl || !fillEl) return;
    textEl.innerText = message;
    toast.style.opacity = '1';
    fillEl.style.width = '0%';
    const startTime = Date.now();
    const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min(100, (elapsed / duration) * 100);
        fillEl.style.width = percent + '%';
        if (percent >= 100) {
            clearInterval(interval);
            setTimeout(() => { toast.style.opacity = '0'; }, 500);
        }
    }, 50);
}

function formatNumber(num) {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diff = Math.floor((now - past) / 1000);
    if (diff < 60) return `منذ ${diff} ثانية`;
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
}

function isValidUUID(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}

// ================== مسح الحساب الضيف القديم ==================
function clearInvalidGuestAccount() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        try {
            const user = JSON.parse(stored);
            if (user.is_guest && !isValidUUID(user.id)) {
                console.warn("⚠️ تم العثور على حساب ضيف قديم غير صالح، سيتم حذفه:", user.id);
                localStorage.removeItem('currentUser');
                localStorage.removeItem('guestUser');
                return true;
            }
        } catch(e) {}
    }
    return false;
}

// ================== تحميل البيانات من Supabase ==================
async function loadFromSupabase() {
    try {
        const { data: test, error: testErr } = await supabase.from('users').select('id').limit(1);
        if (testErr) throw testErr;
        
        const { data: posts, error: postsErr } = await supabase
            .from('posts')
            .select('*')
            .eq('hidden', false)
            .order('created_at', { ascending: false });
        if (postsErr) throw postsErr;

        const { data: users, error: usersErr } = await supabase.from('users').select('*');
        if (usersErr) throw usersErr;

        localStorage.setItem('posts', JSON.stringify(posts || []));
        localStorage.setItem('users', JSON.stringify(users || []));
        console.log("✅ تم تحميل البيانات من Supabase");
        return { posts, users };
    } catch (err) {
        console.error("خطأ في loadFromSupabase:", err);
        showToast(`⚠️ فشل تحميل البيانات: ${err.message}`, true);
        return null;
    }
}

async function initDB() {
    try {
        await loadFromSupabase();
        console.log("✅ تمت تهيئة قاعدة البيانات");
        return true;
    } catch (err) {
        console.error("فشل initDB:", err);
        showToast("⚠️ فشل الاتصال بقاعدة البيانات.", true);
        return false;
    }
}

// ================== إدارة المستخدمين والجلسات ==================
let currentUserId = null;
let globalNotificationsChannel = null;
let globalMessagesChannel = null;

function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.1;
        oscillator.type = 'sine';
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
        oscillator.stop(audioCtx.currentTime + 0.5);
        audioCtx.resume();
    } catch(e) { console.log(e); }
}

async function createGuestUser() {
    const guestId = crypto.randomUUID();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);
    const guestUsername = 'زائر_' + Math.floor(Math.random() * 10000);
    const guestUser = {
        id: guestId,
        username: guestUsername,
        full_name: 'زائر',
        bio: 'حساب تجريبي صالح لمدة 6 أشهر. قم بتوثيق حسابك للاستمرار.',
        avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
        unique_name: 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        followers_count: 0,
        following_count: 0,
        social: {},
        is_guest: true,
        expiry_date: expiryDate.toISOString(),
        verified: false
    };
    const { error } = await supabase.from('users').insert(guestUser);
    if (error && error.code !== '23505') {
        console.error("فشل إنشاء حساب ضيف:", error);
        showToast("تعذر إنشاء حساب ضيف, حاول مرة أخرى", true);
        return null;
    }
    localStorage.setItem('currentUser', JSON.stringify(guestUser));
    localStorage.setItem('guestUser', JSON.stringify(guestUser));
    showToast("تم إنشاء حساب تجريبي صالح لمدة 6 أشهر");
    return guestUser;
}

async function upgradeGuestToVerified(email, password, fullName) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.is_guest) {
        showToast("هذه الخاصية متاحة فقط لحسابات الضيوف", true);
        return false;
    }
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: fullName || currentUser.full_name,
                avatar_url: currentUser.avatar
            }
        }
    });
    if (error) {
        showToast(error.message, true);
        return false;
    }
    const { error: updateError } = await supabase
        .from('users')
        .update({
            id: data.user.id,
            username: fullName?.replace(/\s/g, '') || currentUser.username,
            full_name: fullName || currentUser.full_name,
            email: email,
            is_guest: false,
            expiry_date: null,
            verified: true,
            unique_name: email.split('@')[0] + '_' + Math.floor(Math.random() * 1000)
        })
        .eq('id', currentUser.id);
    if (updateError) {
        console.error(updateError);
        showToast("تم إنشاء الحساب لكن حدث خطأ في الترقية", true);
    } else {
        await supabase.from('users').delete().eq('id', currentUser.id);
    }
    localStorage.setItem('currentUser', JSON.stringify({
        id: data.user.id,
        username: fullName?.replace(/\s/g, '') || currentUser.username,
        email: email,
        avatar: currentUser.avatar,
        is_guest: false,
        verified: true
    }));
    localStorage.removeItem('guestUser');
    showToast("🎉 تم توثيق حسابك بنجاح! يمكنك الآن استخدام جميع الميزات.");
    setTimeout(() => window.location.reload(), 1500);
    return true;
}

async function checkGuestValidity(guestUser) {
    if (!guestUser || !guestUser.is_guest) return true;
    if (!guestUser.expiry_date) return true;
    const expiry = new Date(guestUser.expiry_date);
    const now = new Date();
    if (now > expiry) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('guestUser');
        showToast("انتهت صلاحية حساب التجربة. الرجاء تسجيل الدخول أو إنشاء حساب جديد.", true);
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

async function syncUserToDatabase(user) {
    if (!user || user.is_guest) return;
    const { data: existing } = await supabase.from('users').select('id').eq('id', user.id).single();
    if (!existing) {
        let baseUsername = user.user_metadata?.full_name || user.email.split('@')[0];
        baseUsername = baseUsername.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '').substring(0, 20);
        const uniqueName = baseUsername + '_' + Math.floor(Math.random() * 10000);
        const avatar = user.user_metadata?.avatar_url || `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 10) + 1}.jpg`;
        await supabase.from('users').insert({
            id: user.id,
            username: baseUsername,
            full_name: user.user_metadata?.full_name || baseUsername,
            bio: 'مرحباً، أنا مستخدم جديد في Ramz-X',
            avatar: avatar,
            unique_name: uniqueName,
            followers_count: 0,
            following_count: 0,
            social: {},
            is_guest: false,
            verified: false
        });
    }
    const { data: finalUser } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (finalUser) localStorage.setItem('currentUser', JSON.stringify(finalUser));
}

async function checkSession() {
    clearInvalidGuestAccount();
    let currentUser = null;
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            if (currentUser.is_guest) {
                if (!isValidUUID(currentUser.id)) {
                    console.warn("UUID غير صالح للمستخدم الضيف، يتم إنشاء حساب جديد");
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('guestUser');
                    const newGuest = await createGuestUser();
                    return newGuest;
                }
                const isValid = await checkGuestValidity(currentUser);
                if (!isValid) return null;
                return currentUser;
            }
        } catch(e) {}
    }
    if (!currentUser) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error("خطأ في الجلسة:", error);
        if (session) {
            const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
            let user = profile;
            if (!user) {
                await syncUserToDatabase(session.user);
                const { data: newProfile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                user = newProfile;
            }
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                currentUser = user;
            }
        }
    }
    if (!currentUser) {
        currentUser = await createGuestUser();
    }
    if (currentUser) {
        currentUserId = currentUser.id;
        if (window.enableRealtime === true) {
            if (globalNotificationsChannel) globalNotificationsChannel.unsubscribe();
            if (globalMessagesChannel) globalMessagesChannel.unsubscribe();
            globalNotificationsChannel = supabase
                .channel('notifications-channel')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${currentUserId}`
                }, (payload) => {
                    console.log('🔔 إشعار جديد:', payload.new);
                    showToast(`🔔 ${payload.new.message || 'لديك إشعار جديد'}`, false);
                    playNotificationSound();
                    if (window.updateUnreadBadge) window.updateUnreadBadge();
                    if (window.renderNotificationsTab) window.renderNotificationsTab();
                })
                .subscribe();
            globalMessagesChannel = supabase
                .channel('messages-channel')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUserId}`
                }, (payload) => {
                    console.log('💬 رسالة جديدة:', payload.new);
                    if (window.renderConversations) window.renderConversations();
                    playNotificationSound();
                    if (document.getElementById('notifBadge')) {
                        let badge = document.getElementById('notifBadge');
                        let current = parseInt(badge.innerText) || 0;
                        badge.innerText = current + 1;
                        badge.style.display = 'inline-block';
                    }
                })
                .subscribe();
        }
    }
    return currentUser;
}

// ================== دوال RPC الأساسية ==================
async function incrementLikes(rowId) { try { await supabase.rpc('increment_likes', { row_id: rowId }); } catch(e) {} }
async function decrementLikes(rowId) { try { await supabase.rpc('decrement_likes', { row_id: rowId }); } catch(e) {} }
async function incrementFavorites(rowId) { try { await supabase.rpc('increment_favorites', { row_id: rowId }); } catch(e) {} }
async function decrementFavorites(rowId) { try { await supabase.rpc('decrement_favorites', { row_id: rowId }); } catch(e) {} }
async function incrementReposts(rowId) { try { await supabase.rpc('increment_reposts', { row_id: rowId }); } catch(e) {} }
async function decrementReposts(rowId) { try { await supabase.rpc('decrement_reposts', { row_id: rowId }); } catch(e) {} }
async function incrementViews(rowId) { try { await supabase.rpc('increment_views', { row_id: rowId }); } catch(e) {} }
async function incrementCommentsCount(rowId) { try { await supabase.rpc('increment_comments_count', { row_id: rowId }); } catch(e) {} }
async function incrementCommentLikes(commentId) { try { await supabase.rpc('increment_comment_likes', { comment_id: commentId }); } catch(e) {} }
async function decrementCommentLikes(commentId) { try { await supabase.rpc('decrement_comment_likes', { comment_id: commentId }); } catch(e) {} }
async function incrementPostBoost(rowId) { try { await supabase.rpc('increment_post_boost', { row_id: rowId }); } catch(e) {} }

// ================== تسجيل النشاط والاهتمامات ==================
async function logUserActivity(userId, postId, activityType) {
    if (!userId || !postId) return;
    const { data: existing } = await supabase
        .from('user_post_activity')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('activity_type', activityType)
        .single();
    if (!existing) {
        await supabase.from('user_post_activity').insert({
            user_id: userId,
            post_id: postId,
            activity_type: activityType,
            created_at: new Date().toISOString()
        });
        await updateUserInterest(userId, postId, activityType);
    }
}

async function updateUserInterest(userId, postId, activityType) {
    const { data: post } = await supabase.from('posts').select('category').eq('id', postId).single();
    if (!post || !post.category) return;
    let weight = 0;
    switch (activityType) {
        case 'like': weight = 2; break;
        case 'comment': weight = 3; break;
        case 'favorite': weight = 4; break;
        case 'repost': weight = 5; break;
        case 'view': weight = 1; break;
        default: return;
    }
    const { data: existing } = await supabase
        .from('user_interests')
        .select('score')
        .eq('user_id', userId)
        .eq('category', post.category)
        .single();
    if (existing) {
        await supabase.from('user_interests')
            .update({ score: existing.score + weight, updated_at: new Date().toISOString() })
            .eq('user_id', userId).eq('category', post.category);
    } else {
        await supabase.from('user_interests').insert({
            user_id: userId,
            category: post.category,
            score: weight,
            updated_at: new Date().toISOString()
        });
    }
}

// ================== جلب التغذية ==================
let feedLastCursor = null;
let feedHasMore = true;
let feedIsLoading = false;

async function fetchFeedPage(limit = 10) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    if (feedIsLoading) return [];
    feedIsLoading = true;
    try {
        let query = supabase
            .from('posts')
            .select(`
                id, title, content, image, author_id, author_name, created_at,
                likes_count, comments_count, views_count, reposts_count, favorites_count,
                hashtag, category, type, boost_score,
                users:author_id (id, username, avatar)
            `)
            .eq('hidden', false)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (feedLastCursor) {
            query = query.lt('created_at', feedLastCursor);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) {
            feedHasMore = false;
            return [];
        }
        feedLastCursor = data[data.length - 1].created_at;
        
        const formatted = data.map(p => ({
            id: p.id,
            title: p.title,
            content: p.content,
            image: p.image,
            author_id: p.author_id,
            author_name: p.users?.username || p.author_name,
            author_avatar: p.users?.avatar,
            created_at: p.created_at,
            likes_count: p.likes_count,
            comments_count: p.comments_count,
            views_count: p.views_count,
            reposts_count: p.reposts_count,
            favorites_count: p.favorites_count,
            hashtag: p.hashtag,
            category: p.category,
            type: p.type,
            boost_score: p.boost_score
        }));
        
        for (let post of formatted) {
            await logUserActivity(user.id, post.id, 'view');
        }
        return formatted;
    } catch (err) {
        console.error("خطأ في جلب التغذية:", err);
        showToast("حدث خطأ أثناء تحميل التغذية", true);
        return [];
    } finally {
        feedIsLoading = false;
    }
}

function resetFeedCursor() {
    feedLastCursor = null;
    feedHasMore = true;
}

async function fetchLatestPosts(limit = 15) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                id, title, content, image, author_id, author_name, created_at,
                likes_count, comments_count, views_count, reposts_count, favorites_count,
                hashtag, category, type, boost_score,
                users:author_id (id, username, avatar)
            `)
            .eq('hidden', false)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        if (!data) return [];
        return data.map(p => ({
            id: p.id,
            title: p.title,
            content: p.content,
            image: p.image,
            author_id: p.author_id,
            author_name: p.users?.username || p.author_name,
            author_avatar: p.users?.avatar,
            created_at: p.created_at,
            likes_count: p.likes_count,
            comments_count: p.comments_count,
            views_count: p.views_count,
            reposts_count: p.reposts_count,
            favorites_count: p.favorites_count,
            hashtag: p.hashtag,
            category: p.category,
            type: p.type,
            boost_score: p.boost_score
        }));
    } catch (err) {
        console.error("خطأ في جلب أحدث المنشورات:", err);
        return [];
    }
}

async function fetchFeed() {
    resetFeedCursor();
    return await fetchFeedPage(10);
}

// ================== دوال المحادثات ==================
let chatsLastCursor = null;
let chatsHasMore = true;
let chatsIsLoading = false;

async function fetchConversationsPage(limit = 15) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    let query = supabase
        .from('messages')
        .select(`
            id, text, image, created_at, read,
            sender:sender_id (id, username, avatar),
            receiver:receiver_id (id, username, avatar)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
    if (chatsLastCursor) {
        query = query.lt('created_at', chatsLastCursor);
    }
    const { data, error } = await query.limit(limit);
    if (error) {
        console.error("خطأ في جلب المحادثات:", error);
        return [];
    }
    if (data.length < limit) chatsHasMore = false;
    if (data.length > 0) chatsLastCursor = data[data.length - 1].created_at;
    
    const convMap = new Map();
    for (let msg of data) {
        const other = (msg.sender.id === user.id) ? msg.receiver : msg.sender;
        if (!convMap.has(other.id)) {
            convMap.set(other.id, {
                id: other.id,
                name: other.username,
                avatar: other.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
                lastMessage: msg.text || (msg.image ? '📷 صورة' : ''),
                lastTime: msg.created_at,
                unread: (msg.receiver.id === user.id && !msg.read) ? 1 : 0
            });
        } else if (msg.receiver.id === user.id && !msg.read) {
            convMap.get(other.id).unread++;
        }
    }
    const convs = Array.from(convMap.values());
    convs.sort((a,b) => new Date(b.lastTime) - new Date(a.lastTime));
    return convs;
}

function resetChatsCursor() {
    chatsLastCursor = null;
    chatsHasMore = true;
}

async function fetchPrivateMessages(otherUserId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
    if (error) return [];
    return data.map(m => ({
        id: m.id,
        text: m.text,
        sender: m.sender_id === user.id ? 'me' : 'other',
        time: new Date(m.created_at).toLocaleTimeString(),
        image: m.image,
        replyTo: m.reply_to
    }));
}

async function sendPrivateMessage(receiverId, text, image = null) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return false;
    const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: receiverId,
        text: text,
        image: image,
        read: false,
        created_at: new Date().toISOString()
    });
    if (!error) {
        await createNotification(receiverId, 'private_message', user.id, null, null, null, `لديك رسالة جديدة من ${user.username}`);
    }
    return !error;
}

// ================== دوال الإشعارات ==================
let notifLastCursor = null;
let notifHasMore = true;
let notifIsLoading = false;

async function fetchNotificationsPage(limit = 20) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    let query = supabase
        .from('notifications')
        .select('*, actor:actor_id (id, username, avatar)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    if (notifLastCursor) {
        query = query.lt('created_at', notifLastCursor);
    }
    const { data, error } = await query.limit(limit);
    if (error) {
        console.error("خطأ في جلب الإشعارات:", error);
        return [];
    }
    if (data.length < limit) notifHasMore = false;
    if (data.length > 0) notifLastCursor = data[data.length - 1].created_at;
    return data;
}

function resetNotificationsCursor() {
    notifLastCursor = null;
    notifHasMore = true;
}

async function createNotification(userId, type, actorId, postId = null, storyId = null, groupId = null, customMessage = null, commentId = null) {
    const { data: actor } = await supabase.from('users').select('username').eq('id', actorId).single();
    const actorName = actor?.username || 'مستخدم';
    let message = customMessage;
    if (!message) {
        switch(type) {
            case 'like': message = `${actorName} أعجب بمنشورك`; break;
            case 'comment': message = `${actorName} علق على منشورك`; break;
            case 'comment_like': message = `${actorName} أعجب بتعليقك`; break;
            case 'favorite': message = `${actorName} أضاف منشورك إلى مفضلاته`; break;
            case 'repost': message = `${actorName} أعاد نشر منشورك`; break;
            case 'follow': message = `${actorName} بدأ متابعتك`; break;
            case 'follow_request': message = `${actorName} طلب متابعتك`; break;
            case 'story': message = `${actorName} شارك قصة جديدة`; break;
            case 'new_post': message = `${actorName} نشر منشوراً جديداً`; break;
            case 'profile_update': message = `${actorName} غيّر صورة ملفه الشخصي`; break;
            case 'private_message': message = `${actorName} أرسل لك رسالة جديدة`; break;
            default: message = `${actorName} تفاعل مع محتواك`;
        }
    }
    const { error } = await supabase.from('notifications').insert({
        user_id: userId, type: type, actor_id: actorId, post_id: postId, story_id: storyId, group_id: groupId, comment_id: commentId,
        message: message, is_read: false, created_at: new Date().toISOString()
    });
    if (error) console.error("فشل إنشاء الإشعار:", error);
}

async function markNotificationAsRead(notifId) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
}

async function getUnreadNotificationsCount(userId) {
    const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    if (error) return 0;
    return count;
}

// ================== دوال المستخدمين ==================
let usersLastId = null;
let usersHasMore = true;
let usersIsLoading = false;

async function fetchUsersPage(limit = 20, sortBy = 'friends', searchQuery = '') {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    let query = supabase.from('users').select('*');
    if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
    }
    query = query.neq('id', user.id);
    if (sortBy === 'friends') {
        query = query.order('last_seen', { ascending: false });
    } else if (sortBy === 'popular') {
        query = query.order('followers_count', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }
    if (usersLastId) {
        query = query.lt('id', usersLastId);
    }
    const { data, error } = await query.limit(limit);
    if (error) return [];
    if (data.length < limit) usersHasMore = false;
    if (data.length > 0) usersLastId = data[data.length - 1].id;
    return data;
}

function resetUsersCursor() {
    usersLastId = null;
    usersHasMore = true;
}

// ================== دوال المجموعات ==================
let groupsLastCursor = null;
let groupsHasMore = true;
let groupsIsLoading = false;

async function fetchGroupsPage(limit = 10) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    const { data: membership, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
    if (error || !membership.length) return [];
    const groupIds = membership.map(m => m.group_id);
    let query = supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });
    if (groupsLastCursor) {
        query = query.lt('created_at', groupsLastCursor);
    }
    const { data, error: groupsError } = await query.limit(limit);
    if (groupsError) return [];
    if (data.length < limit) groupsHasMore = false;
    if (data.length > 0) groupsLastCursor = data[data.length - 1].created_at;
    return data;
}

function resetGroupsCursor() {
    groupsLastCursor = null;
    groupsHasMore = true;
}

async function createGroup(name, memberIds) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return null;
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({ name: name, created_by: user.id, created_at: new Date().toISOString() })
        .select()
        .single();
    if (groupError) return null;
    const members = [...new Set([user.id, ...memberIds])];
    const membersInsert = members.map(uid => ({ group_id: group.id, user_id: uid }));
    const { error: membersError } = await supabase.from('group_members').insert(membersInsert);
    if (membersError) return null;
    return group;
}

async function sendGroupMessage(groupId, text, image = null) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return false;
    const { error } = await supabase.from('group_messages').insert({
        group_id: groupId,
        sender_id: user.id,
        text: text,
        image: image,
        created_at: new Date().toISOString()
    });
    if (!error) {
        const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', groupId);
        if (members) {
            for (let m of members) {
                if (m.user_id !== user.id) {
                    await createNotification(m.user_id, 'group_message', user.id, null, null, groupId, `رسالة جديدة في مجموعة ${groupId}`);
                }
            }
        }
    }
    return !error;
}

async function fetchGroupMessages(groupId) {
    const { data, error } = await supabase
        .from('group_messages')
        .select('*, sender:sender_id (id, username, avatar)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
    if (error) return [];
    return data;
}

// ================== دوال القصص ==================
async function fetchStories() {
    const { data, error } = await supabase
        .from('stories')
        .select('*, users:user_id (id, username, avatar)')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
    if (error) return [];
    return data;
}

async function createStory(mediaFile, text) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return false;
    let mediaUrl = null;
    if (mediaFile) {
        const ext = mediaFile.name.split('.').pop();
        const fileName = `stories/${Date.now()}_${Math.random().toString(36)}.${ext}`;
        const { data, error } = await supabase.storage
            .from('ramz-x-images')
            .upload(fileName, mediaFile);
        if (!error) mediaUrl = SUPABASE_URL + "/storage/v1/object/public/ramz-x-images/" + fileName;
    }
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const { error } = await supabase.from('stories').insert({
        user_id: user.id,
        media_url: mediaUrl,
        text: text || '',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
    });
    if (!error) {
        await createNotification(user.id, 'story', user.id, null, null, null, `أنت شاركت قصة جديدة`);
    }
    return !error;
}

// ================== دوال طلبات المتابعة ==================
async function sendFollowRequest(receiverId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return false;
    const { error } = await supabase.from('follow_requests').insert({ sender_id: user.id, receiver_id: receiverId });
    if (!error) {
        await createNotification(receiverId, 'follow_request', user.id, null, null, null, `${user.username} طلب متابعتك`);
    }
    return !error;
}

async function getFollowRequests() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    const { data, error } = await supabase
        .from('follow_requests')
        .select('*, sender:sender_id (id, username, avatar)')
        .eq('receiver_id', user.id);
    if (error) return [];
    return data;
}

async function acceptFollowRequest(requestId, senderId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;
    await supabase.from('follow_requests').delete().eq('id', requestId);
    await supabase.from('follows').insert({ follower_id: senderId, following_id: user.id });
    await createNotification(senderId, 'follow', user.id, null, null, null, `${user.username} قبل طلب متابعتك`);
}

async function rejectFollowRequest(requestId) {
    await supabase.from('follow_requests').delete().eq('id', requestId);
}

// ================== دوال إعدادات الإشعارات ==================
async function getNotificationSettings() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return {};
    const { data, error } = await supabase
        .from('notification_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single();
    if (error) {
        const defaultSettings = {
            like: true, comment: true, favorite: true, repost: true, follow: true,
            follow_request: true, story: true, new_post: true, profile_update: true,
            group_message: true, private_message: true, sound_enabled: true
        };
        await supabase.from('notification_settings').insert({ user_id: user.id, settings: defaultSettings });
        return defaultSettings;
    }
    return data.settings;
}

async function updateNotificationSetting(settingKey, value) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;
    const current = await getNotificationSettings();
    current[settingKey] = value;
    await supabase.from('notification_settings').update({ settings: current }).eq('user_id', user.id);
}

// ================== دوال التفاعلات الأساسية ==================
async function toggleLike(postId, btnElement) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { showToast('يجب تسجيل الدخول', true); return; }
    const isLiked = btnElement.classList.contains('liked');
    if (!isLiked) {
        await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
        await incrementLikes(postId);
        btnElement.classList.add('liked');
        const countSpan = btnElement.querySelector('.count');
        if (countSpan) {
            let current = parseInt(countSpan.innerText.replace(/[^0-9]/g, ''));
            countSpan.innerText = formatNumber(current + 1);
        }
        showToast('👍 تم الإعجاب');
        await logUserActivity(user.id, postId, 'like');
        const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single();
        if (post && post.author_id !== user.id) {
            await createNotification(post.author_id, 'like', user.id, postId);
        }
    } else {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
        await decrementLikes(postId);
        btnElement.classList.remove('liked');
        const countSpan = btnElement.querySelector('.count');
        if (countSpan) {
            let current = parseInt(countSpan.innerText.replace(/[^0-9]/g, ''));
            countSpan.innerText = formatNumber(Math.max(0, current - 1));
        }
        showToast('👎 تم إلغاء الإعجاب');
    }
}

async function toggleFavorite(postId, btnElement) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { showToast('يجب تسجيل الدخول', true); return; }
    const isFav = btnElement.classList.contains('favorited');
    if (!isFav) {
        await supabase.from('favorites').insert({ user_id: user.id, post_id: postId });
        await incrementFavorites(postId);
        btnElement.classList.add('favorited');
        btnElement.querySelector('i').className = 'fas fa-star';
        const countSpan = btnElement.querySelector('span:last-child');
        if (countSpan) {
            let current = parseInt(countSpan.innerText.replace(/[^0-9]/g, ''));
            countSpan.innerText = formatNumber(current + 1);
        }
        showToast('⭐ أضيف إلى المفضلة');
        await logUserActivity(user.id, postId, 'favorite');
        const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single();
        if (post && post.author_id !== user.id) {
            await createNotification(post.author_id, 'favorite', user.id, postId);
        }
    } else {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('post_id', postId);
        await decrementFavorites(postId);
        btnElement.classList.remove('favorited');
        btnElement.querySelector('i').className = 'far fa-star';
        const countSpan = btnElement.querySelector('span:last-child');
        if (countSpan) {
            let current = parseInt(countSpan.innerText.replace(/[^0-9]/g, ''));
            countSpan.innerText = formatNumber(Math.max(0, current - 1));
        }
        showToast('⭐ تمت إزالة من المفضلة');
    }
}

async function toggleRepost(postId, btnElement) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { showToast('يجب تسجيل الدخول', true); return; }
    const isReposted = btnElement.classList.contains('reposted');
    if (!isReposted) {
        const { data: original } = await supabase.from('posts').select('*').eq('id', postId).single();
        if (!original) return;
        const newPost = {
            title: original.title,
            content: `🔄 أعاد ${user.username} نشر منشور ${original.author_name}\n\n${original.content}`,
            image: original.image,
            author_id: user.id,
            author_name: user.username,
            likes_count: 0,
            comments_count: 0,
            views_count: 0,
            reposts_count: 0,
            favorites_count: 0,
            edit_count: 0,
            hashtag: original.hashtag,
            category: original.category,
            type: original.type,
            hidden: false,
            created_at: new Date().toISOString()
        };
        await supabase.from('posts').insert(newPost);
        await incrementReposts(postId);
        btnElement.classList.add('reposted');
        const countSpan = btnElement.querySelector('.repost-count');
        if (countSpan) {
            let current = parseInt(countSpan.innerText.replace(/[^0-9]/g, ''));
            countSpan.innerText = formatNumber(current + 1);
        }
        showToast('🔁 تمت إعادة النشر');
        await logUserActivity(user.id, postId, 'repost');
        if (original.author_id !== user.id) {
            await createNotification(original.author_id, 'repost', user.id, postId);
        }
    } else {
        const { data: repostedPost } = await supabase.from('posts').select('id').eq('author_id', user.id).contains('content', `🔄 أعاد ${user.username} نشر منشور`).order('created_at', { ascending: false }).limit(1).single();
        if (repostedPost) {
            await supabase.from('posts').delete().eq('id', repostedPost.id);
        }
        await decrementReposts(postId);
        btnElement.classList.remove('reposted');
        const countSpan = btnElement.querySelector('.repost-count');
        if (countSpan) {
            let current = parseInt(countSpan.innerText.replace(/[^0-9]/g, ''));
            countSpan.innerText = formatNumber(Math.max(0, current - 1));
        }
        showToast('↩️ تم إلغاء إعادة النشر');
    }
}

async function toggleFollow(authorId, btnElement) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { showToast('يجب تسجيل الدخول', true); return; }
    const isFollowing = btnElement.innerText === 'متابَع';
    if (!isFollowing) {
        const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: authorId });
        if (error) { showToast(error.message, true); return; }
        btnElement.innerText = 'متابَع';
        btnElement.classList.add('following');
        showToast('✅ تمت متابعة المستخدم');
        await createNotification(authorId, 'follow', user.id, null, null, null, `${user.username} بدأ متابعتك`);
    } else {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', authorId);
        btnElement.innerText = 'متابعة';
        btnElement.classList.remove('following');
        showToast('✅ تم إلغاء المتابعة');
    }
}

// ================== دوال المنشورات والتعليقات ==================
async function createPost(postData) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { showToast('يجب تسجيل الدخول', true); return false; }
    if (!user.id) {
        showToast("خطأ: معرف المستخدم غير موجود. الرجاء تسجيل الخروج ثم الدخول مجدداً.", true);
        return false;
    }
    const newPost = {
        title: postData.title,
        content: postData.content,
        image: postData.image || "https://picsum.photos/id/1/1200/800",
        author_id: user.id,
        author_name: user.username || user.full_name,
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        reposts_count: 0,
        favorites_count: 0,
        edit_count: 0,
        hashtag: postData.hashtag || '',
        category: postData.category || 'عام',
        type: postData.type || 'article',
        hidden: false,
        created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('posts').insert(newPost);
    if (error) { 
        console.error("خطأ في النشر:", error);
        if (error.message && error.message.includes("duplicate key")) {
            showToast("حدث تعارض في المعرف. حاول مرة أخرى أو أعد تحميل الصفحة.", true);
        } else {
            showToast(error.message, true);
        }
        return false; 
    }
    showToast("🎉 تم نشر المنشور بنجاح!");
    return true;
}

async function fetchComments(postId) {
    const { data, error } = await supabase
        .from('comments')
        .select('*, users:user_id (username, avatar)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
    if (error) {
        showToast(error.message, true);
        return [];
    }
    return data.map(c => ({ id: c.id, text: c.text, user_id: c.user_id, likes: c.likes || 0, users: c.users, created_at: c.created_at }));
}

async function addComment(postId, text, parentCommentId = null) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { showToast('يجب تسجيل الدخول', true); return false; }
    const { error } = await supabase.from('comments').insert({ 
        post_id: postId, 
        user_id: user.id, 
        text: text, 
        likes: 0, 
        parent_id: parentCommentId,
        created_at: new Date().toISOString() 
    });
    if (error) { showToast(error.message, true); return false; }
    await incrementCommentsCount(postId);
    showToast('💬 تم إضافة التعليق');
    await logUserActivity(user.id, postId, 'comment');
    const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single();
    if (post && post.author_id !== user.id) {
        await createNotification(post.author_id, 'comment', user.id, postId);
    }
    return true;
}

async function toggleCommentLike(commentId, btnElement, postId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { showToast('يجب تسجيل الدخول', true); return; }
    const isLiked = btnElement.classList.contains('liked');
    if (!isLiked) {
        await supabase.from('comment_likes').insert({ user_id: user.id, comment_id: commentId });
        await incrementCommentLikes(commentId);
        btnElement.classList.add('liked');
        const currentLikes = parseInt(btnElement.innerText.match(/\d+/)?.[0] || 0);
        btnElement.innerText = `❤️ ${currentLikes + 1}`;
        const { data: comment } = await supabase.from('comments').select('user_id').eq('id', commentId).single();
        if (comment && comment.user_id !== user.id) {
            await createNotification(comment.user_id, 'comment_like', user.id, postId, null, null, null, commentId);
        }
    } else {
        await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', commentId);
        await decrementCommentLikes(commentId);
        btnElement.classList.remove('liked');
        const currentLikes = parseInt(btnElement.innerText.match(/\d+/)?.[0] || 0);
        btnElement.innerText = `❤️ ${Math.max(0, currentLikes - 1)}`;
    }
}

async function getUserInteractions(postIds) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !postIds.length) return { likes: {}, favorites: {}, reposts: {}, follows: new Set() };
    const { data: likes } = await supabase.from('likes').select('post_id').eq('user_id', currentUser.id).in('post_id', postIds);
    const { data: favs } = await supabase.from('favorites').select('post_id').eq('user_id', currentUser.id).in('post_id', postIds);
    const { data: reps } = await supabase.from('reposts').select('post_id').eq('user_id', currentUser.id).in('post_id', postIds);
    const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', currentUser.id);
    const likesMap = {}; likes?.forEach(l => likesMap[l.post_id] = true);
    const favsMap = {}; favs?.forEach(f => favsMap[f.post_id] = true);
    const repsMap = {}; reps?.forEach(r => repsMap[r.post_id] = true);
    const followsSet = new Set(follows?.map(f => f.following_id) || []);
    return { likes: likesMap, favorites: favsMap, reposts: repsMap, follows: followsSet };
}

async function incrementPostViews(postId) { await incrementViews(postId); }

// ================== دوال رفع الملفات ==================
async function uploadFile(file, folder = 'general') {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36)}.${fileExt}`;
    const { data, error } = await supabase.storage
        .from('ramz-x-images')
        .upload(fileName, file);
    if (error) {
        showToast(error.message, true);
        return null;
    }
    const { data: { publicUrl } } = supabase.storage
        .from('ramz-x-images')
        .getPublicUrl(fileName);
    return publicUrl;
}

// ================== دوال متفرقة ==================
window.showEmojiPicker = function(callback) {
    let modal = document.getElementById('emojiPickerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'emojiPickerModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content"><div class="modal-header"><h3>😀 اختر إيموجي</h3><i class="fas fa-times close-modal" data-close="emojiPickerModal"></i></div><div id="globalEmojiContainer" style="direction:ltr;text-align:left;"></div></div>`;
        document.body.appendChild(modal);
        modal.querySelector('.close-modal').addEventListener('click', () => modal.classList.remove('open'));
    }
    const container = document.getElementById('globalEmojiContainer');
    if (container && typeof EmojiMartAwesome !== 'undefined') {
        container.innerHTML = '';
        const picker = new EmojiMartAwesome.Picker({
            onSelect: (emoji) => {
                if (callback) callback(emoji.native);
                modal.classList.remove('open');
            }
        });
        container.appendChild(picker);
    }
    modal.classList.add('open');
};

window.enhanceImageWithAI = async function(imageUrl, mode = 'upscale') {
    return imageUrl;
};

// ================== دوال الإبلاغ والتذكير ==================
async function reportPost(postId, reason) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { showToast('يجب تسجيل الدخول', true); return false; }
    const { data, error } = await supabase.rpc('report_post', {
        p_post_id: postId,
        p_reporter_id: user.id,
        p_reason: reason
    });
    if (error) { showToast(error.message, true); return false; }
    if (data && data.success) {
        showToast(data.message, false);
        return true;
    } else {
        showToast(data?.message || 'حدث خطأ', true);
        return false;
    }
}

async function promotePost(postId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { showToast('يجب تسجيل الدخول', true); return false; }
    const { data, error } = await supabase.rpc('promote_post', {
        p_post_id: postId,
        p_user_id: user.id
    });
    if (error) { showToast(error.message, true); return false; }
    if (data && data.success) {
        showToast(data.message, false);
        return true;
    } else {
        showToast(data?.message || 'حدث خطأ', true);
        return false;
    }
}

// ================== دوال المسودات السحابية ==================
async function saveDraftToDB(draftData) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return null;
    const { data, error } = await supabase
        .from('drafts')
        .upsert({
            id: draftData.id || crypto.randomUUID(),
            user_id: user.id,
            title: draftData.title,
            content: draftData.content,
            image: draftData.image,
            hashtag: draftData.hashtag,
            category: draftData.category,
            poll: draftData.poll,
            location: draftData.location,
            challenge: draftData.challenge,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();
    if (error) {
        console.error("خطأ في حفظ المسودة في DB:", error);
        return null;
    }
    return data;
}

async function fetchDraftsFromDB() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
    if (error) {
        console.error("خطأ في جلب المسودات من DB:", error);
        return [];
    }
    return data;
}

async function deleteDraftFromDB(draftId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return false;
    const { error } = await supabase
        .from('drafts')
        .delete()
        .eq('id', draftId)
        .eq('user_id', user.id);
    if (error) {
        console.error("خطأ في حذف المسودة من DB:", error);
        return false;
    }
    return true;
}

// ================== دوال مزامنة جهات الاتصال ==================
async function syncContacts(contactsArray) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, avatar, phone')
        .in('phone', contactsArray);
    if (error) return [];
    await supabase.from('users').update({ contacts_synced_at: new Date().toISOString() }).eq('id', user.id);
    return data;
}

// ================== نظام مراقبة جودة الاتصال بالإنترنت ==================
let connectionQuality = 'unknown';
let networkMonitorInterval = null;
let networkMonitoringActive = true;
let currentSpeedMbps = 0;

function showNetworkNotification(message, type = 'info') {
    let color = '#1f1f1f';
    let borderColor = '#fe2c55';
    if (type === 'error') { color = '#dc2626'; borderColor = '#dc2626'; }
    else if (type === 'warning') { color = '#f59e0b'; borderColor = '#f59e0b'; }
    else if (type === 'success') { color = '#10b981'; borderColor = '#10b981'; }
    const toast = document.getElementById('globalToast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = color;
    toast.style.borderLeftColor = borderColor;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 5000);
}

async function measureNetworkSpeed() {
    if (!navigator.onLine) {
        currentSpeedMbps = 0;
        return 0;
    }
    const startTime = performance.now();
    try {
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = `https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png?t=${Date.now()}`;
        });
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        const fileSizeKb = 5;
        const speedKbps = (fileSizeKb * 8) / duration;
        const speedMbps = speedKbps / 1000;
        currentSpeedMbps = speedMbps;
        return speedMbps;
    } catch (err) {
        console.warn("فشل قياس سرعة الشبكة:", err);
        currentSpeedMbps = 0;
        return 0;
    }
}

function updateConnectionQuality(speedMbps, isOnline) {
    if (!isOnline) {
        connectionQuality = 'offline';
        showNetworkNotification('❌ لا يوجد اتصال بالإنترنت. الرجاء التحقق من الشبكة', 'error');
        return;
    }
    if (speedMbps === 0) {
        if (connectionQuality !== 'poor') {
            connectionQuality = 'poor';
            showNetworkNotification('⚠️ الشبكة ضعيفة جداً، قد يكون التحميل بطيئاً أو غير مستقر', 'warning');
        }
        return;
    }
    if (speedMbps > 1.5) {
        if (connectionQuality !== 'good') {
            connectionQuality = 'good';
            showNetworkNotification('✅ تم الاتصال بالشبكة (جودة جيدة)', 'success');
        }
    } else if (speedMbps > 0.5) {
        if (connectionQuality !== 'slow') {
            connectionQuality = 'slow';
            showNetworkNotification('📡 الشبكة بطيئة (قد تزيد مدة التحميل)', 'warning');
        }
    } else {
        if (connectionQuality !== 'poor') {
            connectionQuality = 'poor';
            showNetworkNotification('⚠️ الشبكة ضعيفة جداً، قد لا تعمل بعض الميزات', 'warning');
        }
    }
}

async function checkNetworkAndSpeed() {
    const isOnline = navigator.onLine;
    if (!isOnline) {
        if (connectionQuality !== 'offline') {
            connectionQuality = 'offline';
            showNetworkNotification('❌ فقد الاتصال بالإنترنت. بعض الميزات غير متاحة', 'error');
        }
        return;
    }
    const speed = await measureNetworkSpeed();
    updateConnectionQuality(speed, true);
}

function startNetworkMonitoring(intervalSeconds = 30) {
    if (networkMonitorInterval) clearInterval(networkMonitorInterval);
    checkNetworkAndSpeed();
    networkMonitorInterval = setInterval(() => {
        if (networkMonitoringActive) {
            checkNetworkAndSpeed();
        }
    }, intervalSeconds * 1000);
    window.addEventListener('online', () => {
        showNetworkNotification('✅ تم الاتصال بالشبكة، جاري التحقق من الجودة...', 'success');
        setTimeout(() => checkNetworkAndSpeed(), 1000);
    });
    window.addEventListener('offline', () => {
        connectionQuality = 'offline';
        showNetworkNotification('❌ انقطع الاتصال بالإنترنت. الرجاء المحاولة لاحقاً', 'error');
    });
}

function stopNetworkMonitoring() {
    if (networkMonitorInterval) clearInterval(networkMonitorInterval);
    networkMonitorInterval = null;
}

async function checkNetworkBeforeAction(actionName = 'العملية') {
    if (!navigator.onLine) {
        showNetworkNotification(`❌ لا يمكن تنفيذ "${actionName}" لأنك غير متصل بالإنترنت`, 'error');
        return false;
    }
    if (connectionQuality === 'poor' || connectionQuality === 'slow') {
        return confirm(`⚠️ سرعة الشبكة حالياً ضعيفة جداً. قد تستغرق "${actionName}" وقتاً أطول. هل تريد المتابعة؟`);
    }
    return true;
}

function getConnectionQuality() { return connectionQuality; }

// ================== دوال القنوات المباشرة ==================
window.subscribeToRealtime = function() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        console.warn("لا يمكن الاشتراك قبل تسجيل الدخول");
        return;
    }
    if (window._notificationsChannel) window._notificationsChannel.unsubscribe();
    if (window._messagesChannel) window._messagesChannel.unsubscribe();

    window._notificationsChannel = supabase
        .channel('notifications-channel')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
        }, (payload) => {
            console.log('🔔 إشعار جديد:', payload.new);
            showToast(`🔔 ${payload.new.message || 'لديك إشعار جديد'}`, false);
            playNotificationSound();
            if (window.renderNotificationsTab) window.renderNotificationsTab();
        })
        .subscribe();

    window._messagesChannel = supabase
        .channel('messages-channel')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
        }, (payload) => {
            console.log('💬 رسالة جديدة:', payload.new);
            if (window.renderConversations) window.renderConversations();
            playNotificationSound();
        })
        .subscribe();
};

// ================== إصلاح مشكلة "Maximum call stack size exceeded" ==================
function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

let isUpdating = false;
function safeUpdate(callback) {
    if (isUpdating) return;
    isUpdating = true;
    try {
        callback();
    } catch (e) {
        console.error("خطأ في safeUpdate:", e);
    } finally {
        setTimeout(() => { isUpdating = false; }, 0);
    }
}

const safeFetchFeed = debounce(async () => {
    safeUpdate(async () => {
        await fetchFeed();
    });
}, 300);

// ================== تصدير الدوال للنطاق العام ==================
window.showToast = showToast;
window.showProgress = showProgress;
window.formatNumber = formatNumber;
window.escapeHtml = escapeHtml;
window.timeAgo = timeAgo;
window.initDB = initDB;
window.checkSession = checkSession;
window.createGuestUser = createGuestUser;
window.upgradeGuestToVerified = upgradeGuestToVerified;
window.fetchFeed = fetchFeed;
window.fetchFeedPage = fetchFeedPage;
window.fetchLatestPosts = fetchLatestPosts;
window.resetFeedCursor = resetFeedCursor;
window.getUserInteractions = getUserInteractions;
window.createPost = createPost;
window.toggleLike = toggleLike;
window.toggleFavorite = toggleFavorite;
window.toggleRepost = toggleRepost;
window.toggleFollow = toggleFollow;
window.fetchComments = fetchComments;
window.addComment = addComment;
window.toggleCommentLike = toggleCommentLike;
window.incrementPostViews = incrementPostViews;
window.incrementCommentLikes = incrementCommentLikes;
window.logUserActivity = logUserActivity;
window.uploadFile = uploadFile;
window.reportPost = reportPost;
window.promotePost = promotePost;
window.saveDraftToDB = saveDraftToDB;
window.fetchDraftsFromDB = fetchDraftsFromDB;
window.deleteDraftFromDB = deleteDraftFromDB;
window.syncContacts = syncContacts;
window.startNetworkMonitoring = startNetworkMonitoring;
window.stopNetworkMonitoring = stopNetworkMonitoring;
window.checkNetworkBeforeAction = checkNetworkBeforeAction;
window.measureNetworkSpeed = measureNetworkSpeed;
window.getConnectionQuality = getConnectionQuality;
window.showEmojiPicker = window.showEmojiPicker;
window.enhanceImageWithAI = window.enhanceImageWithAI;
window.fetchConversationsPage = fetchConversationsPage;
window.resetChatsCursor = resetChatsCursor;
window.fetchPrivateMessages = fetchPrivateMessages;
window.sendPrivateMessage = sendPrivateMessage;
window.fetchNotificationsPage = fetchNotificationsPage;
window.resetNotificationsCursor = resetNotificationsCursor;
window.createNotification = createNotification;
window.markNotificationAsRead = markNotificationAsRead;
window.getUnreadNotificationsCount = getUnreadNotificationsCount;
window.fetchUsersPage = fetchUsersPage;
window.resetUsersCursor = resetUsersCursor;
window.fetchGroupsPage = fetchGroupsPage;
window.resetGroupsCursor = resetGroupsCursor;
window.createGroup = createGroup;
window.sendGroupMessage = sendGroupMessage;
window.fetchGroupMessages = fetchGroupMessages;
window.fetchStories = fetchStories;
window.createStory = createStory;
window.sendFollowRequest = sendFollowRequest;
window.getFollowRequests = getFollowRequests;
window.acceptFollowRequest = acceptFollowRequest;
window.rejectFollowRequest = rejectFollowRequest;
window.getNotificationSettings = getNotificationSettings;
window.updateNotificationSetting = updateNotificationSetting;
window.subscribeToRealtime = window.subscribeToRealtime;
window.debounce = debounce;
window.safeUpdate = safeUpdate;
window.safeFetchFeed = safeFetchFeed;

// بدء مراقبة الشبكة تلقائياً بعد تحميل الصفحة
setTimeout(() => {
    startNetworkMonitoring(45);
}, 3000);

// تهيئة الجلسة عند تحميل الصفحة
(async () => {
    await checkSession();
    console.log("✅ common.js جاهز - Ramz-X Platform");
    console.log("📦 الدلو: ramz-x-images");
    console.log("🔗 الرابط: https://zlkpoghjbqtnhzhmmdbw.supabase.co");
})();
