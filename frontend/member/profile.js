/**
 * profile.js — 내 정보 수정 페이지
 */

const form    = document.getElementById('profile-form');
const msgArea = document.getElementById('msg-area');
const btnSave = document.getElementById('btn-save');

(async () => {
  const user = await initLayout('profile');
  if (!user) return;

  // 현재 사용자 정보 표시
  document.getElementById('disp-login-id').value = user.id + ' (' + '••••••' + ')';

  // 이름 상세 조회
  const res = await API.get('/member/me.php');
  if (res.success) {
    document.getElementById('profile-name').value = res.data.name || '';
    document.getElementById('disp-login-id').value = res.data.id ? '#' + res.data.id : '';
  }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name  = document.getElementById('profile-name').value.trim();
  const pw    = document.getElementById('profile-pw').value;
  const pw2   = document.getElementById('profile-pw2').value;

  if (!name) {
    showAlert(msgArea, '이름은 필수 항목입니다.', 'error'); return;
  }

  if (pw !== '' || pw2 !== '') {
    if (pw.length < 6) {
      showAlert(msgArea, '비밀번호는 6자 이상이어야 합니다.', 'error'); return;
    }
    if (pw !== pw2) {
      showAlert(msgArea, '비밀번호가 일치하지 않습니다.', 'error'); return;
    }
  }

  const payload = { name };
  if (pw) payload.password = pw;

  setLoading(true);
  const res = await API.put('/member/update.php', payload);

  if (res.success) {
    showAlert(msgArea, '정보가 수정되었습니다.', 'success');
    document.getElementById('profile-pw').value  = '';
    document.getElementById('profile-pw2').value = '';
  } else {
    showAlert(msgArea, res.message || '수정에 실패했습니다.', 'error');
  }
  setLoading(false);
});

function setLoading(on) {
  btnSave.disabled     = on;
  btnSave.textContent  = on ? '저장 중...' : '저장';
}
