const searchBar = document.getElementById("facet-sidebar");
const SCROLL_THRESHOLD = 50; // px scrolled before the class is added

function updateHeader() {
  console.log("search bar", searchBar);
  searchBar?.classList.toggle("scrolled", window.scrollY > SCROLL_THRESHOLD);
}

window.addEventListener("scroll", updateHeader, { passive: true });

updateHeader();
