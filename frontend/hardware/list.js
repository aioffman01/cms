/**
 * list.js — [관리자] 하드웨어 관리 목록 페이지
 */

let allHardware = [];

(async () => {
  const user = await initLayout('hardware-list');
  if (!user) return;
  if (user.role !== 'admin') {
    document.getElementById('table-area').innerHTML =
      `<div class="alert alert-error" style="margin:20px"><span>✕</span><span>관리자만 접근 가능합니다.</span></div>`;
    return;
  }
  await loadList();
  setupSearch();
})();

async function loadList() {
  const res = await API.get('/hardware/list.php');
  if (!res.success) {
    document.getElementById('table-area').innerHTML =
      `<div class="alert alert-error" style="margin:16px"><span>✕</span><span>${res.message}</span></div>`;
    return;
  }
  allHardware = res.data || [];
  renderTable(allHardware);
}

function renderTable(list) {
  const area = document.getElementById('table-area');
  if (list.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">◻</span>
        <div class="empty-state-text">등록된 하드웨어가 없습니다.</div>
        <a href="form.html" class="btn btn-primary">+ 하드웨어 등록</a>
      </div>`;
    return;
  }

  const rows = list.map(h => `
    <tr class="${h.is_active ? '' : 'row-hidden'}">
      <td class="text-muted text-sm">${h.id}</td>
      <td class="font-bold">${escHtml(h.model_name)}</td>
      <td class="text-center">${h.cpu_count}</td>
      <td class="text-center">${parseFloat(h.disk_tb).toFixed(1)} TB</td>
      <td class="text-center">${h.nic_count}</td>
      <td>${escHtml(h.note) || '<span class="text-muted">-</span>'}</td>
      <td>
        <span class="badge ${h.is_active ? 'badge-visible' : 'badge-hidden'}">
          ${h.is_active ? '활성' : '비활성'}
        </span>
      </td>
      <td>
        <div class="td-actions">
          <a href="form.html?id=${h.id}" class="btn btn-sm btn-secondary">수정</a>
          <button class="btn btn-sm ${h.is_active ? 'btn-danger' : 'btn-success'}"
                  onclick="toggleActive(${h.id}, ${h.is_active})">
            ${h.is_active ? '비활성' : '활성'}
          </button>
        </div>
      </td>
    </tr>`).join('');

  area.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th><th>모델명</th><th style="text-align:center">CPU</th>
            <th style="text-align:center">DISK</th><th style="text-align:center">NIC</th>
            <th>비고</th><th>상태</th><th>관리</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

async function toggleActive(id, current) {
  const res = await API.put('/hardware/toggle.php', { id });
  if (res.success) {
    showAlert(document.getElementById('msg-area'), res.message, 'success');
    await loadList();
  } else {
    showAlert(document.getElementById('msg-area'), res.message, 'error');
  }
}

function setupSearch() {
  document.getElementById('search-input').addEventListener('input', function () {
    const q = this.value.trim().toLowerCase();
    renderTable(q ? allHardware.filter(h => h.model_name.toLowerCase().includes(q)) : allHardware);
  });
}
