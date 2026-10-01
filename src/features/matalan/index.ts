const searchBar = document.getElementById("facet-sidebar");

function updateHeader() {
  searchBar?.classList.toggle("scrolled", window.scrollY > 50);
}

window.addEventListener("scroll", updateHeader, { passive: true });

updateHeader();
