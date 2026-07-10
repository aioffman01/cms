/**
 * api.js - Backend API 호출 공통 모듈
 * 모든 frontend 페이지에서 사용
 * 경로: /frontend/common/api.js
 */

const API_BASE = '../../backend';

const API = {
  /**
   * HTTP 요청 공통 처리
   * @param {string} method - HTTP 메서드
   * @param {string} path   - /member/login.php 형태
   * @param {object|null} data - 요청 데이터
   */
  async request(method, path, data = null) {
    const options = {
      method,
      credentials: 'same-origin', // 세션 쿠키 포함
    };

    let url = API_BASE + path;

    if (method === 'GET' && data) {
      url += '?' + new URLSearchParams(data).toString();
    } else if (data !== null) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const json = await response.json();
      return json;
    } catch (err) {
      console.error('API 요청 오류:', err);
      return { success: false, message: '서버 연결에 실패했습니다.' };
    }
  },

  get(path, params = null)  { return this.request('GET',    path, params); },
  post(path, data)           { return this.request('POST',   path, data); },
  put(path, data)            { return this.request('PUT',    path, data); },
  delete(path, data = null)  { return this.request('DELETE', path, data); },
};
