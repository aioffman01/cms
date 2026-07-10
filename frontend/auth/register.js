/**
 * register.js — [관리자] 신규 회원 등록 동작
 */

const form    = document.getElementById('register-form');
const msgArea = document.getElementById('msg-area');
const btnReg  = document.getElementById('btn-register');

(async () => {
  // 사이드바 로드 및 관리자 권한 확인
  const user = await initLayout('member-manage');
  if (!user) return;
  
  if (user.role !== 'admin') {
    showAlert(msgArea, '관리자만 회원 등록이 가능합니다.', 'error');
    form.style.display = 'none';
  }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const loginId   = document.getElementById('reg-id').value.trim();
  const password  = document.getElementById('reg-pw').value;
  const password2 = document.getElementById('reg-pw2').value;
  const name      = document.getElementById('reg-name').value.trim();

  // 유효성 검사
  if (!loginId || !password || !password2 || !name) {
    showAlert(msgArea, '모든 필수 항목을 입력해주세요.', 'error'); return;
  }
  if (loginId.length < 4) {
    showAlert(msgArea, '아이디는 4자 이상이어야 합니다.', 'error'); return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(loginId)) {
    showAlert(msgArea, '아이디는 영문, 숫자, 밑줄(_)만 사용 가능합니다.', 'error'); return;
  }
  if (password.length < 6) {
    showAlert(msgArea, '비밀번호는 6자 이상이어야 합니다.', 'error'); return;
  }
  if (password !== password2) {
    showAlert(msgArea, '비밀번호 확인이 일치하지 않습니다.', 'error'); return;
  }

  setLoading(true);

  const res = await API.post('/member/register.php', {
    login_id: loginId,
    password,
    name,
  });

  if (res.success) {
    showAlert(msgArea, '신규 회원이 등록되었습니다. 회원 관리 목록으로 이동합니다.', 'success');
    setTimeout(() => { window.location.href = '../member/manage.html'; }, 1000);
  } else {
    showAlert(msgArea, res.message || '등록에 실패했습니다.', 'error');
    setLoading(false);
  }
});

function setLoading(on) {
  btnReg.disabled     = on;
  btnReg.textContent  = on ? '등록 중...' : '등록 완료';
}
