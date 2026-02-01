import { onMounted, onUnmounted } from "vue";
import axios from "@/api/axios";
import { fmtMoney } from "@/utils/format";

type LatestOrder = {
  id: number;
  total?: number;
  created_at?: string;
};

function playBeep(): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 180);
  } catch {
    // ignore audio errors
  }
}

async function notifyNewOrder(order: LatestOrder) {
  const title = "طلب جديد";
  const body = `رقم الطلب #${order.id} - الإجمالي ${fmtMoney(order.total ?? 0)}`;

  try {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission === "granted") {
        new Notification(title, { body });
        playBeep();
        return;
      }
    }
  } catch {
    // fall back below
  }
  // Fallback UI
  try {
    // eslint-disable-next-line no-alert
    alert(`${title}\n${body}`);
  } catch {
    // swallow
  }
  playBeep();
}

export function useOrderNotifications(vendorId?: number | null) {
  let timer: number | undefined;
  const storageKey = vendorId ? `last_seen_vendor_order_id_${vendorId}` : "last_seen_vendor_order_id";

  async function checkOnce() {
    try {
      // Pull only the latest order for this vendor
      const res = await axios.get("/cashier/orders", { params: { per_page: 1 } });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      if (!list.length) return;
      const latest: LatestOrder = {
        id: Number(list[0]?.id ?? 0),
        total: Number(list[0]?.total ?? list[0]?.subtotal ?? 0),
        created_at: list[0]?.created_at,
      };
      if (!latest.id) return;

      const lastSeen = Number(localStorage.getItem(storageKey) || "0");
      // First run: initialize without notifying to avoid noise
      if (lastSeen === 0) {
        localStorage.setItem(storageKey, String(latest.id));
        return;
      }
      if (latest.id > lastSeen) {
        await notifyNewOrder(latest);
        localStorage.setItem(storageKey, String(latest.id));
        // Emit a custom event in case pages want to react
        window.dispatchEvent(new CustomEvent("vendor-order:new", { detail: latest }));
      }
    } catch {
      // ignore errors; try again next tick
    }
  }

  function start(intervalMs = 8000) {
    // Initialize last seen if missing to suppress initial blast
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, "0");
    }
    // Immediate check after small delay, then interval
    window.setTimeout(() => void checkOnce(), 1000);
    timer = window.setInterval(() => void checkOnce(), intervalMs) as unknown as number;
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = undefined;
    }
  }

  onMounted(() => {
    if (vendorId && vendorId > 0) start();
  });

  onUnmounted(() => stop());

  return { start, stop, triggerCheck: checkOnce };
}

export default useOrderNotifications;


