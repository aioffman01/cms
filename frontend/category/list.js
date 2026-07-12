/**
 * list.js - 대항목 & 세부 항목 관리 시스템 프론트엔드 스크립트
 */

let currentUser = null;
let categories = [];
let items = [];
let selectedCategoryId = null;

(async () => {
  currentUser = await initLayout('category-list');
  if (!currentUser) return;

  // 관리자 권한 체크
  if (currentUser.role !== 'admin') {
    alert('관리자만 접근 가능한 페이지입니다.');
    window.location.href = '../inspection/list.html';
    return;
  }

  // 초기 로드
  await loadCategories();
  setupEvents();
})();

/** 대항목 목록 로드 */
async function loadCategories() {
  const container = document.getElementById('category-list-container');
  container.innerHTML = '<div class="loading"><div class="spinner"></div>불러오는 중...</div>';

  const res = await API.get('/mng_category/list.php');
  if (!res.success) {
    showAlert(document.getElementById('msg-area'), res.message || '대항목 목록을 불러오지 못했습니다.', 'error');
    container.innerHTML = '<div class="text-muted text-center py-4">데이터 로드 실패</div>';
    return;
  }

  categories = res.data || [];
  renderCategories();
}

/** 대항목 카드 렌더링 */
function renderCategories() {
  const container = document.getElementById('category-list-container');
  container.innerHTML = '';

  if (categories.length === 0) {
    container.innerHTML = '<div class="text-muted text-center py-4">등록된 대항목이 없습니다.</div>';
    // 세부 항목 패널 초기화
    document.getElementById('item-panel-container').innerHTML = `
      <div class="placeholder-card">
        좌측에서 대항목을 선택하시면 세부 항목을 관리할 수 있습니다.
      </div>
    `;
    selectedCategoryId = null;
    return;
  }

  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = `category-card ${selectedCategoryId === cat.id ? 'active' : ''}`;
    card.dataset.id = cat.id;

    const useBadge = cat.is_use === 'Y' 
      ? '<span class="status-badge status-active">사용중</span>' 
      : '<span class="status-badge status-inactive">미사용</span>';

    card.innerHTML = `
      <div class="category-header">
        <span class="category-code-badge">${escHtml(cat.code)}</span>
        ${useBadge}
      </div>
      <div class="category-name-txt">${escHtml(cat.name)}</div>
      <div class="category-actions">
        <button class="btn btn-ghost btn-xs btn-edit-cat" data-id="${cat.id}">수정</button>
        <button class="btn btn-danger btn-xs btn-del-cat" data-id="${cat.id}">삭제</button>
      </div>
    `;

    // 카드 영역 클릭 시 세부 항목 로딩 (액션 버튼 클릭 시는 동작 제외)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.category-actions')) return;
      selectCategory(cat.id);
    });

    container.appendChild(card);
  });

  // 수정/삭제 버튼 바인딩
  container.querySelectorAll('.btn-edit-cat').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCategoryModal(parseInt(btn.dataset.id));
    });
  });

  container.querySelectorAll('.btn-del-cat').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCategory(parseInt(btn.dataset.id));
    });
  });
}

/** 대항목 선택 처리 */
async function selectCategory(categoryId) {
  selectedCategoryId = categoryId;
  
  // 좌측 목록 활성화 상태 강조 재렌더링
  const cards = document.querySelectorAll('.category-card');
  cards.forEach(card => {
    if (parseInt(card.dataset.id) === categoryId) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  await loadItems();
}

/** 특정 대항목의 세부 항목 목록 로드 */
async function loadItems() {
  const cat = categories.find(c => c.id === selectedCategoryId);
  if (!cat) return;

  const panel = document.getElementById('item-panel-container');
  panel.innerHTML = `
    <div class="card" style="margin-bottom: 0;">
      <div class="card-header" style="padding-bottom: 12px; align-items: center; justify-content: space-between;">
        <div>
          <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
            <span class="category-code-badge" style="font-size: 13px;">${escHtml(cat.code)}</span>
            <span>${escHtml(cat.name)} 세부 항목</span>
          </div>
          <div class="text-xs text-muted" style="margin-top: 4px;">${escHtml(cat.description || '대항목 설명이 없습니다.')}</div>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-item">+ 세부 항목 등록</button>
      </div>
      <div id="item-table-area" style="padding: 0 16px 16px;">
        <div class="loading"><div class="spinner"></div>불러오는 중...</div>
      </div>
    </div>
  `;

  // 세부 항목 등록 버튼 바인딩
  document.getElementById('btn-add-item').addEventListener('click', () => openItemModal());

  const tableArea = document.getElementById('item-table-area');
  const res = await API.get('/mng_item/list.php', { category_id: selectedCategoryId });

  if (!res.success) {
    tableArea.innerHTML = '<div class="text-muted text-center py-4">세부 항목 로딩 실패</div>';
    return;
  }

  items = res.data || [];
  renderItemsTable(tableArea);
}

/** 세부 항목 테이블 렌더링 */
function renderItemsTable(container) {
  if (items.length === 0) {
    container.innerHTML = '<div class="text-muted text-center py-6">소속된 세부 항목이 없습니다. 신규 추가해 주세요.</div>';
    return;
  }

  let rowsHtml = '';
  items.forEach(item => {
    const useBadge = item.is_use === 'Y' 
      ? '<span class="status-badge status-active">사용</span>' 
      : '<span class="status-badge status-inactive">미사용</span>';

    rowsHtml += `
      <tr>
        <td class="table-code-txt">${escHtml(item.full_code)}</td>
        <td style="font-weight:600; color:var(--text);">${escHtml(item.name)}</td>
        <td>${useBadge}</td>
        <td>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-xs btn-edit-item" style="min-width: 60px; padding: 4px 10px;" data-id="${item.id}">수정</button>
            <button class="btn btn-danger btn-xs btn-del-item" style="min-width: 60px; padding: 4px 10px;" data-id="${item.id}">삭제</button>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 25%;">최종 코드명</th>
            <th style="width: 45%;">세부 항목 이름</th>
            <th>사용여부</th>
            <th style="width: 160px;">관리</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  // 세부 항목 수정/삭제 버튼 바인딩
  container.querySelectorAll('.btn-edit-item').forEach(btn => {
    btn.addEventListener('click', () => openItemModal(parseInt(btn.dataset.id)));
  });

  container.querySelectorAll('.btn-del-item').forEach(btn => {
    btn.addEventListener('click', () => deleteItem(parseInt(btn.dataset.id)));
  });
}

/** 대항목 모달 제어 */
function openCategoryModal(categoryId = null) {
  const modal = document.getElementById('category-modal');
  const title = document.getElementById('cat-modal-title');
  const form = document.getElementById('category-form');
  
  form.reset();
  document.getElementById('category-id').value = '';
  document.getElementById('category-code').disabled = false;

  if (categoryId) {
    // 수정 모드
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;

    title.textContent = '대항목 수정';
    document.getElementById('category-id').value = cat.id;
    document.getElementById('category-code').value = cat.code;
    document.getElementById('category-code').disabled = true; // 수정 시 코드 수정 방지
    document.getElementById('category-name').value = cat.name;
    document.querySelector(`input[name="category-use"][value="${cat.is_use}"]`).checked = true;
    document.getElementById('category-desc').value = cat.description || '';
  } else {
    // 등록 모드
    title.textContent = '대항목 등록';
  }

  modal.classList.add('active');
}

/** 세부 항목 모달 제어 */
function openItemModal(itemId = null) {
  const cat = categories.find(c => c.id === selectedCategoryId);
  if (!cat) return;

  const modal = document.getElementById('item-modal');
  const title = document.getElementById('item-modal-title');
  const form = document.getElementById('item-form');
  
  form.reset();
  document.getElementById('item-id').value = '';
  document.getElementById('item-parent-code').value = cat.code;
  document.getElementById('item-code').disabled = false;

  if (itemId) {
    // 수정 모드
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    title.textContent = '세부 항목 수정';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-code').value = item.code;
    document.getElementById('item-code').disabled = true; // 수정 시 코드 수정 방지
    document.getElementById('item-name').value = item.name;
    document.querySelector(`input[name="item-use"][value="${item.is_use}"]`).checked = true;
    document.getElementById('item-desc').value = item.description || '';
  } else {
    // 등록 모드
    title.textContent = '세부 항목 등록';
  }

  modal.classList.add('active');
}

/** 대항목 삭제 */
async function deleteCategory(id) {
  const cat = categories.find(c => c.id === id);
  if (!cat) return;

  if (!confirm(`정말로 대항목 "${cat.name} (${cat.code})"을 삭제하시겠습니까?\n이 대항목에 소속된 모든 세부 항목들도 함께 삭제됩니다.`)) return;

  const res = await API.delete('/mng_category/delete.php', { id });
  if (res.success) {
    showAlert(document.getElementById('msg-area'), '대항목이 안전하게 삭제되었습니다.', 'success');
    if (selectedCategoryId === id) {
      selectedCategoryId = null;
    }
    await loadCategories();
  } else {
    alert(res.message || '대항목 삭제 오류');
  }
}

/** 세부 항목 삭제 */
async function deleteItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  if (!confirm(`정말로 세부 항목 "${item.name} (${item.full_code})"을 삭제하시겠습니까?`)) return;

  const res = await API.delete('/mng_item/delete.php', { id });
  if (res.success) {
    showAlert(document.getElementById('msg-area'), '세부 항목이 성공적으로 삭제되었습니다.', 'success');
    await loadItems();
  } else {
    alert(res.message || '세부 항목 삭제 오류');
  }
}

/** 공통 이벤트 처리기 바인딩 */
function setupEvents() {
  // A-1. 대항목 모달 취소
  document.getElementById('cat-modal-cancel').addEventListener('click', () => {
    document.getElementById('category-modal').classList.remove('active');
  });

  // A-2. 대항목 폼 등록 버튼
  document.getElementById('btn-add-category').addEventListener('click', () => openCategoryModal());

  // A-3. 대항목 폼 서브밋
  document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const id = document.getElementById('category-id').value;
    const code = document.getElementById('category-code').value.trim().toUpperCase();
    const name = document.getElementById('category-name').value.trim();
    const isUse = document.querySelector('input[name="category-use"]:checked').value;
    const desc = document.getElementById('category-desc').value.trim();

    const payload = { code, name, is_use: isUse, description: desc };
    
    let res;
    if (id) {
      payload.id = parseInt(id);
      res = await API.put('/mng_category/update.php', payload);
    } else {
      res = await API.post('/mng_category/create.php', payload);
    }

    if (res.success) {
      document.getElementById('category-modal').classList.remove('active');
      showAlert(document.getElementById('msg-area'), id ? '대항목 정보가 수정되었습니다.' : '대항목이 정상 등록되었습니다.', 'success');
      
      const prevSelected = selectedCategoryId;
      await loadCategories();
      
      // 수정 혹은 신규 등록 시 해당 카테고리 로딩 유지
      if (id && prevSelected) {
        await selectCategory(prevSelected);
      } else if (!id && res.data && res.data.id) {
        await selectCategory(res.data.id);
      }
    } else {
      alert(res.message || '대항목 저장 오류');
    }
  });

  // B-1. 세부 항목 모달 취소
  document.getElementById('item-modal-cancel').addEventListener('click', () => {
    document.getElementById('item-modal').classList.remove('active');
  });

  // B-3. 세부 항목 폼 서브밋
  document.getElementById('item-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const id = document.getElementById('item-id').value;
    const code = document.getElementById('item-code').value.trim().toUpperCase();
    const name = document.getElementById('item-name').value.trim();
    const isUse = document.querySelector('input[name="item-use"]:checked').value;
    const desc = document.getElementById('item-desc').value.trim();

    const payload = { code, name, is_use: isUse, description: desc };

    let res;
    if (id) {
      payload.id = parseInt(id);
      res = await API.put('/mng_item/update.php', payload);
    } else {
      payload.category_id = selectedCategoryId;
      res = await API.post('/mng_item/create.php', payload);
    }

    if (res.success) {
      document.getElementById('item-modal').classList.remove('active');
      showAlert(document.getElementById('msg-area'), id ? '세부 항목이 수정되었습니다.' : '세부 항목이 등록되었습니다.', 'success');
      await loadItems();
    } else {
      alert(res.message || '세부 항목 저장 오류');
    }
  });
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
