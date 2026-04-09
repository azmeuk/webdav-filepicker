let selectedFile = null;

document.querySelectorAll(".file-entry[data-path]").forEach(el => {
  el.addEventListener("click", () => {
    document.querySelectorAll(".file-entry").forEach(e => e.classList.remove("selected"));
    el.classList.add("selected");
    selectedFile = {
      name: el.dataset.name,
      path: el.dataset.path,
      size: parseInt(el.dataset.size),
      contentType: el.dataset.contentType,
    };
    document.getElementById("btn-select").disabled = false;
  });
});

document.getElementById("btn-select").addEventListener("click", () => {
  if (selectedFile) {
    console.log("Selected:", selectedFile);
    alert("Fichier sélectionné: " + selectedFile.name);
  }
});

document.getElementById("btn-cancel").addEventListener("click", () => {
  console.log("Cancelled");
  alert("Annulé");
});
