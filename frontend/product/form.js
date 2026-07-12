/**
 * form.js — [관리자] 판매 제품 등록/수정 페이지
 * URL 파라미터:
 *   ?customer_id=N         → 신규 등록
 *   ?id=N&customer_id=N   → 수정
 */

const params     = new URLSearchParams(location.search);
const productId  = params.get('id') ? parseInt(params.get('id')) : null;
const customerId = params.get('customer_id') ? parseInt(params.get('customer_id')) : null;
const isEdit     = productId !== null;

const msgArea  = document.getElementById('msg-area');
const form     = document.getElementById('product-form');
const btnSubmit = document.getElementById('btn-submit');

// 뒤로가기 링크를 고객 상세 페이지로 설정
if (customerId) {
  const backUrl = `../customer/detail.html?id=${customerId}`;
  document.getElementById('btn-back').href   = backUrl;
  document.getElementById('cancel-btn').href = backUrl;
}

(async () => {
  const user = await initLayout('customer-list');
  if (!user) return;
  if (user.role !== 'admin') {
    showAlert(msgArea, '관리자만 접근 가능합니다.', 'error'); return;
  }

  // 대항목 세부 목록들 로드 (HW, MAGUX_VER, OS)
  await Promise.all([
    loadMngOptions('HW', 'model-name'),
    loadMngOptions('MAGUX_VER', 'license'),
    loadMngOptions('OS', 'os-type')
  ]);

  if (isEdit) {
    document.getElementById('page-title').innerHTML = '판매 제품 <span>수정</span>';
    document.getElementById('card-title').textContent = '제품 정보 수정';
    btnSubmit.textContent = '수정 저장';
    await loadProduct();
  } else if (customerId) {
    // 고객 정보 표시
    showCustomerInfo(customerId);
  }
})();

async function loadMngOptions(categoryCode, selectId) {
  const res = await API.get('/mng_item/list.php', { category_code: categoryCode, is_use: 'Y' });
  if (!res.success) return;
  const sel = document.getElementById(selectId);
  (res.data || []).forEach(item => {
    const opt = document.createElement('option');
    opt.value       = item.name; // DB의 model_name, version, os_type 컬럼에 텍스트 저장
    opt.textContent = `${item.name} (${item.code})`;
    sel.appendChild(opt);
  });
}

async function loadProduct() {
  const res = await API.get('/product/get.php', { id: productId });
  if (!res.success) { showAlert(msgArea, res.message, 'error'); return; }
  const p = res.data;
  document.getElementById('product-name').value = p.name         || '';
  document.getElementById('model-name').value   = p.model_name   || '';
  document.getElementById('license').value      = p.version      || '';
  document.getElementById('os-type').value      = p.os_type      || '';
  document.getElementById('installed-at').value = p.installed_at || '';
  document.getElementById('description').value  = p.description  || '';

  // 고객 정보 표시
  if (p.customer_id) showCustomerInfo(p.customer_id);
}

async function showCustomerInfo(cid) {
  const res = await API.get('/customer/get.php', { id: cid });
  if (res.success) {
    const bar = document.getElementById('customer-info-bar');
    document.getElementById('customer-info-text').textContent =
      `대상 고객: ${res.data.company_name}`;
    bar.style.display = 'flex';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const productName = document.getElementById('product-name').value.trim();
  if (!productName) { showAlert(msgArea, '제품 이름은 필수 항목입니다.', 'error'); return; }

  const modelName = document.getElementById('model-name').value.trim();
  if (!modelName) { showAlert(msgArea, '제품 모델명은 필수 항목입니다.', 'error'); return; }

  const installedAt = document.getElementById('installed-at').value.trim();
  if (installedAt && !/^\d{4}-\d{2}-\d{2}$/.test(installedAt)) {
    showAlert(msgArea, '설치일 형식은 YYYY-MM-DD 이어야 합니다.', 'error');
    return;
  }

  const payload = {
    name:         productName,
    model_name:   modelName,
    version:      document.getElementById('license').value.trim(),
    os_type:      document.getElementById('os-type').value.trim(),
    installed_at: installedAt || null,
    description:  document.getElementById('description').value.trim(),
  };

  setLoading(true);

  let res;
  if (isEdit) {
    res = await API.put('/product/update.php', { id: productId, ...payload });
  } else {
    if (!customerId) { showAlert(msgArea, 'customer_id가 없습니다.', 'error'); setLoading(false); return; }
    res = await API.post('/product/create.php', { customer_id: customerId, ...payload });
  }

  if (res.success) {
    showAlert(msgArea, res.message, 'success');
    setTimeout(() => {
      const cid = customerId || (isEdit ? null : null);
      window.location.href = cid
        ? `../customer/detail.html?id=${cid}`
        : '../customer/list.html';
    }, 700);
  } else {
    showAlert(msgArea, res.message || '저장 실패', 'error');
    setLoading(false);
  }
});

function setLoading(on) {
  btnSubmit.disabled    = on;
  btnSubmit.textContent = on ? '저장 중...' : (isEdit ? '수정 저장' : '저장');
}
