class PickerBridge {
  constructor(pickerUrl) {
    this.pickerUrl = pickerUrl;
    this.pickerOrigin = new URL(pickerUrl).origin;
    this.intentId = null;
    this.display = "iframe";
    this.pickerWindow = null;
    this.pendingFiles = null;
    this.resultTarget = document.getElementById("result");

    this._initOverlay();
    this._listenMessages();
  }

  _initOverlay() {
    const overlay = document.getElementById("picker-overlay");
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) this.close();
      });
    }
  }

  _listenMessages() {
    window.addEventListener("message", (e) => {
      if (e.origin !== this.pickerOrigin) {
        console.debug("[bridge] ignoring message from", e.origin, "(expected", this.pickerOrigin + ")");
        return;
      }

      const data = e.data;
      if (!data || !data.status) {
        console.debug("[bridge] ignoring message: no status", data);
        return;
      }
      if (data.id && data.id !== this.intentId) {
        console.warn("[bridge] ignoring message: id mismatch", data.id, "!==", this.intentId);
        return;
      }

      console.debug("[bridge] received:", data.status, data);

      if (data.status === "ready" && this.pendingFiles) {
        if (!this.pickerWindow) {
          console.error("[bridge] received ready but no picker window reference");
          return;
        }
        console.debug("[bridge] sending save payload:", this.pendingFiles.length, "file(s)");
        this.pickerWindow.postMessage(
          { status: "save", id: this.intentId, results: this.pendingFiles },
          this.pickerOrigin
        );
      } else if (data.status === "ready" && !this.pendingFiles) {
        console.debug("[bridge] received ready but no pending files (PICK mode or already sent)");
      } else if (["done", "cancel", "error"].includes(data.status)) {
        console.debug("[bridge] rendering result for status:", data.status);
        fetch("/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
          .then(r => {
            if (!r.ok) console.error("[bridge] /result returned", r.status);
            return r.text();
          })
          .then(html => { this.resultTarget.innerHTML = html; });
        this.close();
      }
    });
  }

  open(params) {
    this.intentId = generateId();
    params.set("clientUrl", window.location.origin);
    params.set("id", this.intentId);

    const url = this.pickerUrl + "?" + params.toString();
    console.debug("[bridge] opening picker:", this.display, url);

    if (this.display === "popup") {
      this.pickerWindow = window.open(url, "picker", "width=800,height=600");
      if (!this.pickerWindow) {
        console.error("[bridge] popup blocked by browser");
      }
    } else {
      const iframe = document.getElementById("picker-iframe");
      if (!iframe) {
        console.error("[bridge] #picker-iframe not found in DOM");
        return;
      }
      iframe.src = url;
      this.pickerWindow = iframe.contentWindow;
      document.getElementById("picker-overlay").classList.add("active");
    }
  }

  close() {
    console.debug("[bridge] closing picker");
    this.pendingFiles = null;
    if (this.display === "popup") {
      if (this.pickerWindow && !this.pickerWindow.closed) {
        this.pickerWindow.close();
      }
      this.pickerWindow = null;
    } else {
      const overlay = document.getElementById("picker-overlay");
      const iframe = document.getElementById("picker-iframe");
      if (overlay) overlay.classList.remove("active");
      if (iframe) iframe.src = "";
    }
  }
}
