let currentUser = null;
let inspectionId = null;
let inspectionData = null;
let members = [];
let selectedMemberIds = [];

(async () => {
  currentUser = await initLayout('inspection-list');
  if (!currentUser) return;

  const urlParams = new URLSearchParams(window.location.search);
  const idParam = urlParams.get('id');
  if (idParam) {
    inspectionId = parseInt(idParam);
  }

  await Promise.all([
    loadCustomers(),
    loadMembers()
  ]);

  if (inspectionId) {
    // 수정 모드
    document.getElementById('page-title-label').innerHTML = '점검 계획 <span>수정</span>';
    await loadInspectionData();
  } else {
    // 등록 모드
    document.getElementById('page-title-label').innerHTML = '점검 계획 <span>등록</span>';
    // 신규 등록 시에는 기본값으로 오늘 지정
    document.getElementById('planned-start-date').value = new Date().toISOString().substring(0, 10);
    renderSelectedMembers();
  }

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

async function loadInspectionData() {
  const res = await API.get('/inspection/get.php', { id: inspectionId });
  if (!res.success) {
    alert(res.message || '점검 데이터를 불러올 수 없습니다.');
    window.location.href = 'list.html';
    return;
  }

  inspectionData = res.data;
  const d = inspectionData;

  // 값 바인딩
  document.getElementById('customer-id').value = d.customer_id;
  document.getElementById('customer-id').disabled = true; // 수정 시 고객사 변경 차단
  document.getElementById('inspection-title').value = d.title || '';
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
  // 담당자 드롭다운 선택 리스너
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

  // 취소 버튼
  document.getElementById('btn-cancel').addEventListener('click', () => {
    if (inspectionId) {
      window.location.href = `detail.html?id=${inspectionId}`;
    } else {
      window.location.href = 'list.html';
    }
  });

  // 저장 완료 버튼
  document.getElementById('btn-submit').addEventListener('click', async () => {
    const form = document.getElementById('inspection-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const customerId = document.getElementById('customer-id').value;
    const title = document.getElementById('inspection-title').value.trim();
    const startDate = document.getElementById('planned-start-date').value;
    const isRange = document.querySelector('input[name="plan-date-type"]:checked').value === 'range';
    const endDate = isRange ? document.getElementById('planned-end-date').value : startDate;
    const planContent = document.getElementById('plan-content').value.trim();

    if (!customerId) { alert('대상 고객사를 선택해주세요.'); return; }
    if (!title) { alert('점검 제목을 입력해주세요.'); return; }
    if (!startDate) { alert('점검 시작일을 선택해주세요.'); return; }
    if (isRange && !endDate) { alert('점검 종료일을 선택해주세요.'); return; }
    if (isRange && endDate < startDate) { alert('종료일은 시작일보다 빠를 수 없습니다.'); return; }
    if (selectedMemberIds.length === 0) { alert('담당 직원을 한 명 이상 지정해야 합니다.'); return; }
    if (!planContent) { alert('점검 계획 내용을 입력해주세요.'); return; }

    const payload = {
      customer_id: parseInt(customerId),
      title: title,
      planned_start_date: startDate,
      planned_end_date: endDate,
      plan_content: planContent,
      member_ids: selectedMemberIds
    };

    let res;
    if (inspectionId) {
      // 수정 모드
      payload.id = inspectionId;
      payload.status = inspectionData.status;

      // 완료 상태 시 기존 결과 데이터 보존 전달
      if (inspectionData.status === 'completed') {
        payload.report_content = inspectionData.report_content;
        payload.issues = inspectionData.issues;
        payload.actual_start_date = inspectionData.actual_start_date;
        payload.actual_end_date = inspectionData.actual_end_date;
      }

      res = await API.put('/inspection/update.php', payload);
    } else {
      // 등록 모드
      res = await API.post('/inspection/create.php', payload);
    }

    if (res.success) {
      alert(inspectionId ? '점검 계획이 수정되었습니다.' : '점검 계획이 등록되었습니다.');
      const targetId = inspectionId || res.data;
      if (targetId) {
        window.location.href = `detail.html?id=${targetId}`;
      } else {
        window.location.href = 'list.html';
      }
    } else {
      alert(res.message || '저장 오류');
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
