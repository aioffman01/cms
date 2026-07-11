let currentUser = null;
let inspectionId = null;
let inspectionData = null;
let members = [];
let selectedMemberIds = [];

(async () => {
  currentUser = await initLayout('inspection-list'); // Keep side menu highlight active
  if (!currentUser) return;

  const urlParams = new URLSearchParams(window.location.search);
  inspectionId = parseInt(urlParams.get('id'));

  if (!inspectionId) {
    showAlert(document.getElementById('msg-area'), '잘못된 접근입니다. 점검 ID가 누락되었습니다.', 'error');
    document.getElementById('detail-loading').style.display = 'none';
    return;
  }

  await Promise.all([
    loadCustomers(),
    loadMembers(),
    loadInspectionDetail()
  ]);

  setupEvents();
  setupDateToggleEvents();
})();

async function loadCustomers() {
  const res = await API.get('/customer/list.php');
  if (res.success) {
    const sel = document.getElementById('customer-id');
    (res.data || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.company_name;
      sel.appendChild(opt);
    });
  }
}

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

async function loadInspectionDetail() {
  const res = await API.get('/inspection/get.php', { id: inspectionId });
  document.getElementById('detail-loading').style.display = 'none';

  if (!res.success) {
    showAlert(document.getElementById('msg-area'), res.message || '점검 정보를 불러올 수 없습니다.', 'error');
    return;
  }

  inspectionData = res.data;
  renderDetail();
}

function renderDetail() {
  const d = inspectionData;
  document.getElementById('detail-card').style.display = 'block';

  // 제목 및 일반 값 매핑
  document.getElementById('val-title').textContent = d.title || '정기 시스템 점검';
  document.getElementById('val-customer').textContent = d.customer_company || '-';
  
  // 진행 상태 뱃지
  const statusBadge = d.status === 'completed' 
    ? `<span class="badge badge-completed">점검완료</span>`
    : `<span class="badge badge-scheduled">점검예정</span>`;
  document.getElementById('val-status').innerHTML = statusBadge;

  // 예정일 렌더링
  const plannedDateStr = d.planned_start_date === d.planned_end_date
    ? d.planned_start_date
    : `${d.planned_start_date} ~ ${d.planned_end_date}`;
  document.getElementById('val-planned-date').textContent = plannedDateStr;

  // 실제 점검 완료일
  if (d.actual_start_date) {
    const actualDateStr = d.actual_start_date === d.actual_end_date
      ? d.actual_start_date
      : `${d.actual_start_date} ~ ${d.actual_end_date}`;
    document.getElementById('val-actual-date').textContent = actualDateStr;
  } else {
    document.getElementById('val-actual-date').textContent = '-';
  }

  // 담당자 뱃지
  const assigneesContainer = document.getElementById('val-assignees');
  assigneesContainer.innerHTML = '';
  if (d.members && d.members.length > 0) {
    d.members.forEach(m => {
      const badge = document.createElement('span');
      badge.className = 'member-badge';
      badge.textContent = `${m.name} (${m.role === 'admin' ? '관리자' : '작업자'})`;
      assigneesContainer.appendChild(badge);
    });
  } else {
    assigneesContainer.innerHTML = '<span class="text-muted">-</span>';
  }

  // 계획 내용
  document.getElementById('val-plan-content').textContent = d.plan_content;

  // 결과 보고 및 이슈사항
  if (d.status === 'completed') {
    document.getElementById('group-report').style.display = 'flex';
    document.getElementById('val-report-content').textContent = d.report_content || '(내용 없음)';

    document.getElementById('group-issues').style.display = 'flex';
    document.getElementById('val-issues').textContent = d.issues || '(이슈사항 없음)';

    // 완료된 경우: 수정 가능(계획+결과 보고서 수정), 보고서 작성(신규 등록) 버튼만 숨김
    document.getElementById('btn-edit-inspection').style.display = 'inline-block';
    document.getElementById('btn-report-inspection').style.display = 'none';
    document.getElementById('btn-delete-inspection').style.display = 'inline-block';
  } else {
    document.getElementById('group-report').style.display = 'none';
    document.getElementById('group-issues').style.display = 'none';

    // 예정 상태인 경우 수정, 보고 작성, 삭제 모두 허용
    document.getElementById('btn-edit-inspection').style.display = 'inline-block';
    document.getElementById('btn-report-inspection').style.display = 'inline-block';
    document.getElementById('btn-delete-inspection').style.display = 'inline-block';
  }
}

function setEditMode(isEditing) {
  if (isEditing) {
    document.querySelectorAll('.view-mode').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.edit-mode').forEach(el => {
      if (el.id === 'plan-end-date-wrapper') {
        const isRange = document.querySelector('input[name="plan-date-type"]:checked').value === 'range';
        el.style.display = isRange ? 'block' : 'none';
      } else {
        el.style.display = '';
      }
    });

    // 헤더 버튼 전환
    document.getElementById('btn-edit-inspection').style.display = 'none';
    document.getElementById('btn-report-inspection').style.display = 'none';
    document.getElementById('btn-delete-inspection').style.display = 'none';
    document.getElementById('btn-back').style.display = 'none';
    
    document.getElementById('btn-cancel-edit').style.display = 'inline-block';
    document.getElementById('btn-save-edit').style.display = 'inline-block';
  } else {
    document.querySelectorAll('.view-mode').forEach(el => el.style.display = '');
    document.querySelectorAll('.edit-mode').forEach(el => el.style.display = 'none');

    // 헤더 버튼 원복
    document.getElementById('btn-edit-inspection').style.display = 'inline-block';
    if (inspectionData.status === 'scheduled') {
      document.getElementById('btn-report-inspection').style.display = 'inline-block';
    }
    document.getElementById('btn-delete-inspection').style.display = 'inline-block';
    document.getElementById('btn-back').style.display = 'inline-block';
    
    document.getElementById('btn-cancel-edit').style.display = 'none';
    document.getElementById('btn-save-edit').style.display = 'none';
  }
}

function setupDateToggleEvents() {
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
}

function setupEvents() {
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

  // 점검 계획 수정 (인라인 화면 전환)
  document.getElementById('btn-edit-inspection').addEventListener('click', () => {
    const d = inspectionData;
    document.getElementById('edit-title').value = d.title || '';
    document.getElementById('planned-start-date').value = d.planned_start_date;
    
    if (d.planned_start_date !== d.planned_end_date) {
      document.querySelector('input[name="plan-date-type"][value="range"]').checked = true;
      document.getElementById('plan-end-date-wrapper').style.display = 'block';
      document.getElementById('planned-end-date').value = d.planned_end_date;
      document.getElementById('planned-end-date').required = true;
    } else {
      document.querySelector('input[name="plan-date-type"][value="single"]').checked = true;
      document.getElementById('plan-end-date-wrapper').style.display = 'none';
      document.getElementById('planned-end-date').value = '';
      document.getElementById('planned-end-date').required = false;
    }

    document.getElementById('plan-content').value = d.plan_content;
    selectedMemberIds = d.members.map(m => m.id);
    renderSelectedMembers();

    setEditMode(true);
  });

  // 수정 취소
  document.getElementById('btn-cancel-edit').addEventListener('click', () => {
    setEditMode(false);
  });

  // 수정 저장
  document.getElementById('btn-save-edit').addEventListener('click', async () => {
    const title = document.getElementById('edit-title').value.trim();
    const startDate = document.getElementById('planned-start-date').value;
    const isRange = document.querySelector('input[name="plan-date-type"]:checked').value === 'range';
    const endDate = isRange ? document.getElementById('planned-end-date').value : startDate;
    const planContent = document.getElementById('plan-content').value.trim();

    if (!title) { alert('점검 제목을 입력해주세요.'); return; }
    if (!startDate) { alert('점검 시작일을 선택해주세요.'); return; }
    if (isRange && !endDate) { alert('점검 종료일을 선택해주세요.'); return; }
    if (isRange && endDate < startDate) { alert('종료일은 시작일보다 빠를 수 없습니다.'); return; }
    if (selectedMemberIds.length === 0) { alert('담당 직원을 한 명 이상 지정해야 합니다.'); return; }
    if (!planContent) { alert('점검 계획 내용을 입력해주세요.'); return; }

    const payload = {
      id: inspectionId,
      customer_id: inspectionData.customer_id,
      title: title,
      planned_start_date: startDate,
      planned_end_date: endDate,
      plan_content: planContent,
      member_ids: selectedMemberIds,
      status: inspectionData.status
    };

    if (inspectionData.status === 'completed') {
      payload.report_content = inspectionData.report_content;
      payload.issues = inspectionData.issues;
      payload.actual_start_date = inspectionData.actual_start_date;
      payload.actual_end_date = inspectionData.actual_end_date;
    }

    const res = await API.put('/inspection/update.php', payload);
    if (res.success) {
      setEditMode(false);
      showAlert(document.getElementById('msg-area'), '점검 계획이 정상적으로 수정되었습니다.', 'success');
      await loadInspectionDetail();
    } else {
      alert(res.message || '수정 오류');
    }
  });

  // 점검 보고 모달 열기
  document.getElementById('btn-report-inspection').addEventListener('click', () => {
    document.getElementById('report-customer').value = inspectionData.customer_company;
    document.getElementById('report-content').value = '';
    document.getElementById('report-issues').value = '';
    document.getElementById('report-modal').classList.add('active');
  });

  // 점검 보고 모달 닫기
  document.getElementById('report-modal-cancel').addEventListener('click', () => {
    document.getElementById('report-modal').classList.remove('active');
  });

  // 점검 보고 서브밋
  document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const reportContent = document.getElementById('report-content').value.trim();
    const issues = document.getElementById('report-issues').value.trim();
    const todayStr = new Date().toISOString().substring(0, 10);

    if (!reportContent) { alert('점검결과 내용을 입력해주세요.'); return; }

    const payload = {
      id: inspectionId,
      customer_id: inspectionData.customer_id,
      title: inspectionData.title,
      planned_start_date: inspectionData.planned_start_date,
      planned_end_date: inspectionData.planned_end_date,
      plan_content: inspectionData.plan_content,
      actual_start_date: todayStr,
      actual_end_date: todayStr,
      report_content: reportContent,
      issues: issues,
      status: 'completed',
      member_ids: inspectionData.members.map(m => m.id)
    };

    const res = await API.put('/inspection/update.php', payload);
    if (res.success) {
      document.getElementById('report-modal').classList.remove('active');
      showAlert(document.getElementById('msg-area'), '점검 보고가 완료되어 완료 처리되었습니다.', 'success');
      await loadInspectionDetail();
    } else {
      alert(res.message || '오류 발생');
    }
  });

  // 삭제 기능
  document.getElementById('btn-delete-inspection').addEventListener('click', async () => {
    if (!confirm('정말로 이 점검 일정을 삭제하시겠습니까?\n삭제된 점검 결과 및 계획은 복구할 수 없습니다.')) return;

    const res = await API.delete('/inspection/delete.php', { id: inspectionId });
    if (res.success) {
      alert('점검 정보가 정상적으로 삭제되었습니다.');
      window.location.href = 'list.html';
    } else {
      alert(res.message || '삭제 오류');
    }
  });
}

function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
