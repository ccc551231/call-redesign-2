<script setup>
import { computed, ref, reactive, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import {
  Paperclip,
  Smile,
  Send,
  CheckCheck,
  X,
  AlertCircle,
  PhoneCall,
  LogOut,
  ThumbsUp,
  ThumbsDown,
  PartyPopper,
} from 'lucide-vue-next';

const props = defineProps({
  mode: {
    type: String,
    default: 'agent',
  },
});

const isAgentMode = computed(() => props.mode === 'agent');
const inputText = ref('');
const showStickers = ref(false);
const chatEndRef = ref(null);
const stickerMenuRef = ref(null);
const fileInputRef = ref(null);
const previewImage = ref(null);
const showFeedbackOverlay = ref(false);
const feedbackSubmitted = ref(false);
const feedbackGlow = ref(null);
let feedbackCloseTimer = null;
const resolveAssetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const stickers = [
  { id: 'pika-front', name: '皮卡正面', url: resolveAssetUrl('/stickers/皮卡正面.png') },
  { id: 'pika-back', name: '皮卡背面', url: resolveAssetUrl('/stickers/皮卡背面.png') },
  { id: 'pika-side', name: '皮卡側面', url: resolveAssetUrl('/stickers/皮卡側面.png') },
  { id: 'pika-happy', name: '皮卡開心', url: resolveAssetUrl('/stickers/皮卡開心.png') },
  { id: 'pika-salute', name: '皮卡敬禮', url: resolveAssetUrl('/stickers/皮卡敬禮.png') },
  { id: 'pika-question', name: '皮卡疑問', url: resolveAssetUrl('/stickers/皮卡疑問.png') },
  { id: 'pika-explain', name: '皮卡說明', url: resolveAssetUrl('/stickers/皮卡說明.png') },
  { id: 'pika-board', name: '皮卡舉牌', url: resolveAssetUrl('/stickers/皮卡舉牌.png') },
];

const chatData = reactive({
  userName: '張曉明',
  caseId: '#HSC-20240320',
  source: 'APP',
  messages: [
    {
      id: 1,
      sender: 'user',
      type: 'text',
      text: '你好，我想詢問關於新竹市今年度的青年租屋補貼。',
      time: '14:15',
      status: 'read',
    },
    {
      id: 2,
      sender: 'agent',
      type: 'text',
      text: '您好！歡迎諮詢新竹市政府客服。關於青年租屋補貼，本年度已於三月份啟動受理。\n\n請問您是想了解目前的「申請進度」還是「申請資格」呢？',
      time: '14:16',
      status: 'read',
    },
    {
      id: 3,
      sender: 'user',
      type: 'text',
      text: '我想先確認申請資格。',
      time: '14:20',
      status: 'unread',
    },
  ],
});

const quickReplies = [
  '您好，已收到您的反映，我先幫您確認。',
  '此案件已轉請相關單位處理，請您稍候。',
  '請提供更詳細的地址、照片或時間資訊，以利後續查查證。',
  '若涉及緊急危安情況，建議您立即撥打 119 或 110。',
  '感謝您的通報，後續若有進度會再主動回覆您。',
];

const headerClass = computed(() =>
  isAgentMode.value ? 'justify-between' : 'justify-end'
);

const scrollToBottom = async () => {
  await nextTick();
  chatEndRef.value?.scrollIntoView({ behavior: 'smooth' });
};

watch(
  () => chatData.messages.length,
  () => {
    scrollToBottom();
  }
);

const getCurrentTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const handleSendMessage = () => {
  if (!inputText.value.trim()) return;

  chatData.messages.push({
    id: Date.now(),
    sender: 'agent',
    type: 'text',
    text: inputText.value,
    time: getCurrentTime(),
    status: 'sent',
  });

  inputText.value = '';
};

const handleSendSticker = (stickerUrl) => {
  chatData.messages.push({
    id: Date.now(),
    sender: 'agent',
    type: 'sticker',
    url: stickerUrl,
    time: getCurrentTime(),
    status: 'sent',
  });

  showStickers.value = false;
};

const handleSendFile = (event) => {
  const [file] = event.target.files || [];

  if (!file) return;

  const isImage = file.type.startsWith('image/');
  const fileUrl = URL.createObjectURL(file);

  chatData.messages.push({
    id: Date.now(),
    sender: 'agent',
    type: isImage ? 'image' : 'file',
    url: fileUrl,
    fileName: file.name,
    fileType: file.type,
    time: getCurrentTime(),
    status: 'sent',
  });

  event.target.value = '';
};

const handleClickOutside = (event) => {
  if (stickerMenuRef.value && !stickerMenuRef.value.contains(event.target)) {
    showStickers.value = false;
  }
};

const openImagePreview = (message) => {
  previewImage.value = {
    url: message.url,
    fileName: message.fileName,
  };
};

const closeImagePreview = () => {
  previewImage.value = null;
};

const clearFeedbackTimer = () => {
  if (feedbackCloseTimer) {
    clearTimeout(feedbackCloseTimer);
    feedbackCloseTimer = null;
  }
};

const resetFeedbackState = () => {
  feedbackSubmitted.value = false;
  feedbackGlow.value = null;
};

const openFeedback = () => {
  clearFeedbackTimer();
  resetFeedbackState();
  showFeedbackOverlay.value = true;
};

const updateGlow = (type) => {
  feedbackGlow.value = type;
};

const clearGlow = () => {
  feedbackGlow.value = null;
};

const submitFinal = (type) => {
  console.log('評價:', type);
  feedbackSubmitted.value = true;
  feedbackGlow.value = type;
  clearFeedbackTimer();
  feedbackCloseTimer = setTimeout(() => {
    exitFull();
  }, 3000);
};

const exitFull = () => {
  clearFeedbackTimer();
  showFeedbackOverlay.value = false;

  setTimeout(() => {
    resetFeedbackState();
  }, 600);
};

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    if (previewImage.value) {
      closeImagePreview();
      return;
    }

    if (showFeedbackOverlay.value) {
      exitFull();
    }
  }
};

onMounted(() => {
  scrollToBottom();
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  clearFeedbackTimer();
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
  chatData.messages.forEach((message) => {
    if ((message.type === 'image' || message.type === 'file') && message.url?.startsWith('blob:')) {
      URL.revokeObjectURL(message.url);
    }
  });
});
</script>

<template>
  <div class="chat-shell flex min-h-screen w-full overflow-hidden bg-white font-sans text-slate-800">
    <main
      class="relative flex h-full w-full flex-col overflow-hidden bg-white transition-transform duration-700"
      :class="showFeedbackOverlay ? 'scale-[0.985]' : 'scale-100'"
    >
      <header
        class="z-30 flex h-20 shrink-0 items-center bg-[#549474] px-6 text-white shadow-md transition-all duration-700 md:px-10"
        :class="[headerClass, showFeedbackOverlay ? 'brightness-50 blur-[2px]' : '']"
      >
        <div v-if="isAgentMode" class="flex items-center gap-4 overflow-hidden">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/20 text-lg font-bold backdrop-blur-md md:h-12 md:w-12"
          >
            {{ chatData.userName[0] }}
          </div>
          <div class="min-w-0">
            <h3 class="flex items-center gap-2 text-base font-bold md:text-lg">
              <span class="truncate">{{ chatData.userName }}</span>
              <span
                class="hidden whitespace-nowrap rounded border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-normal tracking-tight sm:inline"
              >
                案號: {{ chatData.caseId }}
              </span>
            </h3>
            <p class="flex items-center gap-1 whitespace-nowrap text-[10px] font-medium text-white/90 md:text-xs">
              <span
                class="h-2 w-2 animate-pulse rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              />
              線上對話中
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-3 text-right md:gap-4">
          <h1 class="whitespace-nowrap text-sm font-black tracking-tighter md:text-xl">
            新竹市政府 1999 文字客服
          </h1>
          <div class="hidden rounded-2xl bg-white/20 p-3 sm:block md:p-3.5">
            <PhoneCall :size="28" class="text-white md:h-8 md:w-8" />
          </div>
        </div>
      </header>

      <div
        class="relative flex flex-1 flex-col overflow-hidden bg-white transition-all duration-700"
        :class="showFeedbackOverlay ? 'brightness-50 blur-md' : ''"
      >
        <div
          class="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center opacity-[0.07]"
        >
          <img
            :src="resolveAssetUrl('/assets/hsinchu-logo.svg')"
            alt="新竹市市徽"
            class="h-64 w-64 object-contain md:h-[420px] md:w-[420px]"
          />
        </div>

        <div class="relative z-10 flex-1 space-y-10 overflow-y-auto px-6 pt-8 pb-16 scroll-smooth md:px-20">
          <div class="flex justify-center">
            <span
              class="rounded-full border border-slate-100 bg-slate-100 px-5 py-1.5 text-[11px] font-medium uppercase tracking-widest text-slate-400"
            >
              今天 14:15
            </span>
          </div>

          <div
            v-for="msg in chatData.messages"
            :key="msg.id"
            class="flex items-start gap-3 md:gap-4"
            :class="msg.sender === 'agent' ? 'flex-row-reverse' : 'flex-row'"
          >
            <div class="mt-1 shrink-0">
              <div
                v-if="msg.sender === 'agent'"
                class="h-10 w-10 overflow-hidden rounded-full border-2 border-[#549474]/20 bg-white shadow-sm md:h-12 md:w-12"
              >
                <img :src="resolveAssetUrl('/stickers/皮卡正面.png')" alt="客服頭像" class="h-full w-full object-contain p-1" />
              </div>
              <div
                v-else
                class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-base font-bold text-slate-500 shadow-sm md:h-12 md:w-12 md:text-lg"
              >
                {{ chatData.userName[0] }}
              </div>
            </div>

            <div
              class="flex max-w-[80%] flex-col md:max-w-[70%]"
              :class="msg.sender === 'agent' ? 'items-end' : 'items-start'"
            >
            <div
              v-if="msg.type === 'text'"
              class="rounded-2xl p-4 text-sm leading-relaxed shadow-sm md:p-5 md:text-base"
                :class="
                  msg.sender === 'agent'
                    ? 'rounded-tr-none bg-[#549474] text-white shadow-[#549474]/10'
                    : 'rounded-tl-none border border-slate-200/50 bg-[#F3F6F4] text-[#757472]'
                "
              >
                <p v-for="(line, index) in msg.text.split('\n')" :key="index" :class="index > 0 ? 'mt-2' : ''">
                  {{ line }}
                </p>
              </div>

              <div v-else-if="msg.type === 'sticker'" class="group relative">
                <img :src="msg.url" alt="貼圖" class="h-auto w-32 rounded-lg md:w-48" />
              </div>

              <button
                v-else-if="msg.type === 'image'"
                type="button"
                class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-sm transition-transform hover:scale-[1.02]"
                @click="openImagePreview(msg)"
              >
                <img :src="msg.url" :alt="msg.fileName" class="h-auto max-w-[220px] rounded-xl md:max-w-[320px]" />
                <p class="mt-2 truncate text-xs font-medium text-slate-500">
                  {{ msg.fileName }}
                </p>
              </button>

              <div
                v-else
                class="flex min-w-[220px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
              >
                <div class="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                  檔案
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-slate-700">{{ msg.fileName }}</p>
                  <p class="truncate text-xs text-slate-400">{{ msg.fileType || '未知格式' }}</p>
                </div>
              </div>

              <div
                class="mt-2 flex items-center gap-1 text-[11px]"
                :class="msg.sender === 'agent' ? 'flex-row-reverse text-[#549474]' : 'text-slate-400'"
              >
                <span class="font-semibold">{{ msg.time }}</span>
                <CheckCheck v-if="msg.sender === 'agent'" :size="14" />
                <span v-if="msg.sender === 'user' && msg.status === 'read'" class="mr-1 font-bold">已讀</span>
              </div>
            </div>
          </div>

          <div class="h-8 w-full" />
          <div ref="chatEndRef" />
        </div>
      </div>

      <footer
        class="chat-footer relative z-30 shrink-0 border-t border-slate-100 bg-white px-6 py-6 transition-all duration-700 md:px-10"
        :class="showFeedbackOverlay ? 'brightness-50 blur-[2px]' : ''"
      >
        <div v-if="isAgentMode" class="no-scrollbar flex gap-2 overflow-x-auto pb-5">
          <button
            v-for="reply in quickReplies"
            :key="reply"
            type="button"
            class="whitespace-nowrap rounded-full border border-[#549474]/20 bg-white px-4 py-2 text-sm font-medium text-[#757472] shadow-sm transition-all hover:bg-[#549474]/10 hover:text-[#549474]"
            @click="inputText = reply"
          >
            {{ reply }}
          </button>
        </div>

        <div
          v-if="showStickers"
          ref="stickerMenuRef"
          class="animate-in fade-in slide-in-from-bottom-4 absolute bottom-32 left-6 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl duration-200 md:left-10 md:w-96"
        >
          <div class="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 class="flex items-center gap-2 text-sm font-bold text-[#549474]">
              <Smile :size="16" />
              皮卡貼圖庫
            </h4>
            <button
              type="button"
              class="text-slate-400 transition-colors hover:text-red-500"
              @click="showStickers = false"
            >
              <X :size="18" />
            </button>
          </div>
          <div class="custom-scrollbar grid max-h-60 grid-cols-4 gap-3 overflow-y-auto pr-1">
            <button
              v-for="sticker in stickers"
              :key="sticker.id"
              type="button"
              class="flex flex-col items-center gap-1 rounded-xl p-1.5 transition-all hover:scale-110 hover:bg-slate-100 active:scale-95"
              @click="handleSendSticker(sticker.url)"
            >
              <img :src="sticker.url" :alt="sticker.name" class="h-auto w-full rounded-md" />
              <span class="w-full truncate text-center text-[10px] text-slate-400">
                {{ sticker.name.replace('皮卡', '') }}
              </span>
            </button>
          </div>
        </div>

        <div class="relative flex w-full items-center gap-2 sm:gap-3">
          <div
            class="flex min-w-0 flex-1 items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm transition-all duration-200 focus-within:border-[#549474]/40 focus-within:bg-white"
          >
            <button
              type="button"
              class="p-3 transition-colors"
              :class="showStickers ? 'text-[#549474]' : 'text-slate-400 hover:text-[#549474]'"
              @click="showStickers = !showStickers"
            >
              <Smile :size="22" />
            </button>

            <label class="cursor-pointer p-3 text-slate-400 transition-colors hover:text-[#549474]">
              <Paperclip :size="22" />
              <input
                ref="fileInputRef"
                type="file"
                class="hidden"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                @change="handleSendFile"
              />
            </label>

            <textarea
              v-model="inputText"
              rows="1"
              placeholder="請輸入訊息內容..."
              class="min-w-0 max-h-40 flex-1 overflow-hidden resize-none border-none bg-transparent py-3 text-sm leading-normal text-slate-700 placeholder:whitespace-nowrap placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-base"
              @keydown.enter.exact.prevent="handleSendMessage"
            />

            <button
              type="button"
              class="shrink-0 rounded-xl p-4 transition-all"
              :class="
                inputText.trim()
                  ? 'bg-[#549474] text-white shadow-lg shadow-[#549474]/20 active:scale-95'
                  : 'pointer-events-none text-slate-300 shadow-none'
              "
              :disabled="!inputText.trim()"
              @click="handleSendMessage"
            >
              <Send :size="20" />
            </button>
          </div>

          <button
            type="button"
            class="hidden h-[64px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#757472] p-4 font-bold text-white shadow-md transition-all active:scale-95 hover:bg-slate-600 sm:flex"
            @click="openFeedback"
          >
            <LogOut :size="20" />
            結束對話
          </button>
          <button
            type="button"
            class="shrink-0 self-stretch rounded-2xl bg-[#757472] px-3 text-white shadow-md sm:hidden"
            @click="openFeedback"
          >
            <LogOut :size="20" />
          </button>
        </div>

        <div
          class="mt-4 flex w-full items-center justify-between px-2 text-[11px] font-medium text-slate-400"
        >
          <div class="flex items-center gap-1.5">
            <AlertCircle :size="12" class="text-[#549474]" />
            <span>支援 JPG, PNG, PDF, Word (最大 20MB)</span>
          </div>
          <img
            :src="resolveAssetUrl('/assets/footer-logo.svg')"
            alt="新竹市政府識別"
            class="hidden h-6 w-auto opacity-70 sm:inline-block"
          />
        </div>
      </footer>

      <div
        v-if="previewImage"
        class="absolute inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm"
        @click="closeImagePreview"
      >
        <div
          class="relative max-h-full max-w-5xl overflow-hidden rounded-[28px] bg-white p-4 shadow-2xl"
          @click.stop
        >
          <button
            type="button"
            class="absolute top-4 right-4 z-10 rounded-full bg-slate-900/75 p-2 text-white transition-colors hover:bg-slate-900"
            @click="closeImagePreview"
          >
            <X :size="18" />
          </button>

          <img
            :src="previewImage.url"
            :alt="previewImage.fileName"
            class="max-h-[80vh] w-auto max-w-full rounded-[20px] object-contain"
          />

          <p class="mt-3 truncate pr-10 text-sm font-semibold text-slate-600">
            {{ previewImage.fileName }}
          </p>
        </div>
      </div>

      <div
        class="feedback-overlay"
        :class="showFeedbackOverlay ? 'active' : ''"
      >
        <div
          class="glow-sphere"
          :class="[
            feedbackGlow === 'positive' ? 'positive' : '',
            feedbackGlow === 'negative' ? 'negative' : '',
            feedbackGlow ? 'visible' : '',
          ]"
        />

        <div class="feedback-box" :class="showFeedbackOverlay ? 'active' : ''">
          <template v-if="!feedbackSubmitted">
            <h1>本次對話滿意嗎？</h1>
            <p>您的回饋能讓我們做得更好</p>

            <div class="reaction-container">
              <button
                type="button"
                class="reaction-card up"
                @mouseenter="updateGlow('positive')"
                @mouseleave="clearGlow"
                @click="submitFinal('positive')"
              >
                <ThumbsUp class="reaction-icon" />
                <span>非常滿意</span>
              </button>

              <button
                type="button"
                class="reaction-card down"
                @mouseenter="updateGlow('negative')"
                @mouseleave="clearGlow"
                @click="submitFinal('negative')"
              >
                <ThumbsDown class="reaction-icon" />
                <span>有待改進</span>
              </button>
            </div>

            <button type="button" class="close-btn" @click="exitFull">
              暫不評價，直接離開
            </button>
          </template>

          <div v-else class="success-state">
            <PartyPopper class="success-icon" />
            <h1>感謝您的回饋！</h1>
            <p>對話已結束，祝您有愉快的一天。</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.chat-shell {
  min-height: 100dvh;
}

.chat-footer {
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
}

.feedback-overlay {
  position: absolute;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), visibility 0.6s ease,
    backdrop-filter 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  backdrop-filter: blur(0px);
}

.feedback-overlay.active {
  opacity: 1;
  visibility: visible;
  backdrop-filter: blur(36px);
}

.glow-sphere {
  position: absolute;
  width: min(62vw, 600px);
  height: min(62vw, 600px);
  border-radius: 9999px;
  filter: blur(120px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.7s ease, background 0.7s ease;
}

.glow-sphere.visible {
  opacity: 0.6;
}

.glow-sphere.positive {
  background: radial-gradient(circle, rgba(52, 199, 89, 0.4) 0%, transparent 70%);
}

.glow-sphere.negative {
  background: radial-gradient(circle, rgba(255, 59, 48, 0.4) 0%, transparent 70%);
}

.feedback-box {
  width: min(100%, 760px);
  text-align: center;
  color: white;
  transform: translateY(40px);
  opacity: 0;
  transition: transform 0.8s ease, opacity 0.8s ease;
}

.feedback-box.active {
  transform: translateY(0);
  opacity: 1;
}

.feedback-box h1 {
  margin: 0 0 12px;
  font-size: clamp(2rem, 5vw, 2.625rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.feedback-box p {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.125rem);
  color: rgba(255, 255, 255, 0.68);
}

.reaction-container {
  display: flex;
  justify-content: center;
  gap: clamp(16px, 4vw, 60px);
  margin-top: 56px;
}

.reaction-card {
  width: min(40vw, 200px);
  height: min(40vw, 200px);
  min-width: 150px;
  min-height: 150px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 40px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.reaction-icon {
  width: 72px;
  height: 72px;
  color: rgba(255, 255, 255, 0.3);
  transition: color 0.4s ease;
}

.reaction-card span {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
  transition: color 0.4s ease;
}

.reaction-card.up:hover {
  transform: scale(1.12) translateY(-12px);
  border-color: #34c759;
  background: rgba(52, 199, 89, 0.15);
  box-shadow: 0 20px 50px rgba(52, 199, 89, 0.28);
}

.reaction-card.up:hover .reaction-icon,
.reaction-card.up:hover span {
  color: #34c759;
}

.reaction-card.down:hover {
  transform: scale(1.12) translateY(-12px);
  border-color: #ff3b30;
  background: rgba(255, 59, 48, 0.15);
  box-shadow: 0 20px 50px rgba(255, 59, 48, 0.28);
}

.reaction-card.down:hover .reaction-icon,
.reaction-card.down:hover span {
  color: #ff3b30;
}

.close-btn {
  margin-top: 48px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.48);
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
}

.close-btn:hover {
  color: white;
}

.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fade-in 0.5s forwards;
}

.success-icon {
  width: 100px;
  height: 100px;
  margin-bottom: 24px;
  color: #34c759;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

@media (max-width: 640px) {
  .feedback-overlay {
    padding: 20px;
  }

  .reaction-container {
    flex-direction: column;
    align-items: center;
    margin-top: 40px;
  }

  .reaction-card {
    width: min(100%, 280px);
    height: 160px;
    border-radius: 32px;
  }

  .reaction-icon {
    width: 56px;
    height: 56px;
  }

  .close-btn {
    margin-top: 36px;
  }

  .success-icon {
    width: 80px;
    height: 80px;
  }
}
</style>
