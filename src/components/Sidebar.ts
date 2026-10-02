import type { View } from '../state/app-state';

const ITEMS: [View, string][] = [['simulation', 'Simulation'], ['periodic', 'Periodic Table'], ['reactions', 'Reactions'], ['library', 'Library'], ['history', 'History'], ['settings', 'Settings']];

export function renderSidebar(active: View): string {
  return `<ul>${ITEMS.map(([v, l]) =>
    `<li><button class="navitem" data-action="nav" data-view="${v}" ${v === active ? 'aria-current="page"' : ''}>${l}</button></li>`).join('')}</ul>
  <p class="quote">“Small changes create big results”</p>`;
}
