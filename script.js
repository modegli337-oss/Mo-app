const imageInput = document.getElementById("imageInput");
const uploadBox = document.getElementById("uploadBox");
const previewWrap = document.getElementById("previewWrap");
const preview = document.getElementById("preview");
const changeBtn = document.getElementById("changeBtn");
const generateBtn = document.getElementById("generateBtn");
const resetBtn = document.getElementById("resetBtn");
const status = document.getElementById("status");
const result = document.getElementById("result");
const canvas = document.getElementById("qrCanvas");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");
const urlBox = document.getElementById("urlBox");

let selectedFile = null;
let imageUrl = "";

imageInput.addEventListener("change", handleFile);
changeBtn.addEventListener("click", () => imageInput.click());
resetBtn.addEventListener("click", resetAll);
generateBtn.addEventListener("click", generateQR);

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!["image/png","image/jpeg","image/webp"].includes(file.type)) {
    setStatus("اختر PNG أو JPG أو WEBP فقط.");
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    setStatus("حجم الصورة صغير. اختر صورة أقل من 8MB.");
    return;
  }

  selectedFile = file;
  imageUrl = URL.createObjectURL(file);
  preview.src = imageUrl;
  uploadBox.classList.add("hidden");
  previewWrap.classList.remove("hidden");
  generateBtn.disabled = false;
  result.classList.add("hidden");
  setStatus("الصورة جاهزة. اضغط «إنشاء QR».");
}

async function generateQR() {
  if (!selectedFile) return;

  generateBtn.disabled = true;
  setStatus("جارٍ رفع الصورة وإنشاء QR...");

  try {
    // Public image hosting is used so the QR contains a short web URL.
    const form = new FormData();
    form.append("image", selectedFile);

    const response = await fetch("https://api.imgbb.com/1/upload?key=2a7332dd0a431d2b1bdb333fdaed690e", {
      method: "POST",
      body: form
    });

    if (!response.ok) throw new Error("upload");
    const data = await response.json();
    if (!data.success || !data.data?.url) throw new Error("upload");

    const publicUrl = data.data.url;
    await QRCode.toCanvas(canvas, publicUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M"
    });

    urlBox.textContent = publicUrl;
    result.classList.remove("hidden");
    result.scrollIntoView({behavior:"smooth", block:"center"});
    setStatus("تم إنشاء QR بنجاح.");
  } catch (error) {
    setStatus("لم يتم الرفع. ضع مفتاح ImgBB في script.js أولًا.");
  } finally {
    generateBtn.disabled = false;
  }
}

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "mo-qr.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

copyBtn.addEventListener("click", async () => {
  const url = urlBox.textContent.trim();
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    copyBtn.textContent = "تم النسخ ✓";
    setTimeout(() => copyBtn.textContent = "نسخ رابط الصورة", 1600);
  } catch {
    setStatus("انسخ الرابط يدويًا من المربع.");
  }
});

function resetAll() {
  selectedFile = null;
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = "";
  imageInput.value = "";
  preview.removeAttribute("src");
  uploadBox.classList.remove("hidden");
  previewWrap.classList.add("hidden");
  result.classList.add("hidden");
  generateBtn.disabled = true;
  urlBox.textContent = "";
  setStatus("");
}

function setStatus(message) {
  status.textContent = message;
}
