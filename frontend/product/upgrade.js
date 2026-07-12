/**
 * upgrade.js — [관리자] 판매 제품 버전 및 OS 업그레이드 전용 스크립트
 */

const params    = new URLSearchParams(location.search);
const productId = params.get('id') ? parseInt(params.get('id')) : null;

const msgArea  = document.getElementById('msg-area');
const form     = document.getElementById('upgrade-form');
const btnSubmit = document.getElementById('btn-submit');

// 뒤로가기 링크 설정
if (productId) {
  const backUrl = `detail.html?id=${productId}`;
  document.getElementById('btn-back').href   = backUrl;
  document.getElementById('cancel-btn').href = backUrl;
}

(async () => {
  const user = await initLayout('customer-list');
  if (!user) return;
  if (user.role !== 'admin') {
    showAlert(msgArea, '관리자만 업그레이드 권한을 가집니다.', 'error'); return;
  }

  if (!productId) {
    showAlert(msgArea, '제품 ID가 유효하지 않습니다.', 'error'); return;
  }

  // 대항목 세부 목록들 로드 (MAGUX_VER, OS)
  await Promise.all([
    loadMngOptions('MAGUX_VER', 'license'),
    loadMngOptions('OS', 'os-type')
  ]);

  await loadProductForUpgrade();
})();

async function loadMngOptions(categoryCode, selectId) {
  const res = await API.get('/mng_item/list.php', { category_code: categoryCode, is_use: 'Y' });
  if (!res.success) return;
  const sel = document.getElementById(selectId);
  (res.data || []).forEach(item => {
    const opt = document.createElement('option');
    opt.value       = item.name;
    opt.textContent = `${item.name} (${item.code})`;
    sel.appendChild(opt);
  });
}

let originalVer = '';
let originalOs  = '';

async function loadProductForUpgrade() {
  const res = await API.get('/product/get.php', { id: productId });
  if (!res.success) { showAlert(msgArea, res.message, 'error'); return; }
  
  const p = res.data;
  document.getElementById('product-name').value = p.name || '';
  document.getElementById('model-name').value   = p.model_name || '';
  
  originalVer = p.version || '';
  originalOs  = p.os_type || '';

  // 드롭다운에 현재 선택 값 매핑
  document.getElementById('license').value = originalVer;
  document.getElementById('os-type').value = originalOs;

  // 힌트 출력
  document.getElementById('current-version-hint').textContent = `현재 버전: ${originalVer || '(미지정)'}`;
  document.getElementById('current-os-hint').textContent      = `현재 OS: ${originalOs || '(미지정)'}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newVer = document.getElementById('license').value.trim();
  const newOs  = document.getElementById('os-type').value.trim();
  const notes  = document.getElementById('notes').value.trim();

  if (!newVer) { showAlert(msgArea, '제품 버전 선택은 필수입니다.', 'error'); return; }
  if (!newOs) { showAlert(msgArea, '설치 OS 선택은 필수입니다.', 'error'); return; }

  if (newVer === originalVer && newOs === originalOs) {
    showAlert(msgArea, '변경할 버전이나 OS 정보가 기존 정보와 동일합니다.', 'error');
    return;
  }

  setLoading(true);

  const res = await API.put('/product/upgrade.php', {
    id: productId,
    version: newVer,
    os_type: newOs,
    notes: notes
  });

  if (res.success) {
    showAlert(msgArea, res.message || '성공적으로 업그레이드 조치되었습니다.', 'success');
    setTimeout(() => {
      window.location.href = `detail.html?id=${productId}`;
    }, 700);
  } else {
    showAlert(msgArea, res.message || '업그레이드 처리 실패', 'error');
    setLoading(false);
  }
});

function setLoading(on) {
  btnSubmit.disabled    = on;
  btnSubmit.textContent = on ? '처리 중...' : '업그레이드 실행';
}
