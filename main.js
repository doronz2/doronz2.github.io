// Research area tab switching
const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));

function activateTab(btn, shouldFocus = false) {
  const tab = btn.dataset.tab;

  tabButtons.forEach(b => {
    const isActive = b === btn;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', String(isActive));
    b.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  tabPanels.forEach(panel => {
    const isActive = panel.id === `tab-${tab}`;
    panel.classList.toggle('active', isActive);
    panel.hidden = !isActive;
  });

  if (shouldFocus) btn.focus();
}

tabButtons.forEach((btn, index) => {
  btn.addEventListener('click', () => activateTab(btn));

  btn.addEventListener('keydown', event => {
    const lastIndex = tabButtons.length - 1;
    let nextIndex = index;

    if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = lastIndex;
    else return;

    event.preventDefault();
    activateTab(tabButtons[nextIndex], true);
  });
});
