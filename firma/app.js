const LOGO_PATH = "assets/logo-firma.png";
const PUBLIC_LOGO_URL = "https://www.stiloq.net/assets/logo-firma.png?v=9";
const LOGO_CACHE_VERSION = "9";
let logoNatW = 375;
let logoNatH = 190;
const SCALE = 1.05;
const DEFAULT_LOGO_ANCHO = 190;
const FONT = {
  nombre: Math.round(14 * SCALE),
  body: Math.round(13 * SCALE),
  aviso: Math.round(11 * SCALE),
  eco: Math.round(12 * SCALE),
};
const LOGO_GAP = 5;
const TEXT_COL_W = 320;
const FOOTER_TABLE_W = 680;
let logoTopInsetPx = 0;
let logoLeftInsetPx = 0;
let logoRightInsetPx = 0;

const AVISO_EN =
  "CONFIDENTIALITY NOTICE: This message may contain confidential information. If received in error, please delete it.";
const AVISO_ES =
  "AVISO DE CONFIDENCIALIDAD: Este mensaje puede contener información confidencial. Si lo ha recibido por error, elimínelo.";
const MENSAJE_ECO =
  "Evita imprimir este mensaje si no es estrictamente necesario. De esta manera ahorras agua, energía y recursos forestales.";

const form = document.getElementById("signature-form");
const preview = document.getElementById("preview");
const htmlOutput = document.getElementById("html-output");
const copyStatus = document.getElementById("copy-status");
const btnCopy = document.getElementById("btn-copy");
const btnDownload = document.getElementById("btn-download");

let logoBase64 = "";

function setLogoDimensions(w, h) {
  if (w > 0 && h > 0) {
    logoNatW = w;
    logoNatH = h;
  }
}

function measureLogoInsets(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { top: 0, left: 0 };
  ctx.drawImage(img, 0, 0);
  let data;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    return { top: 0, left: 0 };
  }
  let top = canvas.height;
  let left = canvas.width;
  let right = 0;
  let bottom = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] > 20) {
        top = Math.min(top, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  return {
    top: top >= canvas.height ? 0 : top,
    left: left >= canvas.width ? 0 : left,
    right: right > 0 ? canvas.width - right - 1 : 0,
    bottom: bottom > 0 ? canvas.height - bottom - 1 : 0,
  };
}

function logoImageSize(logoW) {
  const imgW = logoW;
  if (!logoNatW || !logoNatH) {
    return { imgW, imgH: Math.max(1, Math.round(imgW * 0.25)) };
  }
  return { imgW, imgH: Math.max(1, Math.round((imgW * logoNatH) / logoNatW)) };
}

function probeLogoFromUrl(url) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    if (img.naturalWidth > 0) {
      setLogoDimensions(img.naturalWidth, img.naturalHeight);
      const insets = measureLogoInsets(img);
      logoTopInsetPx = insets.top;
      logoLeftInsetPx = insets.left;
      logoRightInsetPx = insets.right;
      onFormUpdate();
    }
  };
  img.onerror = () => onFormUpdate();
  img.src = url.includes("?") ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
}

async function loadLogoBase64() {
  const img = document.getElementById("logo-source");

  const apply = async () => {
    if (img?.naturalWidth) {
      setLogoDimensions(img.naturalWidth, img.naturalHeight);
      const insets = measureLogoInsets(img);
      logoTopInsetPx = insets.top;
      logoLeftInsetPx = insets.left;
      logoRightInsetPx = insets.right;
    }
    try {
      const res = await fetch(`${LOGO_PATH}?t=${Date.now()}`);
      const blob = await res.blob();
      logoBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (!logoNatW && logoBase64) {
        const probe = new Image();
        probe.onload = () => {
          setLogoDimensions(probe.naturalWidth, probe.naturalHeight);
          updatePreview();
        };
        probe.src = logoBase64;
        return;
      }
    } catch {
      logoBase64 = "";
    }
    updatePreview();
  };

  if (!img) {
    await apply();
    return;
  }

  if (img.complete && img.naturalWidth) {
    await apply();
  } else {
    img.addEventListener("load", () => apply(), { once: true });
    img.addEventListener("error", () => apply(), { once: true });
  }
}

function getFormData() {
  const fd = new FormData(form);
  return {
    nombre: fd.get("nombre")?.trim() || "",
    cargo: fd.get("cargo")?.trim() || "",
    email: fd.get("email")?.trim() || "",
    telefono: fd.get("telefono")?.trim() || "",
    web: fd.get("web")?.trim() || "",
    direccion1: fd.get("direccion1")?.trim() || "",
    direccion2: fd.get("direccion2")?.trim() || "",
    logoAncho: Math.min(320, Math.max(80, Number(fd.get("logoAncho")) || DEFAULT_LOGO_ANCHO)),
    logoUrl: fd.get("logoUrl")?.trim() || "",
    mostrarAvisos: fd.get("mostrarAvisos") === "on",
    mostrarEco: fd.get("mostrarEco") === "on",
    mensajeEco: fd.get("mensajeEco")?.trim() || MENSAJE_ECO,
  };
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function webHref(url) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function fontStyle(color, sizePx, content, extra = "") {
  return `<font face="Arial, Helvetica, sans-serif" color="${color}" style="font-family:Arial,Helvetica,sans-serif;font-size:${sizePx}px;color:${color};${extra}">${escapeHtml(String(content))}</font>`;
}

function linkStyle(href, label) {
  return `<a href="${escapeHtml(href)}" style="color:#000000;text-decoration:none;"><span style="color:#000000;text-decoration:none;">${fontStyle("#000000", FONT.body, label)}</span></a>`;
}

function wrapOutlookDocument(fragment) {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!--[if mso]>
<noscript></noscript>
<style type="text/css">
body, table, td, p, span, font { font-family: Arial, Helvetica, sans-serif !important; }
a { color: #000000 !important; text-decoration: none !important; }
</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;">
${fragment}
</body>
</html>`;
}

function buildCfHtml(fragment) {
  const startTag = "<!--StartFragment-->";
  const endTag = "<!--EndFragment-->";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${startTag}${fragment}${endTag}</body></html>`;
  const header = (s, e, fs, fe) =>
    `Version:0.9\r\nStartHTML:${String(s).padStart(9, "0")}\r\nEndHTML:${String(e).padStart(9, "0")}\r\nStartFragment:${String(fs).padStart(9, "0")}\r\nEndFragment:${String(fe).padStart(9, "0")}\r\n`;
  const start = header(0, 0, 0, 0).length;
  const fragStart = start + html.indexOf(startTag) + startTag.length;
  const fragEnd = start + html.indexOf(endTag);
  const end = start + html.length;
  return header(start, end, fragStart, fragEnd) + html;
}

const LINE_GAP = "0 0 4px 0";
const LINE_GAP_TIGHT = "0 0 0 0";
const LINE_GAP_AFTER_CARGO = "0 0 8px 0";

function lineHtml(content, margin = LINE_GAP, lineHeight = 1.2) {
  return `<p style="margin:${margin};padding:0;line-height:${lineHeight};mso-line-height-rule:exactly;">${content}</p>`;
}

function footerLineHtml(content) {
  return `<p style="margin:0 0 2px 0;padding:0;line-height:1.15;white-space:nowrap;mso-line-height-rule:exactly;">${content}</p>`;
}

function withLogoCacheBust(url) {
  if (!url || !url.includes("logo-firma.png")) return url;
  if (url.includes("?")) return url;
  return `${url}?v=${LOGO_CACHE_VERSION}`;
}

function resolveLogoUrl(data) {
  const url = data.logoUrl?.trim();
  return withLogoCacheBust(url || PUBLIC_LOGO_URL);
}

function resolveLogoSrc(data, forCopy) {
  const url = resolveLogoUrl(data);
  if (forCopy && /^https?:\/\//i.test(url)) return url;
  if (forCopy && logoBase64) return logoBase64;
  if (/^https?:\/\//i.test(url)) return url;
  return logoBase64 || LOGO_PATH;
}

async function ensureLogoBase64(data) {
  if (logoBase64) return true;
  const url = resolveLogoUrl(data);
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return false;
    const blob = await res.blob();
    logoBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const probe = new Image();
    await new Promise((resolve, reject) => {
      probe.onload = () => {
        setLogoDimensions(probe.naturalWidth, probe.naturalHeight);
        const insets = measureLogoInsets(probe);
        logoTopInsetPx = insets.top;
        logoLeftInsetPx = insets.left;
        logoRightInsetPx = insets.right;
        resolve();
      };
      probe.onerror = reject;
      probe.src = logoBase64;
    });
    return true;
  } catch {
    return false;
  }
}

function buildSignatureHtml(data, opts = {}) {
  const forCopy = opts.forCopy === true;
  const logoSrc = resolveLogoSrc(data, forCopy);
  const logoW = data.logoAncho;
  const { imgW, imgH } = logoImageSize(logoW);
  const scaleX = logoNatW > 0 ? imgW / logoNatW : 1;
  const leftOff = logoLeftInsetPx > 0 ? Math.round(logoLeftInsetPx * scaleX) : 0;
  const logoCellW = Math.max(80, imgW - leftOff + LOGO_GAP);
  const textCellW = TEXT_COL_W;
  const mainW = logoCellW + textCellW;
  const hasFooter = data.mostrarAvisos || (data.mostrarEco && data.mensajeEco);
  void hasFooter;
  const topOff =
    logoTopInsetPx > 0 && logoNatH > 0
      ? Math.round(logoTopInsetPx * (imgH / logoNatH))
      : 0;
  const imgMarginTop = topOff > 0 ? `margin-top:-${topOff}px;` : "";
  const imgMarginLeft = leftOff > 0 ? `margin-left:-${leftOff}px;` : "";
  const telefonoText = data.telefono || "";

  const contactLines = [];
  if (data.nombre) contactLines.push(lineHtml(`<b>${fontStyle("#000000", FONT.nombre, data.nombre)}</b>`, LINE_GAP_TIGHT, 1.1));
  if (data.cargo) contactLines.push(lineHtml(`<i>${fontStyle("#555555", FONT.body, data.cargo)}</i>`, LINE_GAP_AFTER_CARGO, 1.1));
  if (data.email) contactLines.push(lineHtml(linkStyle(`mailto:${data.email}`, data.email), LINE_GAP_TIGHT, 1.1));
  if (telefonoText) contactLines.push(lineHtml(fontStyle("#000000", FONT.body, telefonoText), LINE_GAP_TIGHT, 1.1));
  if (data.web) contactLines.push(lineHtml(linkStyle(webHref(data.web), data.web), LINE_GAP_TIGHT, 1.1));
  if (data.direccion1) contactLines.push(lineHtml(fontStyle("#000000", FONT.body, data.direccion1), "6px 0 0 0"));
  if (data.direccion2) contactLines.push(lineHtml(fontStyle("#000000", FONT.body, data.direccion2), "1px 0 0 0"));

  const logoImg = `<img src="${logoSrc}" alt="STILOQ" width="${imgW}" height="${imgH}" border="0" style="display:block;vertical-align:top;${imgMarginTop}${imgMarginLeft}width:${imgW}px;height:${imgH}px;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;">`;

  const footerTopGap = data.direccion1 || data.direccion2 ? 18 : 14;

  const footerLines = [];
  if (data.mostrarAvisos) {
    footerLines.push(
      footerLineHtml(fontStyle("#999999", FONT.aviso, AVISO_EN)),
      footerLineHtml(fontStyle("#999999", FONT.aviso, AVISO_ES))
    );
  }
  if (data.mostrarEco && data.mensajeEco) {
    footerLines.push(footerLineHtml(fontStyle("#2e7d32", FONT.eco, data.mensajeEco)));
  }

  const mainTable = `<!-- Firma STILOQ -->
<table cellpadding="0" cellspacing="0" border="0" align="left" width="${mainW}" style="border-collapse:collapse;table-layout:fixed;width:${mainW}px;mso-table-lspace:0pt;mso-table-rspace:0pt;font-family:Arial,Helvetica,sans-serif;">
<tbody>
<tr>
<td align="left" valign="top" width="${logoCellW}" style="width:${logoCellW}px;padding:0 ${LOGO_GAP}px 0 0;vertical-align:top;font-size:0;line-height:0;mso-line-height-rule:exactly;mso-padding-alt:0;">${logoImg}</td>
<td align="left" valign="top" width="${textCellW}" style="width:${textCellW}px;vertical-align:top;padding:0;font-family:Arial,Helvetica,sans-serif;mso-line-height-rule:exactly;">${contactLines.join("")}</td>
</tr>
</tbody>
</table>`;

  if (!footerLines.length) return mainTable;

  return `${mainTable}
<table cellpadding="0" cellspacing="0" border="0" align="left" width="${FOOTER_TABLE_W}" style="border-collapse:collapse;width:${FOOTER_TABLE_W}px;mso-table-lspace:0pt;mso-table-rspace:0pt;font-family:Arial,Helvetica,sans-serif;">
<tr>
<td align="left" valign="top" style="padding:${footerTopGap}px 0 0 0;mso-line-height-rule:exactly;">${footerLines.join("")}</td>
</tr>
</table>`;
}

function updatePreview() {
  const data = getFormData();
  const html = buildSignatureHtml(data);
  preview.innerHTML = html;
  htmlOutput.value = wrapOutlookDocument(html);
  copyStatus.textContent = "";
}

const logoUrlInput = document.getElementById("logo-url");
const logoUrlStatus = document.getElementById("logo-url-status");
const logoFileInput = document.getElementById("logo-file");
const btnPublishLogo = document.getElementById("btn-publish-logo");
const logoPublishStatus = document.getElementById("logo-publish-status");

async function publishLogoToWeb() {
  if (!btnPublishLogo || !logoPublishStatus) return;

  logoPublishStatus.textContent = "Publicando logo en stiloq.net…";
  logoPublishStatus.className = "logo-publish-status pending";
  btnPublishLogo.disabled = true;

  try {
    const formData = new FormData();
    if (logoFileInput?.files?.[0]) {
      formData.append("logo", logoFileInput.files[0]);
    }

    const res = await fetch("/api/publish-logo", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || "No se pudo publicar el logo.");
    }

    if (logoUrlInput) {
      logoUrlInput.value = data.url || PUBLIC_LOGO_URL;
      localStorage.setItem("stiloq_logo_url", logoUrlInput.value);
    }

    logoPublishStatus.textContent = data.message || "Logo publicado.";
    logoPublishStatus.className = "logo-publish-status ok";
    onLogoUrlChange();
    onFormUpdate();
  } catch (err) {
    const hint =
      err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")
        ? " Inicia el servidor con «npm start» en la carpeta del generador."
        : "";
    logoPublishStatus.textContent = (err.message || "Error al publicar.") + hint;
    logoPublishStatus.className = "logo-publish-status err";
  } finally {
    btnPublishLogo.disabled = false;
  }
}

btnPublishLogo?.addEventListener("click", publishLogoToWeb);

logoFileInput?.addEventListener("change", () => {
  const file = logoFileInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    logoBase64 = reader.result;
    const probe = new Image();
    probe.onload = () => {
      setLogoDimensions(probe.naturalWidth, probe.naturalHeight);
      const insets = measureLogoInsets(probe);
      logoTopInsetPx = insets.top;
      logoLeftInsetPx = insets.left;
      logoRightInsetPx = insets.right;
      const img = document.getElementById("logo-source");
      if (img) img.src = logoBase64;
      onFormUpdate();
      if (logoPublishStatus) {
        logoPublishStatus.textContent =
          "Logo cargado sin modificar. Pulsa «Publicar logo» (npm start) para subirlo.";
        logoPublishStatus.className = "logo-publish-status ok";
      }
    };
    probe.onerror = () => {
      if (logoPublishStatus) {
        logoPublishStatus.textContent = "No se pudo leer el PNG.";
        logoPublishStatus.className = "logo-publish-status err";
      }
    };
    probe.src = logoBase64;
  };
  reader.readAsDataURL(file);
});

async function checkLogoUrl(url) {
  if (!logoUrlStatus) return;
  if (!url) {
    logoUrlStatus.textContent = "";
    logoUrlStatus.className = "logo-url-status";
    return;
  }
  if (!/^https?:\/\//i.test(url)) {
    logoUrlStatus.textContent = "La URL debe empezar por https://";
    logoUrlStatus.className = "logo-url-status err";
    return;
  }
  logoUrlStatus.textContent = "Comprobando URL del logo…";
  logoUrlStatus.className = "logo-url-status pending";
  try {
    const res = await fetch(url, { method: "HEAD", mode: "no-cors" });
    if (res.type === "opaque") {
      logoUrlStatus.textContent =
        "URL guardada. Si al abrirla en el navegador ves el PNG, Outlook podrá usarla.";
      logoUrlStatus.className = "logo-url-status ok";
      return;
    }
    if (!res.ok) throw new Error("not ok");
    const type = res.headers.get("content-type") || "";
    if (type && !type.includes("image")) {
      logoUrlStatus.textContent = "La URL responde, pero puede no ser una imagen. Revisa el enlace.";
      logoUrlStatus.className = "logo-url-status err";
      return;
    }
    logoUrlStatus.textContent = "URL del logo: correcta.";
    logoUrlStatus.className = "logo-url-status ok";
  } catch {
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = `${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}`;
      });
      logoUrlStatus.textContent = "URL del logo: correcta.";
      logoUrlStatus.className = "logo-url-status ok";
    } catch {
      logoUrlStatus.textContent =
        "No se pudo cargar la imagen. Comprueba que la URL sea pública (https) y termine en .png";
      logoUrlStatus.className = "logo-url-status err";
    }
  }
}

function onFormUpdate() {
  updatePreview();
  checkLogoUrl(getFormData().logoUrl);
}

form.addEventListener("input", onFormUpdate);
form.addEventListener("change", onFormUpdate);

function copyRichHtml(html) {
  const wrapper = document.createElement("div");
  wrapper.contentEditable = "true";
  wrapper.innerHTML = html;
  wrapper.style.cssText =
    "position:fixed;left:-99999px;top:0;width:800px;max-width:800px;background:#fff;";
  document.body.appendChild(wrapper);
  const range = document.createRange();
  range.selectNodeContents(wrapper);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  const ok = document.execCommand("copy");
  document.body.removeChild(wrapper);
  sel.removeAllRanges();
  return ok;
}

async function copyForOutlook() {
  const data = getFormData();
  if (!data.logoUrl?.trim() && logoUrlInput) {
    logoUrlInput.value = PUBLIC_LOGO_URL;
    localStorage.setItem("stiloq_logo_url", PUBLIC_LOGO_URL);
    onFormUpdate();
  }
  const copyData = getFormData();
  const fragment = buildSignatureHtml(copyData, { forCopy: true });
  if (!fragment.includes("https://") || !fragment.includes("<img ")) {
    copyStatus.textContent =
      "Falta la URL del logo. Comprueba https://www.stiloq.net/assets/logo-firma.png y vuelve a copiar.";
    copyStatus.className = "copy-status err";
    return;
  }
  copyStatus.className = "copy-status";
  const cfHtml = buildCfHtml(fragment);
  const copyHint =
    "Firma copiada. Pégala en Configuración → Firmas, desmarca la fuente predefinida y pon el logo en ~190 px (no Tamaño real).";

  if (copyRichHtml(fragment)) {
    copyStatus.textContent = copyHint;
    return;
  }

  try {
    if (navigator.clipboard.write && typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([cfHtml], { type: "text/html" }),
          "text/plain": new Blob([preview.innerText], { type: "text/plain" }),
        }),
      ]);
      copyStatus.textContent = copyHint;
      return;
    }
  } catch {
    /* fallback */
  }

  htmlOutput.select();
  document.execCommand("copy");
  copyStatus.textContent = "Usa «Abrir para copiar» y sigue los pasos de la ventana.";
}

function openCopyWindow() {
  const fragment = buildSignatureHtml(getFormData(), { forCopy: true });
  const html = wrapOutlookDocument(fragment);
  const win = window.open("", "_blank", "width=800,height=640");
  if (!win) {
    copyStatus.textContent = "Permite ventanas emergentes para abrir la firma.";
    return;
  }
  win.document.open();
  win.document.write(
    `${html}
    <div style="margin:20px 16px 0;padding:12px;background:#fff8e6;border:1px solid #f0d78c;font:14px Arial,sans-serif;">
      <strong>Pegar en Outlook para Mac</strong><br><br>
      1. Cmd+A → Cmd+C en esta ventana<br>
      2. Outlook → Configuración → Firmas → editar firma<br>
      3. Desmarca «Usar siempre mi tipo de letra predefinido»<br>
      4. Cmd+V en el cuadro de firma (no en un correo nuevo)<br>
      5. Clic en el logo → cambia «Tamaño de la imagen» (no uses Tamaño real)<br>
      6. Si falta el logo: arrastra <code>assets/logo-firma.png</code> al cuadro de firma
    </div>`
  );
  win.document.close();
  copyStatus.textContent =
    "Ventana abierta: copia desde ahí y pega en Configuración → Firmas de Outlook.";
}

async function copySignature() {
  await copyForOutlook();
}

btnCopy.addEventListener("click", copyForOutlook);

document.getElementById("btn-open-copy")?.addEventListener("click", openCopyWindow);

btnDownload.addEventListener("click", () => {
  const blob = new Blob([htmlOutput.value], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "firma-stiloq.html";
  a.click();
  URL.revokeObjectURL(url);
  copyStatus.textContent = "Archivo firma-stiloq.html descargado.";
});

function initLogoUrl() {
  if (!logoUrlInput) return;
  const saved = localStorage.getItem("stiloq_logo_url");
  logoUrlInput.value = saved || PUBLIC_LOGO_URL;
  checkLogoUrl(logoUrlInput.value);
}

function onLogoUrlChange() {
  const url = resolveLogoUrl(getFormData());
  if (/^https?:\/\//i.test(url)) {
    probeLogoFromUrl(url);
  }
}

logoUrlInput?.addEventListener("change", () => {
  if (logoUrlInput.value.trim()) {
    localStorage.setItem("stiloq_logo_url", logoUrlInput.value.trim());
  }
  onLogoUrlChange();
});

initLogoUrl();
onFormUpdate();
loadLogoBase64();
onLogoUrlChange();
