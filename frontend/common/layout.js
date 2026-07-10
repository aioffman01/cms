/**
 * layout.js - 사이드바 공통 레이아웃 관리
 * 모든 인증 필요 페이지에서 include
 */

/**
 * 레이아웃 초기화: 인증 확인 후 사이드바 렌더링
 * @param {string} activePage - 현재 활성 메뉴 키
 * @returns {object|null} 사용자 정보 또는 null (미로그인 리다이렉트)
 */
async function initLayout(activePage = '') {
  const res = await API.get('/member/me.php');

  if (!res.success) {
    window.location.href = '../auth/login.html';
    return null;
  }

  const user = res.data;
  renderSidebar(user, activePage);
  return user;
}

/**
 * 사이드바 HTML 생성 및 삽입
 */
function renderSidebar(user, activePage) {
  const isAdmin = user.role === 'admin';

  const nav = `
    <li class="nav-section-label">고객 관리</li>
    <li class="nav-item ${activePage === 'customer-list'   ? 'active' : ''}">
      <a href="../customer/list.html"><span class="nav-icon">▤</span><span>고객 목록</span></a>
    </li>

    <li class="nav-section-label">내 계정</li>
    <li class="nav-item ${activePage === 'profile' ? 'active' : ''}">
      <a href="../member/profile.html"><span class="nav-icon">◎</span><span>내 정보 수정</span></a>
    </li>

    ${isAdmin ? `
    <li class="nav-section-label">관리자</li>
    <li class="nav-item ${activePage === 'member-manage' ? 'active' : ''}">
      <a href="../member/manage.html"><span class="nav-icon">◈</span><span>회원 관리</span></a>
    </li>
    <li class="nav-item ${activePage === 'hardware-list' ? 'active' : ''}">
      <a href="../hardware/list.html"><span class="nav-icon">⬡</span><span>하드웨어 관리</span></a>
    </li>
    ` : ''}
  `;

  const html = `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">CMS</div>
        <div class="logo-sub">고객 관리 시스템</div>
      </div>
      <nav class="sidebar-nav">
        <ul>${nav}</ul>
      </nav>
      <div class="sidebar-footer">
        <div class="user-info">
          <span class="user-name-display">${escHtml(user.name)}</span>
          <span class="user-role-badge ${isAdmin ? 'admin' : 'user'}">${isAdmin ? '관리자' : '일반사용자'}</span>
        </div>
        <button class="btn-logout" id="btn-logout">로그아웃</button>
      </div>
    </aside>
  `;

  const container = document.getElementById('sidebar-container');
  if (container) container.innerHTML = html;

  document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
}

/** 로그아웃 처리 */
async function handleLogout() {
  await API.post('/member/logout.php', {});
  window.location.href = '../auth/login.html';
}

/** HTML 이스케이프 */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 알림 메시지 표시 */
function showAlert(container, message, type = 'error') {
  const el = typeof container === 'string'
    ? document.getElementById(container)
    : container;
  if (!el) return;

  const icons = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' };
  el.innerHTML = `
    <div class="alert alert-${type}">
      <span>${icons[type] || '!'}</span>
      <span>${escHtml(message)}</span>
    </div>`;

  // 5초 후 자동 제거
  setTimeout(() => { if (el) el.innerHTML = ''; }, 5000);
}

/** 로딩 스피너 HTML */
function loadingHTML(text = '불러오는 중') {
  return `<div class="loading"><div class="spinner"></div>${escHtml(text)}...</div>`;
}

/** 날짜 포맷 (YYYY-MM-DD HH:MM) */
function fmtDate(dateStr) {
  if (!dateStr) return '-';
  return dateStr.slice(0, 16).replace('T', ' ');
}
