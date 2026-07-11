/**
 * list.js — 정기 점검 목록 관리 제어 스크립트
 */

let currentUser = null;
let customers = [];
let members = [];
let allInspections = [];
let editingInspectionId = null;
let reportingInspectionId = null;

(async () => {
  currentUser = await initLayout('inspection-list');
  if (!currentUser) return;

  await Promise.all([
    loadCustomers(),
    loadMembers(),
    loadInspections()
  ]);

  setupEvents();
  setupDateToggleEvents();
})();

async function loadCustomers() {
  const res = await API.get('/customer/list.php');
  if (res.success) {
    customers = res.data.customers || [];
    const sel = document.getElementById('customer-id');
    customers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.company_name;
      sel.appendChild(opt);
    });
  }
}

let selectedMemberIds = [];

async function loadMembers() {
  const res = await API.get('/member/list.php');
  if (res.success) {
    members = res.data || [];
    const staffMembers = members.filter(m => m.role === 'admin' || m.role === 'worker');
    
    const sel = document.getElementById('member-dropdown');
    sel.innerHTML = '<option value="">-- 담당자 선택 (관리자/작업자) --</option>';
    staffMembers.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.name} (${m.role === 'admin' ? '관리자' : '작업자'} - ${m.login_id})`;
      sel.appendChild(opt);
    });
  }
}

function renderSelectedMembers() {
  const container = document.getElementById('selected-members-list');
  container.innerHTML = '';
  
  if (selectedMemberIds.length === 0) {
    container.innerHTML = '<span class="text-muted text-xs">선택된 담당자가 없습니다.</span>';
    return;
  }
  
  selectedMemberIds.forEach(id => {
    const m = members.find(item => item.id === id);
    if (!m) return;
    
    const badge = document.createElement('span');
    badge.className = 'member-badge flex items-center gap-1';
    badge.style.padding = '4px 8px';
    badge.style.fontSize = '12px';
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.innerHTML = `
      <span>${escHtml(m.name)} (${m.role === 'admin' ? '관리자' : '작업자'})</span>
      <span style="cursor:pointer; font-weight:bold; margin-left:6px; color:#f87171;" onclick="removeSelectedMember(${m.id})">×</span>
    `;
    container.appendChild(badge);
  });
}

window.removeSelectedMember = function(id) {
  selectedMemberIds = selectedMemberIds.filter(mid => mid !== id);
  renderSelectedMembers();
};

async function loadInspections() {
  const isMyWork = document.getElementById('filter-my-work').checked;
  const status = document.getElementById('filter-status').value;

  const params = {};
  if (isMyWork) params.member_id = currentUser.id;
  if (status) params.status = status;

  const res = await API.get('/inspection/list.php', params);
  const area = document.getElementById('table-area');

  if (!res.success) {
    area.innerHTML = `<div class="alert alert-error" style="margin:16px"><span>✕</span><span>${res.message}</span></div>`;
    return;
  }

  allInspections = res.data || [];
  renderTable(allInspections);
}

function renderTable(inspections) {
  const area = document.getElementById('table-area');

  if (inspections.length === 0) {
    area.innerHTML = `
      <div class="empty-state" style="padding: 40px;">
        <span class="empty-state-icon">◻</span>
        <div class="empty-state-text">등록된 점검 내역이 없습니다.</div>
      </div>`;
    return;
  }

  const rows = inspections.map(i => {
    // 예정일 표시 (하루 vs 기간)
    const plannedDateStr = i.planned_start_date === i.planned_end_date
      ? i.planned_start_date
      : `${i.planned_start_date} ~ ${i.planned_end_date}`;

    // 실제 점검일 표시 (하루 vs 기간)
    let actualDateStr = '<span class="text-muted">-</span>';
    if (i.actual_start_date) {
      actualDateStr = i.actual_start_date === i.actual_end_date
        ? i.actual_start_date
        : `${i.actual_start_date} ~ ${i.actual_end_date}`;
    }
    
    // 담당 직원들 뱃지 렌더링
    const memberBadges = (i.members || []).map(m => `
      <span class="member-badge">${escHtml(m.name)}</span>
    `).join('');

    const statusBadge = `<span class="badge badge-${i.status}">${i.status === 'completed' ? '점검완료' : '점검예정'}</span>`;

    // 액션 버튼 구성
    let actionBtn = '';
    if (i.status === 'scheduled') {
      actionBtn = `
        <button class="btn btn-sm btn-success" onclick="openReportModal(${i.id}, '${escHtml(i.customer_company)}')">점검 보고</button>
        <button class="btn btn-sm btn-secondary" onclick="openEditModal(${i.id})">수정</button>
      `;
    } else {
      actionBtn = `
        <button class="btn btn-sm btn-ghost" onclick="openViewReportModal(${i.id})">보고서</button>
      `;
    }

    const deleteBtn = `<button class="btn btn-sm btn-danger" onclick="deleteInspection(${i.id})">삭제</button>`;

    return `
      <tr class="${i.status === 'completed' ? 'row-hidden' : ''}">
        <td><span class="font-bold">${escHtml(i.customer_company)}</span></td>
        <td>${statusBadge}</td>
        <td>${memberBadges}</td>
        <td>${plannedDateStr}</td>
        <td>${actualDateStr}</td>
        <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escHtml(i.plan_content)}">
          ${escHtml(i.plan_content)}
        </td>
        <td>
          <div class="td-actions">
            ${actionBtn}
            ${deleteBtn}
          </div>
        </td>
      </tr>`;
  }).join('');

  area.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>고객사</th>
            <th>상태</th>
            <th>점검 담당자</th>
            <th>점검 예정일</th>
            <th>실제 점검일</th>
            <th>점검 계획 내용</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function setupDateToggleEvents() {
  // 계획 모달 라디오 변경 이벤트
  const planRadios = document.querySelectorAll('input[name="plan-date-type"]');
  const planEndWrapper = document.getElementById('plan-end-date-wrapper');
  const planEndDateInput = document.getElementById('planned-end-date');

  planRadios.forEach(r => {
    r.addEventListener('change', (e) => {
      if (e.target.value === 'range') {
        planEndWrapper.style.display = 'block';
        planEndDateInput.required = true;
        if (!planEndDateInput.value) {
          planEndDateInput.value = document.getElementById('planned-start-date').value;
        }
      } else {
        planEndWrapper.style.display = 'none';
        planEndDateInput.required = false;
        planEndDateInput.value = '';
      }
    });
  });

  // 결과 보고서 모달 라디오 변경 이벤트
  const actualRadios = document.querySelectorAll('input[name="actual-date-type"]');
  const actualEndWrapper = document.getElementById('actual-end-date-wrapper');
  const actualEndDateInput = document.getElementById('actual-end-date');

  actualRadios.forEach(r => {
    r.addEventListener('change', (e) => {
      if (e.target.value === 'range') {
        actualEndWrapper.style.display = 'block';
        actualEndDateInput.required = true;
        if (!actualEndDateInput.value) {
          actualEndDateInput.value = document.getElementById('actual-start-date').value;
        }
      } else {
        actualEndWrapper.style.display = 'none';
        actualEndDateInput.required = false;
        actualEndDateInput.value = '';
      }
    });
  });
}

function setupEvents() {
  // 필터 바 리스너
  document.getElementById('filter-my-work').addEventListener('change', loadInspections);
  document.getElementById('filter-status').addEventListener('change', loadInspections);

  // 담당자 드롭다운 변경 리스너
  document.getElementById('member-dropdown').addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) return;
    const mid = parseInt(val);
    if (!selectedMemberIds.includes(mid)) {
      selectedMemberIds.push(mid);
      renderSelectedMembers();
    }
    e.target.value = '';
  });

  // 계획 등록 모달 열기
  document.getElementById('btn-add-inspection').addEventListener('click', () => {
    editingInspectionId = null;
    document.getElementById('modal-title').textContent = '점검 계획 등록';
    document.getElementById('modal-submit').textContent = '등록';
    document.getElementById('inspection-form').reset();
    document.getElementById('customer-id').disabled = false;
    
    // 라디오 및 종료일 필드 초기화
    document.querySelector('input[name="plan-date-type"][value="single"]').checked = true;
    document.getElementById('plan-end-date-wrapper').style.display = 'none';
    document.getElementById('planned-end-date').required = false;

    // 담당자 배열 리셋
    selectedMemberIds = [];
    renderSelectedMembers();

    document.getElementById('inspection-modal').classList.add('active');
  });

  // 모달 닫기
  document.getElementById('modal-cancel').addEventListener('click', () => {
    document.getElementById('inspection-modal').classList.remove('active');
  });
  document.getElementById('report-modal-cancel').addEventListener('click', () => {
    document.getElementById('report-modal').classList.remove('active');
  });

  // 계획 폼 서브밋
  document.getElementById('inspection-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const customerId = document.getElementById('customer-id').value;
    const startDate = document.getElementById('planned-start-date').value;
    const isRange = document.querySelector('input[name="plan-date-type"]:checked').value === 'range';
    const endDate = isRange ? document.getElementById('planned-end-date').value : startDate;
    const planContent = document.getElementById('plan-content').value.trim();

    if (!customerId) { alert('대상 고객사를 선택해주세요.'); return; }
    if (!startDate) { alert('점검 시작일을 선택해주세요.'); return; }
    if (isRange && !endDate) { alert('점검 종료일을 선택해주세요.'); return; }
    if (isRange && endDate < startDate) { alert('종료일은 시작일보다 빠를 수 없습니다.'); return; }
    if (selectedMemberIds.length === 0) { alert('담당 직원을 한 명 이상 지정해야 합니다.'); return; }
    if (!planContent) { alert('점검 계획 내용을 입력해주세요.'); return; }

    const payload = {
      customer_id: parseInt(customerId),
      planned_start_date: startDate,
      planned_end_date: endDate,
      plan_content: planContent,
      member_ids: selectedMemberIds
    };

    let res;
    if (editingInspectionId) {
      res = await API.put('/inspection/update.php', { id: editingInspectionId, ...payload });
    } else {
      res = await API.post('/inspection/create.php', payload);
    }

    if (res.success) {
      document.getElementById('inspection-modal').classList.remove('active');
      showAlert(document.getElementById('msg-area'), res.message, 'success');
      await loadInspections();
    } else {
      alert(res.message || '저장 오류');
    }
  });

  // 보고서 폼 서브밋
  document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const reportContent = document.getElementById('report-content').value.trim();
    const issues = document.getElementById('report-issues').value.trim();
    const todayStr = new Date().toISOString().substring(0, 10);

    if (!reportContent) { alert('점검결과 내용을 입력해주세요.'); return; }

    // 기존 데이터 읽어와서 합친 후 PUT 전송
    const getRes = await API.get('/inspection/get.php', { id: reportingInspectionId });
    if (!getRes.success) { alert('점검 정보를 찾을 수 없습니다.'); return; }
    const current = getRes.data;

    const payload = {
      id: reportingInspectionId,
      planned_start_date: current.planned_start_date,
      planned_end_date: current.planned_end_date,
      plan_content: current.plan_content,
      actual_start_date: todayStr,
      actual_end_date: todayStr,
      report_content: reportContent,
      issues: issues,
      status: 'completed',
      member_ids: current.members.map(m => m.id)
    };

    const res = await API.put('/inspection/update.php', payload);
    if (res.success) {
      document.getElementById('report-modal').classList.remove('active');
      showAlert(document.getElementById('msg-area'), '보고서가 완료되었으며 점검완료 상태로 변경되었습니다.', 'success');
      await loadInspections();
    } else {
      alert(res.message || '오류 발생');
    }
  });
}

// 점검 계획 수정 모달 열기
window.openEditModal = async function(id) {
  editingInspectionId = id;
  const res = await API.get('/inspection/get.php', { id });
  if (!res.success) { alert(res.message); return; }

  const data = res.data;
  document.getElementById('modal-title').textContent = '점검 계획 수정';
  document.getElementById('modal-submit').textContent = '계획 수정';
  document.getElementById('customer-id').value = data.customer_id;
  document.getElementById('customer-id').disabled = true; // 변경 불가
  
  // 시작/종료일 셋팅
  document.getElementById('planned-start-date').value = data.planned_start_date;
  if (data.planned_start_date !== data.planned_end_date) {
    document.querySelector('input[name="plan-date-type"][value="range"]').checked = true;
    document.getElementById('plan-end-date-wrapper').style.display = 'block';
    document.getElementById('planned-end-date').value = data.planned_end_date;
    document.getElementById('planned-end-date').required = true;
  } else {
    document.querySelector('input[name="plan-date-type"][value="single"]').checked = true;
    document.getElementById('plan-end-date-wrapper').style.display = 'none';
    document.getElementById('planned-end-date').value = '';
    document.getElementById('planned-end-date').required = false;
  }

  document.getElementById('plan-content').value = data.plan_content;

  // 담당 직원 리스트 동기화
  selectedMemberIds = data.members.map(m => m.id);
  renderSelectedMembers();

  document.getElementById('inspection-modal').classList.add('active');
};

// 점검 결과 모달 열기 (보고 등록)
window.openReportModal = function(id, companyName) {
  reportingInspectionId = id;
  document.getElementById('report-customer').value = companyName;
  document.getElementById('report-content').value = '';
  document.getElementById('report-issues').value = '';
  
  // 모달을 입력 가능하게 활성화
  document.getElementById('report-modal-submit').style.display = 'inline-block';
  document.getElementById('report-content').disabled = false;
  document.getElementById('report-issues').disabled = false;
  
  document.getElementById('report-modal-title').textContent = '점검 결과 보고서 작성';
  document.getElementById('report-modal').classList.add('active');
};

// 보고서 조회 모달 열기 (읽기 전용)
window.openViewReportModal = async function(id) {
  const res = await API.get('/inspection/get.php', { id });
  if (!res.success) { alert(res.message); return; }

  const data = res.data;
  document.getElementById('report-customer').value = data.customer_company;
  document.getElementById('report-content').value = data.report_content || '';
  document.getElementById('report-issues').value = data.issues || '';
  
  // 편집 불가능하게 막기
  document.getElementById('report-content').disabled = true;
  document.getElementById('report-issues').disabled = true;
  document.getElementById('report-modal-submit').style.display = 'none';

  document.getElementById('report-modal-title').textContent = '점검 결과 보고서 조회';
  document.getElementById('report-modal').classList.add('active');
};

// 점검 삭제
window.deleteInspection = async function(id) {
  if (!confirm('정말로 이 점검 일정을 삭제하시겠습니까?\n삭제된 점검 결과 및 계획은 복구할 수 없습니다.')) return;

  const res = await API.delete('/inspection/delete.php', { id });
  if (res.success) {
    showAlert(document.getElementById('msg-area'), '점검이 삭제되었습니다.', 'success');
    await loadInspections();
  } else {
    alert(res.message || '삭제 오류');
  }
};
