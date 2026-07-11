/**
 * calendar.js — 점검 캘린더 관리 스크립트
 */

let currentUser = null;
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth(); // 0-indexed
let allInspections = [];
let selectedInspectionId = null;

(async () => {
  currentUser = await initLayout('inspection-calendar');
  if (!currentUser) return;

  await loadInspections();
  setupEvents();
  setupDateToggleEvents();
  renderCalendar();
})();

async function loadInspections() {
  const isMyWork = document.getElementById('filter-my-work').checked;
  const params = {};
  if (isMyWork) params.member_id = currentUser.id;

  const res = await API.get('/inspection/list.php', params);
  if (res.success) {
    allInspections = res.data || [];
  }
}

function setupDateToggleEvents() {
  // 실제 점검일 라디오 변경 이벤트
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
  document.getElementById('btn-prev-month').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  document.getElementById('btn-next-month').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  document.getElementById('btn-today').addEventListener('click', () => {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    renderCalendar();
  });

  document.getElementById('filter-my-work').addEventListener('change', async () => {
    await loadInspections();
    renderCalendar();
  });

  // 모달 닫기
  document.getElementById('report-modal-cancel').addEventListener('click', () => {
    document.getElementById('report-modal').classList.remove('active');
  });

  // 보고서 등록 완료
  document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const actualStart = document.getElementById('actual-start-date').value;
    const isRange = document.querySelector('input[name="actual-date-type"]:checked').value === 'range';
    const actualEnd = isRange ? document.getElementById('actual-end-date').value : actualStart;
    const reportContent = document.getElementById('report-content').value.trim();

    if (!actualStart) { alert('실제 점검 시작일을 선택해주세요.'); return; }
    if (isRange && !actualEnd) { alert('실제 점검 종료일을 선택해주세요.'); return; }
    if (isRange && actualEnd < actualStart) { alert('종료일은 시작일보다 빠를 수 없습니다.'); return; }
    if (!reportContent) { alert('점검 결과 내용을 입력해주세요.'); return; }

    const res = await API.get('/inspection/get.php', { id: selectedInspectionId });
    if (!res.success) { alert('점검 정보를 찾을 수 없습니다.'); return; }
    const current = res.data;

    const payload = {
      id: selectedInspectionId,
      planned_start_date: current.planned_start_date,
      planned_end_date: current.planned_end_date,
      plan_content: current.plan_content,
      actual_start_date: actualStart,
      actual_end_date: actualEnd,
      report_content: reportContent,
      status: 'completed',
      member_ids: current.members.map(m => m.id)
    };

    const updateRes = await API.put('/inspection/update.php', payload);
    if (updateRes.success) {
      document.getElementById('report-modal').classList.remove('active');
      showAlert(document.getElementById('msg-area'), '점검 결과 보고서가 완료되었습니다.', 'success');
      await loadInspections();
      renderCalendar();
    } else {
      alert(updateRes.message || '오류 발생');
    }
  });

  // 점검 일정 삭제 (캘린더에서도 직접 삭제 지원)
  document.getElementById('report-modal-delete').addEventListener('click', async () => {
    if (!confirm('정말로 이 점검 일정을 삭제하시겠습니까?\n삭제된 점검 결과 및 계획은 복구할 수 없습니다.')) return;

    const res = await API.delete('/inspection/delete.php', { id: selectedInspectionId });
    if (res.success) {
      document.getElementById('report-modal').classList.remove('active');
      showAlert(document.getElementById('msg-area'), '점검이 삭제되었습니다.', 'success');
      await loadInspections();
      renderCalendar();
    } else {
      alert(res.message || '삭제 오류');
    }
  });
}

function renderCalendar() {
  document.getElementById('calendar-month-year').textContent = `${currentYear}년 ${currentMonth + 1}월`;

  const grid = document.getElementById('calendar-grid-board');
  grid.innerHTML = '';

  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  daysOfWeek.forEach(d => {
    const dh = document.createElement('div');
    dh.className = 'calendar-day-header';
    dh.textContent = d;
    grid.appendChild(dh);
  });

  const firstDay = new Date(currentYear, currentMonth, 1);
  const startingDay = firstDay.getDay();
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = lastDay.getDate();

  const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
  const totalCells = startingDay + totalDays > 35 ? 42 : 35;

  const today = new Date();

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';

    let dayNumber;
    let cellYear = currentYear;
    let cellMonth = currentMonth;

    if (i < startingDay) {
      cell.classList.add('other-month');
      dayNumber = prevLastDay - startingDay + i + 1;
      cellMonth--;
      if (cellMonth < 0) {
        cellMonth = 11;
        cellYear--;
      }
    } else if (i >= startingDay + totalDays) {
      cell.classList.add('other-month');
      dayNumber = i - startingDay - totalDays + 1;
      cellMonth++;
      if (cellMonth > 11) {
        cellMonth = 0;
        cellYear++;
      }
    } else {
      dayNumber = i - startingDay + 1;
      if (today.getFullYear() === cellYear && today.getMonth() === cellMonth && today.getDate() === dayNumber) {
        cell.classList.add('today');
      }
    }

    const numLabel = document.createElement('div');
    numLabel.className = 'day-number-label';
    numLabel.textContent = dayNumber;
    cell.appendChild(numLabel);

    const formattedDate = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

    // 시작일과 종료일 범위 안에 날짜가 걸쳐 있는지 검증하여 캘린더에 표시
    const dayInspections = allInspections.filter(ins => {
      const start = ins.planned_start_date;
      const end = ins.planned_end_date || start;
      return formattedDate >= start && formattedDate <= end;
    });

    dayInspections.forEach(ins => {
      const itemEl = document.createElement('div');
      itemEl.className = `calendar-item ${ins.status}`;
      
      const memberNames = (ins.members || []).map(m => m.name).join(',');
      itemEl.textContent = `${ins.customer_company} / ${memberNames}`;
      itemEl.title = `[${ins.status === 'completed' ? '완료' : '예정'}] ${ins.customer_company} - 계획: ${ins.plan_content}`;

      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        openReportModal(ins.id);
      });

      cell.appendChild(itemEl);
    });

    grid.appendChild(cell);
  }
}

async function openReportModal(id) {
  selectedInspectionId = id;
  const res = await API.get('/inspection/get.php', { id });
  if (!res.success) { alert(res.message); return; }

  const data = res.data;
  document.getElementById('report-customer').value = data.customer_company;
  
  const memberNames = (data.members || []).map(m => m.name).join(', ');
  document.getElementById('report-members').value = memberNames;
  
  document.getElementById('report-plan-content').value = data.plan_content;

  const actualStartEl = document.getElementById('actual-start-date');
  const actualEndEl = document.getElementById('actual-end-date');
  const submitBtn = document.getElementById('report-modal-submit');
  const deleteBtn = document.getElementById('report-modal-delete');
  const actualEndWrapper = document.getElementById('actual-end-date-wrapper');

  if (data.status === 'completed') {
    // 이미 완료된 경우 읽기 전용
    actualStartEl.value = data.actual_start_date;
    if (data.actual_start_date !== data.actual_end_date) {
      document.querySelector('input[name="actual-date-type"][value="range"]').checked = true;
      actualEndWrapper.style.display = 'block';
      actualEndEl.value = data.actual_end_date;
    } else {
      document.querySelector('input[name="actual-date-type"][value="single"]').checked = true;
      actualEndWrapper.style.display = 'none';
      actualEndEl.value = '';
    }

    document.querySelectorAll('input[name="actual-date-type"]').forEach(r => r.disabled = true);
    actualStartEl.disabled = true;
    actualEndEl.disabled = true;
    document.getElementById('report-content').value = data.report_content;
    document.getElementById('report-content').disabled = true;
    submitBtn.style.display = 'none';
    deleteBtn.style.display = 'inline-block';
    document.getElementById('report-modal-title').textContent = '점검 결과 보고서 조회';
  } else {
    // 예정 상태인 경우 작성 가능
    document.querySelector('input[name="actual-date-type"][value="single"]').checked = true;
    actualEndWrapper.style.display = 'none';
    actualStartEl.value = new Date().toISOString().substring(0, 10);
    actualEndEl.value = '';
    
    document.querySelectorAll('input[name="actual-date-type"]').forEach(r => r.disabled = false);
    actualStartEl.disabled = false;
    actualEndEl.disabled = false;
    document.getElementById('report-content').value = '';
    document.getElementById('report-content').disabled = false;
    submitBtn.style.display = 'inline-block';
    deleteBtn.style.display = 'inline-block';
    document.getElementById('report-modal-title').textContent = '점검 결과 보고서 작성';
  }

  document.getElementById('report-modal').classList.add('active');
}
