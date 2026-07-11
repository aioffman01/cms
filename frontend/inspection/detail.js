let currentUser = null;
let inspectionId = null;
let inspectionData = null;
let members = [];
let selectedMemberIds = [];

(async () => {
  try {
    currentUser = await initLayout('inspection-list'); // Keep side menu highlight active
    if (!currentUser) return;

    const urlParams = new URLSearchParams(window.location.search);
    inspectionId = parseInt(urlParams.get('id'));

    if (!inspectionId) {
      showAlert(document.getElementById('msg-area'), '잘못된 접근입니다. 점검 ID가 누락되었습니다.', 'error');
      document.getElementById('detail-loading').style.display = 'none';
      return;
    }

    await loadInspectionDetail();
    setupEvents();
  } catch (err) {
    console.error('detail.js 실행 오류:', err);
    showDebugError(err);
  }
})();



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

function setupEvents() {
  // 점검 계획 수정 (수정 페이지로 이동)
  document.getElementById('btn-edit-inspection').addEventListener('click', () => {
    window.location.href = `form.html?id=${inspectionId}`;
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

function showDebugError(err) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.background = 'rgba(0,0,0,0.85)';
  container.style.zIndex = '99999';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.padding = '20px';

  const box = document.createElement('div');
  box.style.background = '#222';
  box.style.border = '1px solid #ff4444';
  box.style.borderRadius = '8px';
  box.style.padding = '24px';
  box.style.maxWidth = '600px';
  box.style.width = '100%';
  box.style.color = '#fff';

  const title = document.createElement('h3');
  title.textContent = '🚨 JS Runtime Error Detected';
  title.style.color = '#ff4444';
  title.style.marginBottom = '12px';
  box.appendChild(title);

  const desc = document.createElement('p');
  desc.textContent = err.message || err;
  desc.style.marginBottom = '12px';
  box.appendChild(desc);

  const textarea = document.createElement('textarea');
  textarea.value = err.stack || '';
  textarea.style.width = '100%';
  textarea.style.height = '200px';
  textarea.style.background = '#111';
  textarea.style.color = '#00ff00';
  textarea.style.border = '1px solid #444';
  textarea.style.padding = '10px';
  textarea.style.fontFamily = 'monospace';
  textarea.style.fontSize = '12px';
  textarea.style.marginBottom = '16px';
  textarea.readOnly = true;
  box.appendChild(textarea);

  const btnFlex = document.createElement('div');
  btnFlex.style.display = 'flex';
  btnFlex.style.gap = '12px';

  const copyBtn = document.createElement('button');
  copyBtn.textContent = '📋 Copy Error Stack';
  copyBtn.className = 'btn btn-primary';
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(textarea.value);
    copyBtn.textContent = '✅ Copied!';
    setTimeout(() => { copyBtn.textContent = '📋 Copy Error Stack'; }, 2000);
  };
  btnFlex.appendChild(copyBtn);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.className = 'btn btn-ghost';
  closeBtn.onclick = () => { container.remove(); };
  btnFlex.appendChild(closeBtn);

  box.appendChild(btnFlex);
  container.appendChild(box);
  document.body.appendChild(container);
}
