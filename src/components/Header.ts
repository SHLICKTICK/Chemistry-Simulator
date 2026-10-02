export function renderHeader(): string {
  return `
  <a class="brand" href="#" data-action="nav" data-view="simulation" aria-label="ChemSim home">
    <svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
      <ellipse cx="16" cy="16" rx="13" ry="5"/><ellipse cx="16" cy="16" rx="13" ry="5" transform="rotate(60 16 16)"/><ellipse cx="16" cy="16" rx="13" ry="5" transform="rotate(120 16 16)"/><circle cx="16" cy="16" r="2" fill="currentColor"/>
    </svg><span>Chem<b>Sim</b></span>
  </a>
  <nav class="topnav" aria-label="Sections">
    <button data-action="nav" data-view="periodic">Explore</button>
    <button data-action="nav" data-view="simulation">Combine</button>
    <button data-action="nav" data-view="library">Discover</button>
  </nav>
  <label class="search"><span class="sr">Search elements</span>
    <input id="search" type="search" placeholder="Search elements, compounds…" autocomplete="off" />
  </label>
  <button id="install" class="ghost install" type="button" hidden>Install app</button>
  <button class="icon-btn" data-action="nav" data-view="settings" aria-label="Settings">⚙</button>`;
}
