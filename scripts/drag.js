// Dollmaker NEO mobile/static edition.
// Native Pointer Events replace jQuery UI dragging to provide stable touch controls.

(function () {
  "use strict";

  const config = window.DOLLMAKER_CONFIG || {
    canvas: { width: 249, height: 400 },
    avatar: { x: 74, y: 35, width: 100, height: 100 },
    snapRules: [],
    fallback: { mode: "center" }
  };

  let dragState = null;
  let stackOrder = 20;
  let lockedScrollY = 0;

  window.toggleFullScreen = async function toggleFullScreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen is not available in this browser.", error);
    }
  };

  function basename(path) {
    const cleanPath = String(path || "").split("?")[0].split("#")[0];
    return decodeURIComponent(cleanPath.substring(cleanPath.lastIndexOf("/") + 1));
  }

  function stripExtension(filename) {
    const dot = filename.lastIndexOf(".");
    return dot > 0 ? filename.substring(0, dot) : filename;
  }

  function lockPageScroll() {
    if (document.body.classList.contains("drag-scroll-lock")) return;
    lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add("drag-scroll-lock");
    document.body.classList.add("drag-scroll-lock");
  }

  function unlockPageScroll() {
    if (!document.body.classList.contains("drag-scroll-lock")) return;
    document.documentElement.classList.remove("drag-scroll-lock");
    document.body.classList.remove("drag-scroll-lock");
    if (Math.abs((window.scrollY || 0) - lockedScrollY) > 1) {
      window.scrollTo(0, lockedScrollY);
    }
  }

  function preventTouchScroll(event) {
    if (dragState) event.preventDefault();
  }

  function enforceLockedScroll() {
    if (dragState && Math.abs((window.scrollY || 0) - lockedScrollY) > 1) {
      window.scrollTo(0, lockedScrollY);
    }
  }

  function getSnapProfile(image) {
    const explicitX = Number.parseFloat(image.dataset.snapX);
    const explicitY = Number.parseFloat(image.dataset.snapY);
    if (Number.isFinite(explicitX) && Number.isFinite(explicitY)) {
      return { x: explicitX, y: explicitY, name: image.dataset.snapName || "Custom" };
    }

    const src = image.dataset.assetPath || image.getAttribute("src") || "";
    const rule = config.snapRules.find((item) => item.match && item.match.test(src));
    if (rule) return rule;

    const width = image.naturalWidth || image.width || 0;
    const height = image.naturalHeight || image.height || 0;
    return {
      name: "Centered fallback",
      x: Math.round((config.canvas.width - width) / 2),
      y: Math.round((config.canvas.height - height) / 2)
    };
  }

  function restoreInlineStyle(image, styleText) {
    if (styleText) image.setAttribute("style", styleText);
    else image.removeAttribute("style");
  }

  function removePlaceholder() {
    if (dragState && dragState.placeholder && dragState.placeholder.isConnected) {
      dragState.placeholder.remove();
    }
  }

  function insertByHomeOrder(panel, image) {
    const order = Number(image.dataset.homeOrder || 0);
    const siblings = Array.from(panel.querySelectorAll(":scope > img[data-home-order]"));
    const next = siblings.find((item) => Number(item.dataset.homeOrder || 0) > order);
    panel.insertBefore(image, next || null);
  }

  function returnPieceHome(image) {
    const panelId = image.dataset.homePanel;
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    image.classList.remove("equipped-piece", "dragging-piece");
    image.removeAttribute("data-equipped");
    image.removeAttribute("aria-pressed");
    image.removeAttribute("style");
    insertByHomeOrder(panel, image);
  }

  function snapPiece(image) {
    const bodyArea = document.getElementById("bodyArea");
    if (!bodyArea) return;

    const profile = getSnapProfile(image);
    removePlaceholder();
    image.classList.remove("dragging-piece");
    image.classList.add("equipped-piece");
    image.dataset.equipped = "true";
    image.setAttribute("aria-pressed", "true");
    image.style.position = "absolute";
    image.style.left = `${profile.x}px`;
    image.style.top = `${profile.y}px`;
    image.style.width = "auto";
    image.style.height = "auto";
    image.style.margin = "0";
    image.style.transform = "none";
    image.style.pointerEvents = "auto";
    image.style.zIndex = String(++stackOrder);
    bodyArea.appendChild(image);
    bodyArea.classList.remove("drop-ready");
  }

  function isInsideBody(clientX, clientY) {
    const bodyArea = document.getElementById("bodyArea");
    if (!bodyArea) return false;
    const rect = bodyArea.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  function clearDragVisuals(image) {
    image.classList.remove("dragging-piece");
    const bodyArea = document.getElementById("bodyArea");
    if (bodyArea) bodyArea.classList.remove("drop-ready");
    unlockPageScroll();
  }

  function restoreCancelledDrag(image) {
    removePlaceholder();
    if (dragState && dragState.wasEquipped) {
      snapPiece(image);
    } else if (dragState) {
      const home = document.getElementById(dragState.homePanel);
      restoreInlineStyle(image, dragState.originalStyle);
      image.classList.remove("dragging-piece");
      if (home) insertByHomeOrder(home, image);
    }
  }

  function beginPieceDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const image = event.currentTarget;
    if (!(image instanceof HTMLImageElement)) return;

    event.preventDefault();
    const rect = image.getBoundingClientRect();
    const wasEquipped = image.dataset.equipped === "true";
    let placeholder = null;

    if (!wasEquipped) {
      placeholder = document.createElement("span");
      placeholder.className = "piece-placeholder";
      placeholder.style.width = `${rect.width}px`;
      placeholder.style.height = `${rect.height}px`;
      image.parentNode.insertBefore(placeholder, image);
    }

    dragState = {
      image,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
      wasEquipped,
      homePanel: image.dataset.homePanel,
      originalStyle: image.getAttribute("style") || "",
      placeholder
    };

    lockPageScroll();
    image.classList.add("dragging-piece");
    image.style.position = "fixed";
    image.style.left = `${rect.left}px`;
    image.style.top = `${rect.top}px`;
    image.style.width = `${rect.width}px`;
    image.style.height = `${rect.height}px`;
    image.style.margin = "0";
    image.style.transform = "none";
    image.style.pointerEvents = "none";
    image.style.zIndex = "99999";
    document.body.appendChild(image);

    try {
      image.setPointerCapture(event.pointerId);
    } catch (_) {
      // Pointer capture is optional; document-level listeners remain active.
    }
  }

  function movePieceDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    event.preventDefault();

    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    if (Math.hypot(dx, dy) > 5) dragState.moved = true;

    const image = dragState.image;
    image.style.left = `${event.clientX - dragState.offsetX}px`;
    image.style.top = `${event.clientY - dragState.offsetY}px`;

    const bodyArea = document.getElementById("bodyArea");
    if (bodyArea) bodyArea.classList.toggle("drop-ready", isInsideBody(event.clientX, event.clientY));
  }

  function endPieceDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    event.preventDefault();

    const state = dragState;
    const image = state.image;
    const droppedOnBody = isInsideBody(event.clientX, event.clientY);
    dragState = state; // Keep state available to helper functions until cleanup finishes.

    if (!state.moved && !state.wasEquipped) {
      snapPiece(image); // A tap on a catalogue item also equips it on mobile.
    } else if (droppedOnBody) {
      snapPiece(image);
    } else if (state.wasEquipped) {
      removePlaceholder();
      returnPieceHome(image);
    } else {
      removePlaceholder();
      restoreInlineStyle(image, state.originalStyle);
      image.classList.remove("dragging-piece");
      const home = document.getElementById(state.homePanel);
      if (home) insertByHomeOrder(home, image);
    }

    clearDragVisuals(image);
    dragState = null;
  }

  function cancelPieceDrag(event) {
    if (!dragState || (event.pointerId !== undefined && event.pointerId !== dragState.pointerId)) return;
    const image = dragState.image;
    restoreCancelledDrag(image);
    clearDragVisuals(image);
    dragState = null;
  }

  function initializePieces() {
    const pieces = Array.from(document.querySelectorAll("#piecesArea img"));
    pieces.forEach((image, index) => {
      image.draggable = false;
      if (!image.dataset.assetPath) image.dataset.assetPath = image.getAttribute("src") || "";
      image.dataset.homePanel = image.parentElement.id;
      image.dataset.homeOrder = String(index);
      image.setAttribute("role", "button");
      image.setAttribute("tabindex", "0");
      image.setAttribute("aria-label", `Wear ${image.alt || image.title || "item"}`);
      image.addEventListener("pointerdown", beginPieceDrag);
      image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          snapPiece(image);
        }
      });
    });
  }

  function initializeTabs() {
    const tabsBar = document.getElementById("tabsbar");
    if (!tabsBar) return;
    const links = Array.from(tabsBar.querySelectorAll("a[href^='#tabs-']"));
    const panels = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    panels.forEach((panel) => panel.classList.add("ui-tabs-panel"));
    links.forEach((link, index) => {
      const item = link.parentElement;
      item.classList.add("ui-state-default", "ui-corner-top");
      link.setAttribute("role", "tab");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        activateTab(index);
      });
    });

    function activateTab(index) {
      links.forEach((link, currentIndex) => {
        const selected = currentIndex === index;
        link.parentElement.classList.toggle("ui-state-active", selected);
        link.setAttribute("aria-selected", selected ? "true" : "false");
        link.setAttribute("tabindex", selected ? "0" : "-1");
      });
      panels.forEach((panel, currentIndex) => {
        panel.classList.toggle("is-active", currentIndex === index);
        panel.hidden = currentIndex !== index;
      });
    }

    activateTab(0);
  }

  function initializeSwatches() {
    document.querySelectorAll("#swatchesArea a").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const targetId = link.parentElement.id.replace(/-switch$/, "");
        const targetImage = document.getElementById(targetId);
        if (!targetImage) return;

        const src = link.getAttribute("href") || "";
        const label = stripExtension(basename(src))
          .replaceAll("-slash-", "/")
          .replaceAll("``", '"')
          .replaceAll("`", "'");
        if (src) targetImage.src = src;
        else targetImage.removeAttribute("src");
        targetImage.alt = label || "No background";
        targetImage.title = label || "No background";
      });
    });
  }

  function initializeControls() {
    const instructions = document.getElementById("instructions");
    const instructionButton = document.getElementById("instrBtn");
    if (instructions && instructionButton) {
      instructionButton.addEventListener("click", () => {
        const willShow = instructions.hidden || getComputedStyle(instructions).display === "none";
        instructions.hidden = !willShow;
        instructions.style.display = willShow ? "block" : "none";
        instructionButton.setAttribute("aria-expanded", willShow ? "true" : "false");
      });
    }

    const resetButton = document.getElementById("reset");
    if (resetButton) resetButton.addEventListener("click", () => window.location.reload());

    const downloadDoll = document.getElementById("downloadDoll");
    if (downloadDoll) downloadDoll.addEventListener("click", () => exportDoll(false));

    const downloadAvatar = document.getElementById("downloadAvi");
    if (downloadAvatar) downloadAvatar.addEventListener("click", () => exportDoll(true));
  }

  async function renderDollCanvas() {
    const bodyArea = document.getElementById("bodyArea");
    if (!bodyArea || typeof window.html2canvas !== "function") {
      throw new Error("Image export library is not available.");
    }

    return window.html2canvas(bodyArea, {
      backgroundColor: null,
      allowTaint: true,
      useCORS: true,
      width: config.canvas.width,
      height: config.canvas.height,
      scale: 1,
      imageSmoothingEnabled: false,
      onclone: (clonedDocument) => {
        const clonedBody = clonedDocument.getElementById("bodyArea");
        if (clonedBody) {
          clonedBody.style.transform = "none";
          clonedBody.style.margin = "0";
          clonedBody.style.position = "relative";
        }
      }
    });
  }

  function saveCanvas(canvas, filename) {
    canvas.toBlob((blob) => {
      if (!blob) {
        window.alert("Could not create the PNG image.");
        return;
      }
      if (typeof window.saveAs === "function") {
        window.saveAs(blob, filename);
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  async function exportDoll(avatarOnly) {
    try {
      const fullCanvas = await renderDollCanvas();
      if (!avatarOnly) {
        saveCanvas(fullCanvas, "my_doll.png");
        return;
      }

      const avatar = config.avatar;
      const avatarCanvas = document.createElement("canvas");
      avatarCanvas.width = avatar.width;
      avatarCanvas.height = avatar.height;
      const context = avatarCanvas.getContext("2d");
      context.imageSmoothingEnabled = false;
      context.drawImage(
        fullCanvas,
        avatar.x,
        avatar.y,
        avatar.width,
        avatar.height,
        0,
        0,
        avatar.width,
        avatar.height
      );
      saveCanvas(avatarCanvas, "my_doll_avi.png");
    } catch (error) {
      console.error(error);
      window.alert("Unable to export the doll. Please open the game from a web server or GitHub Pages and try again.");
    }
  }

  document.addEventListener("pointermove", movePieceDrag, { passive: false });
  document.addEventListener("pointerup", endPieceDrag, { passive: false });
  document.addEventListener("pointercancel", cancelPieceDrag, { passive: false });
  document.addEventListener("touchmove", preventTouchScroll, { passive: false });
  document.addEventListener("wheel", preventTouchScroll, { passive: false });
  window.addEventListener("scroll", enforceLockedScroll, { passive: true });
  window.addEventListener("blur", cancelPieceDrag);

  document.addEventListener("DOMContentLoaded", () => {
    initializeTabs();
    initializePieces();
    initializeSwatches();
    initializeControls();
  });
})();
