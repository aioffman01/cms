/**
 * detail.js — 판매 제품 상세 보기 및 관리 스크립트
 */

const params    = new URLSearchParams(location.search);
const productId = params.get('id') ? parseInt(params.get('id')) : null;

let currentUser = null;
let productData = null;

(async () => {
  currentUser = await initLayout('customer-list');
  if (!currentUser) return;

  if (!productId) {
    document.getElementById('content-area').innerHTML =
      `<div class="alert alert-error"><span>✕</span><span>제품 ID가 누락되었습니다.</span></div>`;
    return;
  }

  await loadProductDetail();
})();

async function loadProductDetail() {
  const res = await API.get('/product/get.php', { id: productId });
  
  if (!res.success) {
    document.getElementById('content-area').innerHTML =
      `<div class="alert alert-error"><span>✕</span><span>${res.message || '제품 정보를 불러올 수 없습니다.'}</span></div>`;
    return;
  }

  productData = res.data;
  
  // 뒤로가기 버튼 링크 재설정
  const backUrl = `../customer/detail.html?id=${productData.customer_id}`;
  document.getElementById('btn-back').href = backUrl;

  renderProductDetail();
}

function renderProductDetail() {
  const p = productData;
  const isAdmin = currentUser.role === 'admin';

  const actionButtons = isAdmin ? `
    <div class="flex gap-2">
      <a href="upgrade.html?id=${p.id}" class="btn btn-primary" style="background: var(--accent); color: #000; border-color: var(--accent);">업그레이드</a>
      <a href="form.html?id=${p.id}&customer_id=${p.customer_id}" class="btn btn-secondary">수정</a>
      <button class="btn btn-danger" id="btn-delete-product">삭제</button>
    </div>
  ` : '';

  // 업그레이드 이력 HTML 렌더링
  let historyHtml = '';
  if (!p.history || p.history.length === 0) {
    historyHtml = `
      <div class="empty-state" style="padding: 24px;">
        <div class="empty-state-text" style="font-size: 13px;">변경/업그레이드 이력이 없습니다.</div>
      </div>
    `;
  } else {
    const historyRows = p.history.map(h => {
      let changes = [];
      if (h.old_version_name !== h.new_version_name) {
        const oldLabel = h.old_version_name ? `${h.old_version_name} (${h.old_version_code || '-'})` : '(미지정)';
        const newLabel = h.new_version_name ? `${h.new_version_name} (${h.new_version_code || '-'})` : '(미지정)';
        changes.push(`<div style="margin-bottom: 4px;"><span class="badge" style="background: rgba(20, 184, 166, 0.15); color: var(--accent); border: 1px solid rgba(20, 184, 166, 0.3); font-size: 10px; padding: 2px 6px;">버전</span> ${escHtml(oldLabel)} ➔ <strong class="text-highlight">${escHtml(newLabel)}</strong></div>`);
      }
      if (h.old_os_name !== h.new_os_name) {
        const oldLabel = h.old_os_name ? `${h.old_os_name} (${h.old_os_code || '-'})` : '(미지정)';
        const newLabel = h.new_os_name ? `${h.new_os_name} (${h.new_os_code || '-'})` : '(미지정)';
        changes.push(`<div><span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 10px; padding: 2px 6px;">OS</span> ${escHtml(oldLabel)} ➔ <strong class="text-highlight">${escHtml(newLabel)}</strong></div>`);
      }
      
      const notesHtml = h.notes 
        ? `<div style="margin-top: 6px; font-size: 12px; color: var(--text-muted); background: rgba(0,0,0,0.15); padding: 6px 10px; border-left: 2.5px solid var(--accent); border-radius: 2px; white-space: pre-wrap; word-break: break-all;">
             <strong>참고사항:</strong> ${escHtml(h.notes)}
           </div>`
        : '';

      return `
        <div style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px;">
          <div class="flex justify-between" style="color: var(--text-muted); font-size: 11px; margin-bottom: 6px;">
            <div>변경일: ${h.created_at}</div>
            <div>작업자: ${escHtml(h.created_by_name || '-')}</div>
          </div>
          <div>${changes.join('')}</div>
          ${notesHtml}
        </div>
      `;
    }).join('');
    
    historyHtml = `
      <div style="max-height: 300px; overflow-y: auto;">
        ${historyRows}
      </div>
    `;
  }

  document.getElementById('content-area').innerHTML = `
    <div class="card" style="max-width: 650px; margin: 0 auto;">
      <div class="card-header" style="justify-content: space-between; align-items: center;">
        <div class="card-title">제품 상세 정보</div>
        ${actionButtons}
      </div>
      <div class="card-body">
        <div class="detail-grid-vertical" style="gap: 16px;">
          
          <div class="detail-item">
            <div class="detail-label" style="font-size: 12px; color: var(--text-muted);">대상 고객사</div>
            <div class="detail-value" style="font-size: 15px; font-weight: 700;">
              <a href="../customer/detail.html?id=${p.customer_id}" class="text-highlight" style="text-decoration: underline;">
                ${escHtml(p.customer_company || '알 수 없음')}
              </a>
            </div>
          </div>

          <div class="detail-item">
            <div class="detail-label" style="font-size: 12px; color: var(--text-muted);">제품 이름</div>
            <div class="detail-value" style="font-size: 16px; font-weight: 700; color: var(--text);">${escHtml(p.name)}</div>
          </div>

          <div class="detail-item">
            <div class="detail-label" style="font-size: 12px; color: var(--text-muted);">제품 모델명</div>
            <div class="detail-value" style="font-size: 16px; font-weight: 700; color: var(--accent);">${escHtml(p.model_name)}</div>
          </div>

          <div class="detail-item">
            <div class="detail-label" style="font-size: 12px; color: var(--text-muted);">제품 버전</div>
            <div class="detail-value">${escHtml(p.version) || '<span class="text-muted">(미지정)</span>'}</div>
          </div>

          <div class="detail-item">
            <div class="detail-label" style="font-size: 12px; color: var(--text-muted);">설치 OS</div>
            <div class="detail-value">${escHtml(p.os_type) || '<span class="text-muted">(미지정)</span>'}</div>
          </div>

          <div class="detail-item">
            <div class="detail-label" style="font-size: 12px; color: var(--text-muted);">설치일</div>
            <div class="detail-value">${p.installed_at || '<span class="text-muted">(미기입)</span>'}</div>
          </div>

          <div class="detail-item" style="border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 16px;">
            <div class="detail-label" style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">기타 사항</div>
            <div class="detail-value ${!p.description ? 'muted' : ''}" style="white-space: pre-wrap; word-break: break-all; line-height: 1.5; font-size: 13.5px; background: rgba(0,0,0,0.15); padding: 10px 14px; border-radius: 4px;">
              ${escHtml(p.description) || '기타 입력된 특이사항이 없습니다.'}
            </div>
          </div>

          <div class="detail-item" style="border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
            <div>등록자: ${escHtml(p.created_by_name || '시스템')}</div>
            <div>등록일: ${p.created_at || '-'}</div>
          </div>

        </div>
      </div>
    </div>

    <div class="card" style="max-width: 650px; margin: 20px auto 0 auto;">
      <div class="card-header">
        <div class="card-title">제품 변경 및 업그레이드 이력</div>
      </div>
      <div class="card-body" style="padding: 0;">
        ${historyHtml}
      </div>
    </div>
  `;

  if (isAdmin) {
    document.getElementById('btn-delete-product').addEventListener('click', deleteProduct);
  }
}

async function deleteProduct() {
  if (!confirm(`정말로 이 제품 정보(${productData.model_name})를 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;

  const res = await API.delete('/product/delete.php', { id: productId });
  if (res.success) {
    alert('제품 정보가 정상적으로 삭제되었습니다.');
    window.location.href = `../customer/detail.html?id=${productData.customer_id}`;
  } else {
    alert(res.message || '제품 삭제 중 오류가 발생했습니다.');
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
