/**
 * form.js — [관리자] 하드웨어 등록/수정 페이지
 */

const params = new URLSearchParams(location.search);
const hwId   = params.get('id') ? parseInt(params.get('id')) : null;
const isEdit = hwId !== null;

const msgArea  = document.getElementById('msg-area');
const form     = document.getElementById('hw-form');
const btnSubmit = document.getElementById('btn-submit');

(async () => {
  const user = await initLayout('hardware-list');
  if (!user) return;
  if (user.role !== 'admin') {
    showAlert(msgArea, '관리자만 접근 가능합니다.', 'error'); return;
  }

  if (isEdit) {
    document.getElementById('page-title').innerHTML = '하드웨어 <span>수정</span>';
    document.getElementById('card-title').textContent = '하드웨어 정보 수정';
    btnSubmit.textContent = '수정 저장';
    await loadHardware();
  }
})();

async function loadHardware() {
  const res = await API.get('/hardware/get.php', { id: hwId });
  if (!res.success) { showAlert(msgArea, res.message, 'error'); return; }
  const h = res.data;
  document.getElementById('model-name').value = h.model_name || '';
  document.getElementById('cpu-count').value  = h.cpu_count  || 0;
  document.getElementById('disk-tb').value    = h.disk_tb    || 0;
  document.getElementById('nic-count').value  = h.nic_count  || 0;
  document.getElementById('note').value       = h.note       || '';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const modelName = document.getElementById('model-name').value.trim();
  if (!modelName) { showAlert(msgArea, '모델명은 필수 항목입니다.', 'error'); return; }

  const payload = {
    model_name: modelName,
    cpu_count:  parseInt(document.getElementById('cpu-count').value) || 0,
    disk_tb:    parseFloat(document.getElementById('disk-tb').value) || 0,
    nic_count:  parseInt(document.getElementById('nic-count').value) || 0,
    note:       document.getElementById('note').value.trim(),
  };

  setLoading(true);
  const res = isEdit
    ? await API.put('/hardware/update.php', { id: hwId, ...payload })
    : await API.post('/hardware/create.php', payload);

  if (res.success) {
    showAlert(msgArea, res.message, 'success');
    setTimeout(() => { window.location.href = 'list.html'; }, 700);
  } else {
    showAlert(msgArea, res.message || '저장 실패', 'error');
    setLoading(false);
  }
});

function setLoading(on) {
  btnSubmit.disabled    = on;
  btnSubmit.textContent = on ? '저장 중...' : (isEdit ? '수정 저장' : '저장');
}
