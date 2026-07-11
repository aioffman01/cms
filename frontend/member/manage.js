/**
 * manage.js — [관리자] 회원 관리 페이지
 */

let currentUser  = null;
let allMembers   = [];
let pendingMember = null; // { id, name, currentRole }

(async () => {
  currentUser = await initLayout('member-manage');
  if (!currentUser) return;

  // 비관리자 접근 차단
  if (currentUser.role !== 'admin') {
    document.getElementById('table-area').innerHTML =
      `<div class="alert alert-error" style="margin:20px">
         <span>✕</span><span>관리자만 접근 가능한 페이지입니다.</span></div>`;
    return;
  }

  await loadMembers();
  setupSearch();
  setupModal();
})();

async function loadMembers() {
  const res = await API.get('/member/list.php');

  if (!res.success) {
    document.getElementById('table-area').innerHTML =
      `<div class="alert alert-error" style="margin:16px">
         <span>✕</span><span>${res.message}</span></div>`;
    return;
  }

  allMembers = res.data || [];
  renderTable(allMembers);
}

function renderTable(members) {
  const area = document.getElementById('table-area');

  if (members.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">◻</span>
        <div class="empty-state-text">회원이 없습니다.</div>
      </div>`;
    return;
  }

  const rows = members.map(m => {
    const isSelf = m.id === currentUser.id;
    const roleBtn = isSelf
      ? `<span class="text-muted text-xs">(본인)</span>`
      : `<button class="btn btn-sm btn-ghost"
               onclick="openRoleModal(${m.id}, '${escHtml(m.name)}', '${m.role}')">
           역할 변경
         </button>`;

    return `
      <tr>
        <td class="text-muted text-sm">${m.id}</td>
        <td>${escHtml(m.login_id)}</td>
        <td>${escHtml(m.name)} ${isSelf ? '<span class="text-accent text-xs">(나)</span>' : ''}</td>
        <td><span class="badge badge-${m.role}">${m.role === 'admin' ? '관리자' : (m.role === 'worker' ? '작업자' : '일반사용자')}</span></td>
        <td class="text-muted text-sm">${fmtDate(m.created_at)}</td>
        <td>${roleBtn}</td>
      </tr>`;
  }).join('');

  area.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>아이디</th>
            <th>이름</th>
            <th>역할</th>
            <th>가입일</th>
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
    if (!q) { renderTable(allMembers); return; }
    const filtered = allMembers.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.login_id.toLowerCase().includes(q)
    );
    renderTable(filtered);
  });
}

function openRoleModal(id, name, currentRole) {
  pendingMember = { id, name, currentRole };
  document.getElementById('role-modal-msg').textContent =
    `"${name}" 회원의 역할을 변경합니다.`;
  document.getElementById('role-select').value = currentRole;
  document.getElementById('role-modal').classList.add('active');
}

function setupModal() {
  document.getElementById('role-modal-cancel').onclick = closeModal;
  document.getElementById('role-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('role-modal-confirm').onclick = async () => {
    if (!pendingMember) return;
    const newRole = document.getElementById('role-select').value;
    closeModal();

    const res = await API.put('/member/set_role.php', {
      member_id: pendingMember.id,
      role: newRole,
    });

    if (res.success) {
      showAlert(document.getElementById('msg-area'), res.message, 'success');
      await loadMembers();
    } else {
      showAlert(document.getElementById('msg-area'), res.message || '변경에 실패했습니다.', 'error');
    }
    pendingMember = null;
  };
}

function closeModal() {
  document.getElementById('role-modal').classList.remove('active');
  pendingMember = null;
}
