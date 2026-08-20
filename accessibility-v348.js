(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.FitCoachAccessibility = api;
  if (root.document) api.install(root.document, root);
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const navigationState = (ids, activeId) => ids.map(id => ({
    id,
    current: id === activeId,
    hidden: id !== activeId
  }));

  function ensureId(control, prefix, index) {
    if (!control.id) control.id = `${prefix}-${index + 1}`;
    return control.id;
  }

  function associateLabels(document) {
    let generated = 0;
    [...document.querySelectorAll('label')].forEach((label, index) => {
      if (label.htmlFor) return;
      const control = label.querySelector('input, select, textarea') || label.nextElementSibling;
      if (!control?.matches?.('input, select, textarea')) return;
      label.htmlFor = ensureId(control, 'fc-field', index);
      generated += 1;
    });
    return generated;
  }

  function syncPages(document) {
    const pages = [...document.querySelectorAll('.page')];
    const activeId = pages.find(page => page.classList.contains('active'))?.id;
    const states = navigationState(pages.map(page => page.id), activeId);
    const navigation = document.querySelector('nav');
    if (navigation) navigation.setAttribute('aria-label', 'Navegación principal');

    states.forEach(state => {
      const page = document.getElementById(state.id);
      page?.setAttribute('aria-hidden', String(state.hidden));
      const heading = page?.querySelector('h1');
      if (heading) {
        const headingId = ensureId(heading, `${state.id}-title`, 0);
        page.setAttribute('aria-labelledby', headingId);
      }
      const button = document.querySelector(`nav button[data-go="${state.id}"]`);
      if (button) {
        button.setAttribute('aria-controls', state.id);
        if (state.current) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      }
    });
    return states;
  }

  function syncNutritionTabs(document) {
    const tabList = document.querySelector('#nutrition .tabs');
    const tabs = [...document.querySelectorAll('#nutrition [data-tab]')];
    if (tabList) tabList.setAttribute('role', 'tablist');
    tabs.forEach(tab => {
      const panelId = tab.dataset.tab;
      const panel = document.getElementById(panelId);
      const selected = tab.classList.contains('active') && !panel?.hidden;
      tab.id ||= `nutrition-tab-${panelId}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panelId);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
      }
    });
    return tabs;
  }

  function markStatusRegions(document) {
    ['macroResult', 'todaySummary', 'menuSummary', 'photoStatus'].forEach(id => {
      const element = document.getElementById(id);
      if (!element) return;
      element.setAttribute('role', 'status');
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-atomic', 'true');
    });
  }

  function ensureStylesheet(document) {
    if (document.querySelector('link[data-fitcoach-accessibility]')) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'accessibility-v348.css?v=3.4.4';
    stylesheet.dataset.fitcoachAccessibility = 'true';
    document.head.appendChild(stylesheet);
  }

  function install(document, view = globalThis) {
    let scheduled = false;
    const sync = () => {
      scheduled = false;
      associateLabels(document);
      syncPages(document);
      syncNutritionTabs(document);
      markStatusRegions(document);
    };
    const scheduleSync = () => {
      if (scheduled) return;
      scheduled = true;
      (view.requestAnimationFrame || view.setTimeout)(sync);
    };

    ensureStylesheet(document);
    sync();
    const observer = new view.MutationObserver(scheduleSync);
    const observerOptions = { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden'] };
    const main = document.querySelector('main');
    const navigation = document.querySelector('nav');
    if (main) observer.observe(main, observerOptions);
    if (navigation) observer.observe(navigation, { subtree: true, attributes: true, attributeFilter: ['class'] });

    document.addEventListener('click', event => {
      const navigationButton = event.target.closest?.('nav [data-go]');
      if (!navigationButton) return;
      (view.requestAnimationFrame || view.setTimeout)(() => {
        syncPages(document);
        const heading = document.querySelector('.page.active h1');
        if (heading) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
        }
      });
    });

    document.addEventListener('keydown', event => {
      const tab = event.target.closest?.('#nutrition [role="tab"]');
      if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = [...document.querySelectorAll('#nutrition [role="tab"]')];
      const index = tabs.indexOf(tab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });

    return { sync, disconnect: () => observer.disconnect() };
  }

  return { navigationState, associateLabels, syncPages, syncNutritionTabs, markStatusRegions, ensureStylesheet, install };
}));
