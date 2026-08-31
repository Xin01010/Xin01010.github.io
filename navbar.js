(() => {
  const canonicalUrl = 'https://xin01010.github.io/';
  const root = document.documentElement;
  const themeButton = document.querySelector('#theme-button');
  const shareButton = document.querySelector('#share-button');
  const shareMenu = document.querySelector('#share-menu');
  const copyButton = document.querySelector('#copy-link');
  const shareStatus = document.querySelector('#share-status');
  const dialog = document.querySelector('#search-dialog');
  const input = document.querySelector('#search-input');
  const results = document.querySelector('#search-results');
  const resultStatus = document.querySelector('#search-status');
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  let manualTheme = false;

  function setTheme(theme, remember = false) {
    root.dataset.theme = theme;
    const action = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    themeButton.setAttribute('aria-label', action);
    themeButton.title = action;
    if (remember) {
      manualTheme = true;
      try { localStorage.setItem('xin-homepage-theme', theme); } catch {}
    }
  }
  let savedTheme;
  try { savedTheme = localStorage.getItem('xin-homepage-theme'); } catch {}
  const requestedTheme = new URL(location.href).searchParams.get('theme');
  const selectedTheme = ['light', 'dark'].includes(requestedTheme) ? requestedTheme : savedTheme;
  manualTheme = ['light', 'dark'].includes(selectedTheme);
  setTheme(manualTheme ? selectedTheme : systemTheme.matches ? 'dark' : 'light');
  systemTheme.addEventListener('change', event => {
    if (!manualTheme) setTheme(event.matches ? 'dark' : 'light');
  });
  themeButton.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));

  function closeShare(returnFocus = false) {
    shareMenu.hidden = true;
    shareButton.setAttribute('aria-expanded', 'false');
    if (returnFocus) shareButton.focus();
  }
  shareButton.addEventListener('click', () => {
    const open = shareMenu.hidden;
    shareMenu.hidden = !open;
    shareButton.setAttribute('aria-expanded', String(open));
    shareStatus.textContent = 'Share your public homepage.';
    copyButton.querySelector('span').textContent = 'Copy link';
    if (open) copyButton.focus();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.share-wrap')) closeShare();
  });
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      copyButton.querySelector('span').textContent = 'Link copied';
      shareStatus.textContent = 'The homepage link is ready to paste.';
    } catch {
      document.querySelector('#share-url').select();
      shareStatus.textContent = 'Copy the selected link with Ctrl/Cmd+C.';
    }
  });
  const nativeShare = document.querySelector('#native-share');
  nativeShare.hidden = typeof navigator.share !== 'function';
  nativeShare.addEventListener('click', async () => {
    try { await navigator.share({ title: "Xin's Homepage", url: canonicalUrl }); }
    catch (error) { if (error.name !== 'AbortError') shareStatus.textContent = 'Please use Copy link instead.'; }
  });

  const searchSections = [
    { title: 'Bio', target: document.querySelector('.biography') },
    { title: 'Interests', target: document.querySelector('#interests-heading').parentElement },
    { title: 'Education', target: document.querySelector('#education-heading').parentElement },
  ].map(item => ({ ...item, text: item.target.textContent.replace(/\s+/g, ' ').trim() }));

  function renderResults() {
    const query = input.value.trim();
    const matches = query ? searchSections.filter(item => item.text.toLowerCase().includes(query.toLowerCase())) : [];
    results.replaceChildren();
    resultStatus.textContent = query ? `${matches.length} results` : '';
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'search-empty';
      empty.textContent = query ? `No results for “${query}”.` : 'Search your biography, interests, and education.';
      results.append(empty);
      return;
    }
    for (const item of matches) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'search-result';
      const heading = document.createElement('span');
      heading.className = 'result-heading';
      heading.textContent = item.title;
      const excerpt = document.createElement('span');
      excerpt.className = 'result-excerpt';
      const matchAt = item.text.toLowerCase().indexOf(query.toLowerCase());
      const start = Math.max(0, matchAt - 45);
      const end = Math.min(item.text.length, matchAt + query.length + 110);
      const mark = document.createElement('mark');
      mark.textContent = item.text.slice(matchAt, matchAt + query.length);
      excerpt.append((start ? '…' : '') + item.text.slice(start, matchAt), mark, item.text.slice(matchAt + query.length, end) + (end < item.text.length ? '…' : ''));
      button.append(heading, excerpt);
      button.addEventListener('click', () => {
        dialog.close();
        item.target.setAttribute('tabindex', '-1');
        item.target.focus({ preventScroll: true });
        item.target.scrollIntoView({ block: 'start' });
      });
      results.append(button);
    }
  }
  function openSearch() {
    closeShare();
    if (!dialog.open) dialog.showModal();
    input.value = '';
    renderResults();
    input.focus();
  }
  document.querySelector('#search-button').addEventListener('click', openSearch);
  document.querySelector('#close-search').addEventListener('click', () => dialog.close());
  input.addEventListener('input', renderResults);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') results.querySelector('button')?.click();
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    }
    if (event.key === 'Escape') {
      if (dialog.open) {
        event.preventDefault();
        dialog.close();
      }
      if (!shareMenu.hidden) closeShare(true);
    }
  });
})();
