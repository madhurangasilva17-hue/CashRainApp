// Telegram init
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// Dummy state (later backend වලින් fill කරගන්න පුළුවන්)
const state = {
  balance: 6600,
  earnings: 3000,
  referrals: 16,
  dailyMax: 30,
  dailyDone: 0,
  friendBonus: 100,
  youBonus: 200,
  minRefsWithdraw: 15,
  watchReward: 100,
};

// Helpers
const $ = (id) => document.getElementById(id);
const toast = (msg) => {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1600);
};

function money(n) {
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Referral logic: get ref from URL or Telegram start param
function getRefId() {
  const url = new URL(window.location.href);
  const byUrl = url.searchParams.get("ref");
  if (byUrl) return byUrl;

  // Telegram start param: tgWebAppStartParam
  const sp = url.searchParams.get("tgWebAppStartParam");
  if (sp) return sp;

  // Telegram initDataUnsafe start_param (sometimes available)
  const byTg = tg?.initDataUnsafe?.start_param;
  if (byTg) return byTg;

  return null;
}

function buildReferralLink(refId) {
  // IMPORTANT: set your bot username later
  const BOT_USERNAME = "cash_rain_lanka_bot";
  return `https://t.me/${BOT_USERNAME}?start=ref_${refId}`;
}

// UI bind
function render() {
  $("balanceAmount").innerHTML = `${money(state.balance)} <span>LKR</span>`;
  $("totalEarnings").textContent = `${money(state.earnings)} LKR`;
  $("refCount").textContent = `${state.referrals}`;

  $("dailyLimit").textContent = state.dailyMax;
  $("maxCount").textContent = state.dailyMax;

  $("doneCount").textContent = state.dailyDone;
  $("leftCount").textContent = Math.max(0, state.dailyMax - state.dailyDone);

  const pct = Math.min(100, (state.dailyDone / state.dailyMax) * 100);
  $("barFill").style.width = `${pct}%`;

  $("friendBonus").textContent = state.friendBonus;
  $("youBonus").textContent = state.youBonus;
  $("earnPerRef").textContent = state.youBonus;

  $("minRefs").textContent = state.minRefsWithdraw;
  $("watchReward").textContent = state.watchReward;

  // referral link shown inside app: use current user id if available
  const myId = tg?.initDataUnsafe?.user?.id || "000000";
  $("refLink").textContent = buildReferralLink(myId);
}

render();

// Navigation
const pages = ["home", "task", "support", "withdraw"];
function go(to) {
  pages.forEach((p) => {
    document.getElementById(`page-${p}`).classList.toggle("active", p === to);
  });
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.to === to);
  });
  toast(to.toUpperCase());
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => go(btn.dataset.to));
});

// Buttons
$("btnClose").addEventListener("click", () => {
  if (tg) tg.close();
  else window.close();
});

$("btnCopyRef").addEventListener("click", async () => {
  const link = $("refLink").textContent;
  try {
    await navigator.clipboard.writeText(link);
    toast("Copied!");
  } catch {
    toast("Copy failed");
  }
});

$("btnShareRef").addEventListener("click", async () => {
  const link = $("refLink").textContent;
  const text = `Join Cash Rain and earn rewards! 🚀\n${link}`;
  if (tg) {
    // Telegram share via openLink to share URL
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    tg.openLink(shareUrl);
  } else {
    try {
      await navigator.share({ title: "Cash Rain", text, url: link });
    } catch {
      toast("Share not supported");
    }
  }
});

$("btnPlaySmall").addEventListener("click", () => go("task"));
$("btnWatchVideo").addEventListener("click", () => {
  // demo: increment progress
  if (state.dailyDone < state.dailyMax) {
    state.dailyDone += 1;
    state.earnings += state.watchReward;
    state.balance += state.watchReward;
    render();
    toast(`+${state.watchReward} LKR`);
  } else {
    toast("Daily limit reached");
  }
});

$("btnTutorial").addEventListener("click", () => {
  // replace with your YouTube link
  const url = "https://www.youtube.com";
  if (tg) tg.openLink(url);
  else window.open(url, "_blank");
});

$("btnSupportChat").addEventListener("click", () => {
  // replace with your support username
  const url = "https://t.me/";
  if (tg) tg.openLink(url);
  else window.open(url, "_blank");
});

$("btnFAQ").addEventListener("click", () => toast("FAQ coming soon"));

$("btnWithdraw").addEventListener("click", () => {
  const method = $("paymentMethod").value;
  const amount = Number($("withdrawAmount").value || 0);

  if (state.referrals < state.minRefsWithdraw) {
    toast(`Need ${state.minRefsWithdraw} referrals`);
    return;
  }
  if (!method) { toast("Select method"); return; }
  if (!amount || amount <= 0) { toast("Enter amount"); return; }
  if (amount > state.balance) { toast("Insufficient balance"); return; }

  // Demo success
  state.balance -= amount;
  render();
  $("withdrawHistory").textContent = `Requested ${money(amount)} LKR via ${method.toUpperCase()}`;
  toast("Withdraw requested ✅");
});

// If open with ref param (new user)
const incomingRef = getRefId();
if (incomingRef) {
  // You can send this to backend later
  console.log("Incoming ref:", incomingRef);
}
