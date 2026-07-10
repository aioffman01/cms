/**
 * login.js — 로그인 페이지 동작
 */

const form    = document.getElementById('login-form');
const msgArea = document.getElementById('msg-area');
const btnLogin = document.getElementById('btn-login');

// 이미 로그인된 경우 바로 이동
(async () => {
  const res = await API.get('/member/me.php');
  if (res.success) {
    window.location.href = '../customer/list.html';
  }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const loginId  = document.getElementById('login-id').value.trim();
  const password = document.getElementById('login-pw').value;

  if (!loginId || !password) {
    showMsg('아이디와 비밀번호를 입력해주세요.', 'error');
    return;
  }

  setLoading(true);

  const res = await API.post('/member/login.php', { login_id: loginId, password });

  if (res.success) {
    showMsg('로그인 성공! 이동 중...', 'success');
    setTimeout(() => {
      window.location.href = '../customer/list.html';
    }, 400);
  } else {
    showMsg(res.message || '로그인에 실패했습니다.', 'error');
    setLoading(false);
    document.getElementById('login-pw').value = '';
    document.getElementById('login-pw').focus();
  }
});

function showMsg(text, type) {
  const icon = type === 'success' ? '✓' : '✕';
  msgArea.innerHTML = `
    <div class="alert alert-${type}">
      <span>${icon}</span><span>${text}</span>
    </div>`;
}

function setLoading(on) {
  btnLogin.disabled  = on;
  btnLogin.textContent = on ? '로그인 중...' : '로그인';
}
