/**
 * detail.js — 고객 상세 보기 페이지 (제품 목록 포함)
 */

const params     = new URLSearchParams(location.search);
const customerId = params.get('id') ? parseInt(params.get('id')) : null;

let currentUser = null;

(async () => {
  currentUser = await initLayout('customer-list');
  if (!currentUser) return;

  if (!customerId) {
    document.getElementById('content-area').innerHTML =
      `<div class="alert alert-error"><span>✕</span><span>고객 ID가 없습니다.</span></div>`;
    return;
  }

  await loadCustomer();
})();

async function loadCustomer() {
  const res = await API.get('/customer/get.php', { id: customerId });

  if (!res.success) {
    document.getElementById('content-area').innerHTML =
      `<div class="alert alert-error"><span>✕</span><span>${res.message}</span></div>`;
    return;
  }

  // 고객 상세 데이터 & 제품 목록 로드 병렬 처리
  const prodRes = await API.get('/product/list.php', { customer_id: customerId });
  const products = prodRes.success ? (prodRes.data || []) : [];

  renderDetail(res.data, products);
}

function renderDetail(c, products) {
  const isAdmin  = currentUser.role === 'admin';
  const isHidden = !!c.is_hidden;

  const hiddenBadge = isAdmin && isHidden
    ? `<span class="badge badge-hidden" style="margin-left:10px">숨김</span>` : '';

  const adminActions = isAdmin ? `
    <button class="btn ${isHidden ? 'btn-success' : 'btn-danger'}"
            id="btn-toggle-hide">
      ${isHidden ? '고객 표시' : '고객 숨기기'}
    </button>` : '';

  // 제품 목록 HTML 구성
  let productSectionHtml = '';
  const prodAddBtn = isAdmin ? `<a href="../product/form.html?customer_id=${c.id}" class="btn btn-sm btn-primary">+ 제품 추가</a>` : '';

  if (products.length === 0) {
    productSectionHtml = `
      <div class="empty-state" style="padding: 24px;">
        <div class="empty-state-text" style="margin-bottom: 12px;">등록된 제품 정보가 없습니다.</div>
        ${prodAddBtn}
      </div>`;
  } else {
    const prodRows = products.map(p => {
      const deleteBtn = isAdmin ? `<button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">삭제</button>` : '';
      const editBtn = isAdmin ? `<a href="../product/form.html?id=${p.id}&customer_id=${c.id}" class="btn btn-sm btn-secondary">수정</a>` : '';
      
      let hwInfo = '<span class="text-muted">-</span>';
      if (p.hw_model) {
        hwInfo = `<span class="text-highlight">${escHtml(p.hw_model)}</span>`;
      }

      return `
        <tr>
          <td><span class="font-bold">${escHtml(p.model_name)}</span></td>
          <td>${escHtml(p.version) || '<span class="text-muted">-</span>'}</td>
          <td>${escHtml(p.os_type) || '<span class="text-muted">-</span>'}</td>
          <td>${hwInfo}</td>
          <td>${p.installed_at || '<span class="text-muted">-</span>'}</td>
          <td style="max-width: 220px; white-space: pre-wrap; word-break: break-all;">${escHtml(p.description) || '<span class="text-muted">-</span>'}</td>
          <td>
            <div class="td-actions">
              ${editBtn}
              ${deleteBtn}
            </div>
          </td>
        </tr>`;
    }).join('');

    productSectionHtml = `
      <div class="flex justify-between items-center mb-3">
        <div class="card-title" style="margin-bottom: 0;">설치 제품 목록</div>
        ${prodAddBtn}
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>제품 모델명</th>
              <th>제품 버전</th>
              <th>설치 OS</th>
              <th>연결 하드웨어</th>
              <th>설치일</th>
              <th>기타사항</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>${prodRows}</tbody>
        </table>
      </div>`;
  }

  document.getElementById('content-area').innerHTML = `
    <div class="detail-split-layout">
      <!-- 왼쪽 블록: 고객 기본 정보 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title flex items-center gap-2">
            고객 정보: ${escHtml(c.company_name)}${hiddenBadge}
          </div>
          <div class="flex gap-2">
            ${adminActions}
            <a href="form.html?id=${c.id}" class="btn btn-secondary">수정</a>
          </div>
        </div>
        <div class="card-body">
          <div class="detail-grid-vertical">
            <div class="detail-item">
              <div class="detail-label">회사명</div>
              <div class="detail-value">${escHtml(c.company_name)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">회사 주소</div>
              <div class="detail-value ${!c.company_addr ? 'muted' : ''}">
                ${escHtml(c.company_addr) || '(미입력)'}
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">담당자 이름</div>
              <div class="detail-value ${!c.contact_name ? 'muted' : ''}">
                ${escHtml(c.contact_name) || '(미입력)'}
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">담당자 전화번호</div>
              <div class="detail-value ${!c.contact_phone ? 'muted' : ''}">
                ${c.contact_phone
                  ? `<a href="tel:${escHtml(c.contact_phone)}" class="text-highlight">${escHtml(c.contact_phone)}</a>`
                  : '(미입력)'}
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">담당자 이메일</div>
              <div class="detail-value ${!c.contact_email ? 'muted' : ''}">
                ${c.contact_email
                  ? `<a href="mailto:${escHtml(c.contact_email)}" class="text-highlight">${escHtml(c.contact_email)}</a>`
                  : '(미입력)'}
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">등록자</div>
              <div class="detail-value">${escHtml(c.created_by_name || '-')}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">등록일</div>
              <div class="detail-value">${fmtDate(c.created_at)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">최종 수정일</div>
              <div class="detail-value">${fmtDate(c.updated_at)}</div>
            </div>
            ${isAdmin ? `
            <div class="detail-item">
              <div class="detail-label">표시 상태</div>
              <div class="detail-value">
                <span class="badge ${isHidden ? 'badge-hidden' : 'badge-visible'}">${isHidden ? '숨김' : '표시'}</span>
              </div>
            </div>` : ''}
          </div>
        </div>
      </div>

      <!-- 오른쪽 블록: 판매된 제품 정보 -->
      <div class="card">
        <div class="card-body">
          ${productSectionHtml}
        </div>
      </div>
    </div>`;

  if (isAdmin) {
    document.getElementById('btn-toggle-hide')?.addEventListener('click', async () => {
      const newState = !isHidden;
      const res = await API.put('/customer/hide.php', { id: c.id, is_hidden: newState });
      if (res.success) {
        await loadCustomer();
      } else {
        showAlert(document.getElementById('msg-area'), res.message, 'error');
      }
    });
  }
}

// 제품 삭제 함수 전역 등록
window.deleteProduct = async function(id) {
  if (!confirm('정말로 이 제품 정보를 삭제하시겠습니까?')) return;
  const res = await API.delete('/product/delete.php', { id });
  if (res.success) {
    showAlert(document.getElementById('msg-area'), '제품이 삭제되었습니다.', 'success');
    await loadCustomer();
  } else {
    showAlert(document.getElementById('msg-area'), res.message || '삭제 실패', 'error');
  }
};
