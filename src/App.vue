<template>
  <router-view />
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import useOrderNotifications from "./composables/useOrderNotifications";
import { subscribeForegroundAsync, getFcmToken } from "./firebase";

const auth = useAuthStore();
const vendorId = computed(() => auth.user?.vendor_id ?? null);
let sharedAudioCtx: AudioContext | null = null;

// Start polling notifications when a vendor is available
useOrderNotifications(vendorId.value ?? null);

// Ask for notification permission on app open and pre-register FCM
onMounted(async () => {
  try {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission === "granted") {
        // Pre-register SW and obtain token (stored by app, sent on login)
        await getFcmToken();
      }
      // Listen for messages from the service worker to play sound (e.g., on notification click)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (e: MessageEvent) => {
          if ((e.data as any)?.type === 'play-sound') {
            playBeepAdvanced();
          }
        });
      }
    }
  } catch {
    // ignore
  }
});

// FCM foreground notifications (desktop) — subscribe after Firebase init
onMounted(async () => {
  await subscribeForegroundAsync((payload: any) => {
    try {
      if (Notification?.permission === "granted") {
        const title = payload?.notification?.title || "إشعار";
        const body = payload?.notification?.body || "";
        const data = payload?.data || {};
        new Notification(title, { body, data });
        playBeepAdvanced();
      }
    } catch {
      // ignore
    }
  });
});

function getAudioContext(): AudioContext | null {
  if (sharedAudioCtx) return sharedAudioCtx;
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    sharedAudioCtx = new AudioCtx();
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playBeepAdvanced() {
  try {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;
    const osc1 = ctx.createOscillator(); // base
    const osc2 = ctx.createOscillator(); // interval
    const gain = ctx.createGain();
    // Slightly enhanced chime: dual sine tones with stagger and gentle envelope
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.value = 880;   // A5
    osc2.frequency.value = 1320;  // E6
    try { osc2.detune.value = 6; } catch {}
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.33);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(now);
    osc2.start(now + 0.01);
    setTimeout(() => {
      try { osc1.stop(); } catch {}
      try { osc2.stop(); } catch {}
    }, 340);
  } catch {
    // ignore audio errors
  }
}

// Alternative soft chime: triangle waves with a gentle decay, slightly lower pitch
function playChimeSoft() {
  try {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;
    const base = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();

    base.type = "triangle";
    overtone.type = "triangle";
    base.frequency.value = 660;      // E5
    overtone.frequency.value = 990;  // B5 (a pleasant fifth)
    try { overtone.detune.value = 8; } catch {}

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45); // longer, softer tail

    base.connect(gain);
    overtone.connect(gain);
    gain.connect(ctx.destination);

    base.start(now);
    overtone.start(now + 0.008);

    setTimeout(() => {
      try { base.stop(); } catch {}
      try { overtone.stop(); } catch {}
    }, 480);
  } catch {
    // ignore audio errors
  }
}
</script>
