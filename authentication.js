/* ==========================================================================
   CURONEX — Unique Authentication Page
   Handles: icon placeholders, mandatory-field validation, PIN/QR generation,
   and downloading the generated pass.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------------
     0. Icon placeholders — every <img> (logo, sidebar icons, help icon,
        pass logo) is left with an empty src so real icons can be dropped
        in later. Until a src is set, keep the box reserved but invisible
        instead of showing a broken-image glyph.
  --------------------------------------------------------------------- */
  document.querySelectorAll('img').forEach(img => {
    if (!img.getAttribute('src')) {
      img.classList.add('img-empty');
    } else {
      img.addEventListener('error', () => img.classList.add('img-empty'));
      img.addEventListener('load', () => img.classList.remove('img-empty'));
    }
  });

  /* ---------------------------------------------------------------------
     1. Mandatory field validation
  --------------------------------------------------------------------- */
  const fieldGroups = Array.from(document.querySelectorAll('.field-group[data-required="true"]'));
  const verifyCheck = document.getElementById('verifyCheck');
  const generateBtn = document.getElementById('generateBtn');
  const verifyWarning = document.getElementById('verifyWarning');
  const fieldsStatusBadge = document.getElementById('fieldsStatusBadge');

  function fieldIsEmpty(group) {
    const input = group.querySelector('input');
    return input.value.trim().length === 0;
  }

  function showError(group) {
    group.classList.add('has-error');
  }

  function clearError(group) {
    group.classList.remove('has-error');
  }

  function refreshFieldStatusBadge() {
    const total = fieldGroups.length;
    const complete = fieldGroups.filter(g => !fieldIsEmpty(g)).length;
    fieldsStatusBadge.textContent = `${complete}/${total} fields complete`;
    fieldsStatusBadge.className = 'badge ' + (complete === total ? 'badge-success' : 'badge-info');
  }

  function allRequiredFilled() {
    return fieldGroups.every(g => !fieldIsEmpty(g));
  }

  function updateGenerateAvailability() {
    const ready = allRequiredFilled() && verifyCheck.checked;
    generateBtn.disabled = !ready;
    verifyWarning.style.visibility = ready ? 'hidden' : 'visible';
  }

  // Run initial validation (so any field left blank shows red immediately)
  fieldGroups.forEach(group => {
    if (fieldIsEmpty(group)) showError(group);
  });
  refreshFieldStatusBadge();
  updateGenerateAvailability();

  fieldGroups.forEach(group => {
    const input = group.querySelector('input');

    // Clicking / focusing the field clears the red state immediately
    input.addEventListener('focus', () => clearError(group));

    // Typing keeps it in sync: red comes back only if the user leaves it empty
    input.addEventListener('input', () => {
      if (!fieldIsEmpty(group)) clearError(group);
      refreshFieldStatusBadge();
      updateGenerateAvailability();
    });

    input.addEventListener('blur', () => {
      if (fieldIsEmpty(group)) showError(group);
      refreshFieldStatusBadge();
      updateGenerateAvailability();
    });
  });

  verifyCheck.addEventListener('change', updateGenerateAvailability);

  /* ---------------------------------------------------------------------
     2. PIN + QR generation
  --------------------------------------------------------------------- */
  const passCard = document.getElementById('passCard');
  const passActions = document.getElementById('passActions');
  const pinValueEl = document.getElementById('pinValue');
  const passNameEl = document.getElementById('passName');
  const passCampEl = document.getElementById('passCamp');
  const qrCanvas = document.getElementById('qrCanvas');
  const toastMsg = document.getElementById('toastMsg');
  const saveImageWrap = document.getElementById('saveImageWrap');
  const passPreviewImg = document.getElementById('passPreviewImg');

  let qrInstance = null;
  let currentPin = null;
  let currentName = '';
  let currentCampLine = '';

  function generatePin() {
    let pin = '';
    for (let i = 0; i < 6; i++) pin += Math.floor(Math.random() * 10);
    return pin;
  }

  function showToast(text) {
    toastMsg.textContent = text;
    toastMsg.classList.add('visible');
    setTimeout(() => toastMsg.classList.remove('visible'), 2800);
  }

  // Wait (up to a short timeout) for the QRCode library to actually paint
  // its <canvas>, since it renders asynchronously on some browsers.
  function getQrSourceElement() {
    return qrCanvas.querySelector('canvas') || qrCanvas.querySelector('img');
  }

  /* -----------------------------------------------------------------
     Build the downloadable/saveable pass as a plain <canvas> drawing.
     Deliberately avoids html2canvas + external @font-face rasterization:
     pulling in the Google-Fonts stylesheet during a DOM screenshot taints
     the canvas on many mobile browsers, which silently breaks
     canvas.toDataURL()/toBlob() — that was the root cause of downloads
     not working. Plain canvas text with a system font has no such issue.
  ----------------------------------------------------------------- */
  function buildPassCanvas() {
    const W = 440, H = 600;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Card background + border
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#D9E6F5';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // Header band
    ctx.fillStyle = '#0B3D91';
    ctx.fillRect(0, 0, W, 76);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 22px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Curonex Camp Pass', W / 2, 46);

    // PIN block
    ctx.fillStyle = '#6B7280';
    ctx.font = '600 13px Arial, Helvetica, sans-serif';
    ctx.fillText('YOUR ACCESS PIN', W / 2, 112);

    ctx.fillStyle = '#0B3D91';
    ctx.font = '700 36px Arial, Helvetica, sans-serif';
    ctx.fillText(currentPin.split('').join('  '), W / 2, 158);

    ctx.fillStyle = '#102A43';
    ctx.font = '600 17px Arial, Helvetica, sans-serif';
    ctx.fillText(currentName, W / 2, 190);

    ctx.fillStyle = '#6B7280';
    ctx.font = '400 13px Arial, Helvetica, sans-serif';
    ctx.fillText(currentCampLine, W / 2, 210);

    // Verified badge
    ctx.fillStyle = '#E8F5E9';
    const badgeW = 84, badgeH = 26;
    const badgeX = (W - badgeW) / 2, badgeY = 222;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 13) : ctx.rect(badgeX, badgeY, badgeW, badgeH);
    ctx.fill();
    ctx.fillStyle = '#2E7D32';
    ctx.font = '600 12px Arial, Helvetica, sans-serif';
    ctx.fillText('Verified', W / 2, badgeY + 17);

    // QR code
    const qrSize = 190;
    const qrX = (W - qrSize) / 2;
    const qrY = 268;
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28);
    const qrSource = getQrSourceElement();
    if (qrSource) {
      try {
        ctx.drawImage(qrSource, qrX, qrY, qrSize, qrSize);
      } catch (e) {
        ctx.fillStyle = '#4B5563';
        ctx.font = '400 12px Arial, sans-serif';
        ctx.fillText('QR unavailable', W / 2, qrY + qrSize / 2);
      }
    }

    ctx.fillStyle = '#6B7280';
    ctx.font = '400 12px Arial, Helvetica, sans-serif';
    ctx.fillText('Scan at camp entry', W / 2, qrY + qrSize + 34);
    ctx.fillText('Keep this PIN &amp; QR private.'.replace('&amp;', '&'), W / 2, qrY + qrSize + 54);

    return canvas;
  }

  function renderPass() {
    const name = document.getElementById('fullName').value.trim() || 'Guest';
    const campId = document.querySelector('.summary-item:nth-child(1) .summary-value').textContent.trim();
    const hospital = document.querySelector('.summary-item:nth-child(4) .summary-value').textContent.trim();

    currentPin = generatePin();
    currentName = name;
    currentCampLine = `${hospital} · ${campId}`;

    pinValueEl.textContent = currentPin.split('').join('  ');
    passNameEl.textContent = name;
    passCampEl.textContent = currentCampLine;

    // (Re)draw the QR code
    qrCanvas.innerHTML = '';
    const qrPayload = `CURONEX-AUTH|PIN:${currentPin}|NAME:${name}|CAMP:${campId}`;

    if (window.QRCode) {
      qrInstance = new QRCode(qrCanvas, {
        text: qrPayload,
        width: 128,
        height: 128,
        colorDark: '#0B3D91',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      qrCanvas.textContent = 'QR unavailable offline';
    }

    passCard.classList.add('visible');
    passActions.classList.add('visible');

    // Give qrcode.js a tick to paint its canvas, then build the
    // always-visible saveable preview image (long-press-to-save fallback).
    setTimeout(() => {
      const composite = buildPassCanvas();
      passPreviewImg.src = composite.toDataURL('image/png');
      saveImageWrap.hidden = false;
    }, 60);
  }

  generateBtn.addEventListener('click', () => {
    if (generateBtn.disabled) return;
    renderPass();
    showToast('PIN & QR generated successfully.');
  });

  document.getElementById('regenerateBtn').addEventListener('click', () => {
    renderPass();
    showToast('A new PIN & QR have been generated.');
  });

  /* ---------------------------------------------------------------------
     3. Download the generated pass as an image

     Uses canvas.toBlob() + an object URL rather than a raw data: URI —
     data: URIs are what most commonly fail to trigger a save prompt on
     mobile browsers and in-app webviews (e.g. iOS Safari, WhatsApp).
     The always-visible image above is kept as a guaranteed fallback:
     if the browser blocks the programmatic download entirely, the user
     can still press-and-hold that image to save it.
  --------------------------------------------------------------------- */
  document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!currentPin) return;

    const composite = buildPassCanvas();

    composite.toBlob((blob) => {
      if (!blob) {
        showToast('Download failed — please long-press the image below to save it.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Curonex-Camp-Pass-${currentPin}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast('Your PIN & QR pass has been downloaded.');
    }, 'image/png');
  });

});
