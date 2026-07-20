// =============================================
//  Alat Jaringan — Client-Side Logic
// =============================================

// ---- Subnet Calculator ----
document.addEventListener('DOMContentLoaded', function () {
  const subnetForm = document.getElementById('subnetForm');
  if (subnetForm) {
    subnetForm.addEventListener('submit', function (e) {
      e.preventDefault();
      calculateSubnet();
    });
  }

  const ipCheckBtn = document.getElementById('ipCheckBtn');
  if (ipCheckBtn) {
    ipCheckBtn.addEventListener('click', checkPublicIP);
  }

  const pingForm = document.getElementById('pingForm');
  if (pingForm) {
    pingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      handlePing();
    });
  }

  const macForm = document.getElementById('macForm');
  if (macForm) {
    macForm.addEventListener('submit', function (e) {
      e.preventDefault();
      handleMacLookup();
    });
  }
});

function calculateSubnet() {
  const ipInput = document.getElementById('subnetIP').value.trim();
  const cidr = parseInt(document.getElementById('subnetCIDR').value, 10);
  const resultDiv = document.getElementById('subnetResult');

  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ipInput.match(ipRegex);
  if (!match) {
    resultDiv.innerHTML = '<p class="text-red-500 font-medium">Format IP tidak valid. Gunakan format x.x.x.x</p>';
    resultDiv.classList.remove('hidden');
    return;
  }

  const octets = [
    parseInt(match[1], 10),
    parseInt(match[2], 10),
    parseInt(match[3], 10),
    parseInt(match[4], 10),
  ];

  if (octets.some(o => o < 0 || o > 255)) {
    resultDiv.innerHTML = '<p class="text-red-500 font-medium">Setiap oktet harus antara 0-255</p>';
    resultDiv.classList.remove('hidden');
    return;
  }

  // Convert IP to 32-bit integer
  const ipInt = (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3];

  // Create subnet mask
  const maskInt = ~0 << (32 - cidr);

  // Network address
  const networkInt = ipInt & maskInt;

  // Broadcast address
  const broadcastInt = networkInt | ~maskInt;

  // Wildcard mask
  const wildcardInt = ~maskInt;

  // First usable host
  const firstHostInt = cidr < 31 ? networkInt + 1 : networkInt;

  // Last usable host
  const lastHostInt = cidr < 31 ? broadcastInt - 1 : broadcastInt;

  // Number of hosts
  const numHosts = cidr < 31 ? Math.pow(2, 32 - cidr) - 2 : (cidr === 31 ? 2 : 1);

  function intToIP(val) {
    return [
      (val >>> 24) & 255,
      (val >>> 16) & 255,
      (val >>> 8) & 255,
      val & 255,
    ].join('.');
  }

  resultDiv.innerHTML = `
    <div class="grid grid-cols-2 gap-3 text-sm mt-3">
      <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
        <span class="text-xs text-on-surface-variant block font-label">Network Address</span>
        <span class="font-semibold text-primary font-mono">${intToIP(networkInt)}</span>
      </div>
      <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
        <span class="text-xs text-on-surface-variant block font-label">Broadcast Address</span>
        <span class="font-semibold text-primary font-mono">${intToIP(broadcastInt)}</span>
      </div>
      <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
        <span class="text-xs text-on-surface-variant block font-label">First Host</span>
        <span class="font-semibold text-primary font-mono">${intToIP(firstHostInt)}</span>
      </div>
      <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
        <span class="text-xs text-on-surface-variant block font-label">Last Host</span>
        <span class="font-semibold text-primary font-mono">${intToIP(lastHostInt)}</span>
      </div>
      <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
        <span class="text-xs text-on-surface-variant block font-label">Subnet Mask</span>
        <span class="font-semibold text-primary font-mono">${intToIP(maskInt)}</span>
      </div>
      <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
        <span class="text-xs text-on-surface-variant block font-label">Wildcard Mask</span>
        <span class="font-semibold text-primary font-mono">${intToIP(wildcardInt)}</span>
      </div>
      <div class="col-span-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
        <span class="text-xs text-on-surface-variant block font-label">Jumlah Host Valid</span>
        <span class="font-semibold text-primary font-mono text-lg">${numHosts.toLocaleString()} host</span>
      </div>
    </div>
  `;
  resultDiv.classList.remove('hidden');
}

// ---- Public IP Checker ----
async function checkPublicIP() {
  const resultDiv = document.getElementById('ipResult');
  const btn = document.getElementById('ipCheckBtn');

  resultDiv.innerHTML = '<div class="flex items-center gap-2 text-on-surface-variant"><span class="material-symbols-outlined animate-spin">sync</span> Mendeteksi IP publik...</div>';
  resultDiv.classList.remove('hidden');
  btn.disabled = true;

  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();

    resultDiv.innerHTML = `
      <div class="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mt-2">
        <div>
          <span class="text-xs text-on-surface-variant block font-label">IP Publik Anda</span>
          <span class="text-2xl font-bold font-mono text-primary">${data.ip}</span>
        </div>
        <button onclick="copyIP('${data.ip}')" class="px-4 py-2 bg-primary text-white rounded-lg font-label font-medium hover:bg-primary-hover transition-colors flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">content_copy</span> Salin
        </button>
      </div>
    `;
  } catch (e) {
    resultDiv.innerHTML = '<p class="text-red-500">Gagal mengambil IP publik. Periksa koneksi internet.</p>';
  } finally {
    btn.disabled = false;
  }
}

function copyIP(ip) {
  navigator.clipboard.writeText(ip).then(() => {
    const btn = event.target.closest('button');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span> Tersalin';
    setTimeout(() => btn.innerHTML = original, 2000);
  });
}

// ---- Ping Tool ----
async function handlePing() {
  const ip = document.getElementById('pingIP').value.trim();
  const resultDiv = document.getElementById('pingResult');
  const btn = document.getElementById('pingBtn');

  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) {
    resultDiv.innerHTML = '<p class="text-red-500 font-medium">Format IP tidak valid</p>';
    resultDiv.classList.remove('hidden');
    return;
  }

  resultDiv.innerHTML = '<div class="flex items-center gap-2 text-on-surface-variant"><span class="material-symbols-outlined animate-spin">sync</span> Ping sedang berjalan...</div>';
  resultDiv.classList.remove('hidden');
  btn.disabled = true;

  try {
    const res = await fetch(`/api/ping/${ip}`);
    const data = await res.json();

    if (data.status === 'unreachable') {
      resultDiv.innerHTML = `<div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mt-2">
        <p class="text-red-600 font-medium">${data.output}</p>
      </div>`;
    } else {
      resultDiv.innerHTML = `<pre class="bg-gray-900 text-green-400 p-4 rounded-xl mt-2 text-xs font-mono overflow-x-auto leading-relaxed">${data.output}</pre>`;
    }
  } catch (e) {
    resultDiv.innerHTML = '<p class="text-red-500">Gagal menjalankan ping. Server tidak merespon.</p>';
  } finally {
    btn.disabled = false;
  }
}

// ---- MAC Vendor Lookup ----
async function handleMacLookup() {
  const mac = document.getElementById('macInput').value.trim();
  const resultDiv = document.getElementById('macResult');
  const btn = document.getElementById('macBtn');

  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
  if (!macRegex.test(mac)) {
    resultDiv.innerHTML = '<p class="text-red-500 font-medium">Format MAC tidak valid. Gunakan XX:XX:XX:XX:XX:XX</p>';
    resultDiv.classList.remove('hidden');
    return;
  }

  resultDiv.innerHTML = '<div class="flex items-center gap-2 text-on-surface-variant"><span class="material-symbols-outlined animate-spin">sync</span> Mencari vendor...</div>';
  resultDiv.classList.remove('hidden');
  btn.disabled = true;

  try {
    const res = await fetch(`/api/mac/${encodeURIComponent(mac)}`);
    const data = await res.json();

    resultDiv.innerHTML = `
      <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mt-2">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-xs text-on-surface-variant block font-label">MAC Address</span>
            <span class="font-mono font-semibold">${data.mac}</span>
          </div>
          <div>
            <span class="text-xs text-on-surface-variant block font-label">OUI Prefix</span>
            <span class="font-mono font-semibold">${data.oui}</span>
          </div>
          <div class="col-span-2">
            <span class="text-xs text-on-surface-variant block font-label">Vendor</span>
            <span class="font-semibold text-primary text-lg">${data.vendor}</span>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    resultDiv.innerHTML = '<p class="text-red-500">Gagal mencari vendor MAC.</p>';
  } finally {
    btn.disabled = false;
  }
}
