/**
 * list.js — 고객 목록 페이지
 */

let currentUser = null;
let allCustomers = [];
let pendingHide = null; // { id, targetState }

(async () => {
  currentUser = await initLayout('customer-list');
  if (!currentUser) return;
  await loadCustomers();
  setupSearch();
  setupModal();
})();

async function loadCustomers() {
  const res = await API.get('/customer/list.php');

  if (!res.success) {
    document.getElementById('table-area').innerHTML =
      `<div class="alert alert-error" style="margin:16px">
         <span>✕</span><span>${res.message}</span></div>`;
    return;
  }

  allCustomers = res.data.customers || [];

  // 관리자 통계
  if (currentUser.role === 'admin' && res.data.stats) {
    renderStats(res.data.stats);
  }

  renderTable(allCustomers);
}

function renderStats(stats) {
  const el = document.getElementById('stats-area');
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${stats.total}</div>
      <div class="stat-label">전체 고객</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.visible}</div>
      <div class="stat-label">표시 중</div>
    </div>
    <div class="stat-item danger">
      <div class="stat-value">${stats.hidden}</div>
      <div class="stat-label">숨김 처리</div>
    </div>
  `;
}

function renderTable(customers) {
  const area = document.getElementById('table-area');

  if (customers.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">◻</span>
        <div class="empty-state-text">등록된 고객이 없습니다.</div>
        <a href="form.html" class="btn btn-primary">+ 고객 등록</a>
      </div>`;
    return;
  }

  const isAdmin = currentUser.role === 'admin';

  const rows = customers.map(c => {
    const hiddenClass = c.is_hidden ? 'row-hidden' : '';
    const hiddenBadge = isAdmin
      ? `<span class="badge ${c.is_hidden ? 'badge-hidden' : 'badge-visible'}">${c.is_hidden ? '숨김' : '표시'}</span>`
      : '';

    const hideBtn = isAdmin
      ? `<button class="btn btn-sm ${c.is_hidden ? 'btn-success' : 'btn-danger'}"
               onclick="openHideModal(${c.id}, ${c.is_hidden}, '${escHtml(c.company_name)}')">
           ${c.is_hidden ? '표시' : '숨김'}
         </button>`
      : '';

    return `
      <tr class="${hiddenClass}" data-id="${c.id}">
        <td><a href="detail.html?id=${c.id}" class="text-highlight">${escHtml(c.company_name)}</a></td>
        <td>${escHtml(c.contact_name) || '<span class="text-muted">-</span>'}</td>
        <td>${escHtml(c.contact_phone) || '<span class="text-muted">-</span>'}</td>
        <td>${escHtml(c.contact_email) || '<span class="text-muted">-</span>'}</td>
        <td>${isAdmin ? hiddenBadge : ''}</td>
        <td>
          <div class="td-actions">
            <a href="detail.html?id=${c.id}" class="btn btn-sm btn-ghost">상세</a>
            <a href="form.html?id=${c.id}" class="btn btn-sm btn-secondary">수정</a>
            ${hideBtn}
          </div>
        </td>
      </tr>`;
  }).join('');

  area.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>회사명</th>
            <th>담당자</th>
            <th>전화번호</th>
            <th>이메일</th>
            ${isAdmin ? '<th>상태</th>' : '<th></th>'}
            <th>관리</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function setupSearch() {
  document.getElementById('search-input').addEventListener('input', function () {
    const q = this.value.trim().toLowerCase();
    if (!q) { renderTable(allCustomers); return; }
    const filtered = allCustomers.filter(c =>
      c.company_name.toLowerCase().includes(q) ||
      (c.contact_name || '').toLowerCase().includes(q) ||
      (c.contact_phone || '').toLowerCase().includes(q)
    );
    renderTable(filtered);
  });
}

function openHideModal(id, currentHidden, name) {
  pendingHide = { id, targetState: !currentHidden };
  const isHiding = !currentHidden;
  document.getElementById('modal-msg').textContent =
    `"${name}" 고객을 ${isHiding ? '숨김' : '표시'} 처리하시겠습니까?`;
  document.getElementById('modal-confirm').textContent = isHiding ? '숨김' : '표시';
  document.getElementById('modal-confirm').className =
    `btn ${isHiding ? 'btn-danger' : 'btn-success'}`;
  document.getElementById('hide-modal').classList.add('active');
}

function setupModal() {
  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('hide-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('modal-confirm').onclick = async () => {
    if (!pendingHide) return;
    const { id, targetState } = pendingHide;
    closeModal();

    const res = await API.put('/customer/hide.php', { id, is_hidden: targetState });
    if (res.success) {
      await loadCustomers(); // 목록 새로고침
    } else {
      alert(res.message || '처리에 실패했습니다.');
    }
  };
}

function closeModal() {
  document.getElementById('hide-modal').classList.remove('active');
  pendingHide = null;
}
