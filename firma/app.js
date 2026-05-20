const LOGO_PATH = "assets/logo.png";
const PUBLIC_LOGO_URL = "https://www.stiloq.net/assets/logo-firma.png";
let publicLogoNatW = 288;
let publicLogoNatH = 71;
let publicLogoLeftInset = 0;
let publicLogoTopInset = 0;
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
let logoLeftInsetPx = 44;
let logoTopInsetPx = 59;
let logoRightInsetPx = 43;
let logoNaturalWidth = 375;
let logoNaturalHeight = 190;
let logoIsTrimmed = false;

function measureLogoBounds(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  let data;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    return null;
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
  if (top >= bottom || left >= right) return null;
  return {
    top,
    left,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

function buildTrimmedLogo(img) {
  const bounds = measureLogoBounds(img);
  if (!bounds) {
    logoIsTrimmed = false;
    return "";
  }
  const canvas = document.createElement("canvas");
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(
    img,
    bounds.left,
    bounds.top,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height
  );
  logoIsTrimmed = true;
  logoLeftInsetPx = 0;
  logoTopInsetPx = 0;
  logoRightInsetPx = 0;
  logoNaturalWidth = bounds.width;
  logoNaturalHeight = bounds.height;
  try {
    return canvas.toDataURL("image/png");
  } catch {
    logoIsTrimmed = false;
    return "";
  }
}

function footerAlignPx(logoAncho, isExternalUrl) {
  if (logoIsTrimmed && !isExternalUrl) return 0;
  const natural = logoNaturalWidth || 375;
  const inset = logoLeftInsetPx || 44;
  return Math.round(inset * (logoAncho / natural));
}

function logoTopOffsetPx(logoH, isExternalUrl) {
  if (logoIsTrimmed && !isExternalUrl) return 0;
  const naturalH = 190;
  const inset = logoTopInsetPx || 59;
  return Math.round(inset * (logoH / naturalH));
}

function logoDisplayWidth(logoW, isExternalUrl) {
  if (logoIsTrimmed && !isExternalUrl) return logoW;
  const natural = logoNaturalWidth || 375;
  const right = logoRightInsetPx || 43;
  const crop = Math.round(right * (logoW / natural) * 0.25);
  return Math.max(80, logoW - crop);
}

function logoImageSize(logoW, logoUrl) {
  const usePublic = logoUrl.includes("logo-firma.png");
  const imgW = usePublic ? logoW : logoDisplayWidth(logoW, /^https?:\/\//i.test(logoUrl));
  const natW = usePublic ? publicLogoNatW : logoIsTrimmed ? logoNaturalWidth : 375;
  const natH = usePublic ? publicLogoNatH : logoIsTrimmed ? logoNaturalHeight : 190;
  const imgH = Math.max(1, Math.round((imgW * natH) / natW));
  return { imgW, imgH };
}

function fallbackPublicInsets() {
  if (publicLogoNatW <= 300) {
    publicLogoLeftInset = 0;
    publicLogoTopInset = 0;
  } else {
    publicLogoLeftInset = 44;
    publicLogoTopInset = 59;
  }
}

function logoInsetsScaled(imgW, imgH, logoUrl) {
  if (logoUrl.includes("logo-firma.png")) {
    return {
      left: Math.round(publicLogoLeftInset * (imgW / publicLogoNatW)),
      top: Math.round(publicLogoTopInset * (imgH / publicLogoNatH)),
    };
  }
  return {
    left: logoIsTrimmed && !/^https?:\/\//i.test(logoUrl) ? 0 : footerAlignPx(imgW, true),
    top: logoIsTrimmed && !/^https?:\/\//i.test(logoUrl) ? 0 : logoTopOffsetPx(imgH, true),
  };
}

function probePublicLogoSize() {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    if (img.naturalWidth > 0) {
      publicLogoNatW = img.naturalWidth;
      publicLogoNatH = img.naturalHeight;
      const bounds = measureLogoBounds(img);
      if (bounds) {
        publicLogoLeftInset = bounds.left;
        publicLogoTopInset = bounds.top;
      } else {
        fallbackPublicInsets();
      }
      onFormUpdate();
    }
  };
  img.onerror = () => {
    fallbackPublicInsets();
    onFormUpdate();
  };
  img.src = `${PUBLIC_LOGO_URL}?v=${Date.now()}`;
}

async function loadLogoBase64() {
  const img = document.getElementById("logo-source");

  const apply = async () => {
    if (img?.naturalWidth) {
      logoNaturalWidth = img.naturalWidth;
      logoNaturalHeight = img.naturalHeight;
      const bounds = measureLogoBounds(img);
      if (bounds) {
        logoLeftInsetPx = bounds.left;
        logoTopInsetPx = bounds.top;
        logoRightInsetPx = img.naturalWidth - bounds.left - bounds.width;
      }
      logoBase64 = buildTrimmedLogo(img) || "";
    }
    if (!logoBase64) {
      try {
        const res = await fetch(LOGO_PATH);
        const blob = await res.blob();
        logoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        logoBase64 = "";
      }
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
    mostrarMovil: fd.get("mostrarMovil") === "on",
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
  return `<a href="${escapeHtml(href)}" style="color:#0078a8;text-decoration:underline;">${fontStyle("#0078a8", FONT.body, label)}</a>`;
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
body, table, td, p, a, span, font { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
</head>
<body style="margin:0;padding:16px;">
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

function lineHtml(content, margin = "0 0 2px 0") {
  return `<p style="margin:${margin};padding:0;line-height:1.1;mso-line-height-rule:exactly;">${content}</p>`;
}

function resolveLogoUrl(data) {
  const url = data.logoUrl?.trim();
  return url || PUBLIC_LOGO_URL;
}

function buildSignatureHtml(data) {
  const logoUrl = resolveLogoUrl(data);
  const isExternalUrl = /^https?:\/\//i.test(logoUrl);
  const logoSrc = isExternalUrl ? logoUrl : logoBase64 || LOGO_PATH;
  const logoW = data.logoAncho;
  const { imgW, imgH } = logoImageSize(logoW, logoUrl);
  const insets = logoInsetsScaled(imgW, imgH, logoUrl);
  const topOff = insets.top;
  const imgMarginTop = topOff > 0 ? `margin-top:-${topOff}px;` : "";
  const logoCellW = imgW + LOGO_GAP;
  const textCellW = TEXT_COL_W;
  const totalW = logoCellW + textCellW;
  const telefonoText = data.telefono
    ? data.mostrarMovil
      ? `Móvil: ${data.telefono}`
      : data.telefono
    : "";

  const contactLines = [];
  if (data.nombre) contactLines.push(lineHtml(`<b>${fontStyle("#000000", FONT.nombre, data.nombre)}</b>`));
  if (data.cargo) contactLines.push(lineHtml(`<i>${fontStyle("#555555", FONT.body, data.cargo)}</i>`));
  if (data.email) contactLines.push(lineHtml(linkStyle(`mailto:${data.email}`, data.email)));
  if (telefonoText) contactLines.push(lineHtml(fontStyle("#000000", FONT.body, telefonoText)));
  if (data.web) contactLines.push(lineHtml(linkStyle(webHref(data.web), data.web)));
  if (data.direccion1) contactLines.push(lineHtml(fontStyle("#000000", FONT.body, data.direccion1), "6px 0 0 0"));
  if (data.direccion2) contactLines.push(lineHtml(fontStyle("#000000", FONT.body, data.direccion2), "1px 0 0 0"));

  const logoBlock = `<table align="left" border="0" cellpadding="0" cellspacing="0" width="${imgW}" style="border-collapse:collapse;width:${imgW}px;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td align="left" valign="top" style="width:${imgW}px;line-height:0;font-size:0;vertical-align:top;mso-line-height-rule:exactly;"><img src="${logoSrc}" alt="" width="${imgW}" height="${imgH}" border="0" style="display:block;${imgMarginTop}width:${imgW}px !important;height:${imgH}px !important;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;mso-width-percent:0;mso-height-percent:0;"></td></tr></table>`;

  const mainTable = `<table align="left" border="0" cellpadding="0" cellspacing="0" width="${totalW}" style="border-collapse:collapse;table-layout:fixed;width:${totalW}px;min-width:${totalW}px;mso-table-lspace:0pt;mso-table-rspace:0pt;">
<colgroup><col span="1" width="${logoCellW}" style="width:${logoCellW}px;"><col span="1" width="${textCellW}" style="width:${textCellW}px;"></colgroup>
<tr>
<td align="left" valign="top" width="${logoCellW}" style="width:${logoCellW}px;min-width:${logoCellW}px;max-width:${logoCellW}px;vertical-align:top;padding:0 ${LOGO_GAP}px 0 0;mso-line-height-rule:exactly;">${logoBlock}</td>
<td align="left" valign="top" width="${textCellW}" style="width:${textCellW}px;min-width:${textCellW}px;max-width:${textCellW}px;vertical-align:top;font-family:Arial,Helvetica,sans-serif;mso-line-height-rule:exactly;">${contactLines.join("")}</td>
</tr>
</table>`;

  const footerTopGap = data.direccion1 || data.direccion2 ? 18 : 14;
  const align = insets.left;
  const spacer =
    align > 0
      ? `<td width="${align}" style="width:${align}px;padding:0;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td>`
      : "";
  const footerGap = "margin:0 0 2px 0;padding:0;line-height:1.15;white-space:nowrap;mso-line-height-rule:exactly;";

  const footerRows = [];
  if (data.mostrarAvisos) {
    footerRows.push(
      `<tr>${spacer}<td nowrap="nowrap" style="${footerGap}">${fontStyle("#999999", FONT.aviso, AVISO_EN)}</td></tr>`,
      `<tr>${spacer}<td nowrap="nowrap" style="${footerGap}">${fontStyle("#999999", FONT.aviso, AVISO_ES)}</td></tr>`
    );
  }
  if (data.mostrarEco && data.mensajeEco) {
    footerRows.push(
      `<tr>${spacer}<td nowrap="nowrap" style="margin:0;padding:0;line-height:1.15;white-space:nowrap;mso-line-height-rule:exactly;">${fontStyle("#2e7d32", FONT.eco, data.mensajeEco)}</td></tr>`
    );
  }

  const footer =
    footerRows.length > 0
      ? `<table align="left" border="0" cellpadding="0" cellspacing="0" width="${totalW}" style="border-collapse:collapse;table-layout:fixed;width:${totalW}px;min-width:${totalW}px;margin:${footerTopGap}px 0 0 0;mso-table-lspace:0pt;mso-table-rspace:0pt;">${footerRows.join("")}</table>`
      : "";

  return `<!-- Firma STILOQ -->
${mainTable}
${footer}`;
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
  wrapper.style.cssText = "position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;";
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
  const fragment = buildSignatureHtml(getFormData());
  if (!fragment.includes("https://")) {
    copyStatus.textContent =
      "Falta la URL del logo. Rellena https://www.stiloq.net/assets/logo-firma.png y vuelve a copiar.";
    copyStatus.className = "copy-status err";
    return;
  }
  copyStatus.className = "copy-status";
  const cfHtml = buildCfHtml(fragment);

  if (copyRichHtml(fragment)) {
    copyStatus.textContent =
      "Firma copiada (logo por URL). Pégala en Outlook → Configuración → Firmas. Desmarca la fuente predefinida.";
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
      copyStatus.textContent =
        "Firma copiada. Pégala en Configuración → Firmas de Outlook (no en el cuerpo del mensaje).";
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
  const fragment = buildSignatureHtml(getFormData());
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
      6. Si falta el logo: arrastra <code>assets/logo.png</code> al cuadro de firma
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

logoUrlInput?.addEventListener("change", () => {
  if (logoUrlInput.value.trim()) {
    localStorage.setItem("stiloq_logo_url", logoUrlInput.value.trim());
  }
});

initLogoUrl();
probePublicLogoSize();
onFormUpdate();
loadLogoBase64();
