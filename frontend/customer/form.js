/**
 * form.js — 고객 등록/수정 페이지
 * URL 파라미터 ?id=N 이 있으면 수정 모드
 */

const params     = new URLSearchParams(location.search);
const customerId = params.get('id') ? parseInt(params.get('id')) : null;
const isEdit     = customerId !== null;

const msgArea  = document.getElementById('msg-area');
const form     = document.getElementById('customer-form');
const btnSubmit = document.getElementById('btn-submit');

(async () => {
  await initLayout(isEdit ? 'customer-list' : 'customer-create');

  if (isEdit) {
    document.getElementById('page-title').innerHTML = '고객 <span>수정</span>';
    document.getElementById('card-title').textContent = '고객 정보 수정';
    btnSubmit.textContent = '수정 저장';
    await loadCustomer();
  }
})();

async function loadCustomer() {
  const res = await API.get('/customer/get.php', { id: customerId });

  if (!res.success) {
    showAlert(msgArea, res.message || '고객 정보를 불러올 수 없습니다.', 'error');
    return;
  }

  const c = res.data;
  document.getElementById('company-name').value  = c.company_name  || '';
  document.getElementById('company-addr').value  = c.company_addr  || '';
  document.getElementById('contact-name').value  = c.contact_name  || '';
  document.getElementById('contact-phone').value = c.contact_phone || '';
  document.getElementById('contact-email').value = c.contact_email || '';
  document.getElementById('description').value   = c.description   || '';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const companyName = document.getElementById('company-name').value.trim();
  if (!companyName) {
    showAlert(msgArea, '회사명은 필수 항목입니다.', 'error');
    document.getElementById('company-name').focus();
    return;
  }

  const payload = {
    company_name:  companyName,
    company_addr:  document.getElementById('company-addr').value.trim(),
    contact_name:  document.getElementById('contact-name').value.trim(),
    contact_phone: document.getElementById('contact-phone').value.trim(),
    contact_email: document.getElementById('contact-email').value.trim(),
    description:   document.getElementById('description').value.trim(),
  };

  setLoading(true);

  let res;
  if (isEdit) {
    res = await API.put('/customer/update.php', { id: customerId, ...payload });
  } else {
    res = await API.post('/customer/create.php', payload);
  }

  if (res.success) {
    showAlert(msgArea, res.message || '저장되었습니다.', 'success');
    setTimeout(() => {
      window.location.href = isEdit
        ? `detail.html?id=${customerId}`
        : 'list.html';
    }, 800);
  } else {
    showAlert(msgArea, res.message || '저장에 실패했습니다.', 'error');
    setLoading(false);
  }
});

function setLoading(on) {
  btnSubmit.disabled     = on;
  btnSubmit.textContent  = on ? '저장 중...' : (isEdit ? '수정 저장' : '저장');
}
