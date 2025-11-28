/**
 * 메인 애플리케이션 - 게시글 목록 렌더링
 */
(function () {
  let allPosts = [];

  /**
   * posts.json에서 게시글 목록 로드
   */
  async function loadPosts() {
    try {
      const response = await fetch('posts.json');
      if (!response.ok) {
        throw new Error('posts.json을 찾을 수 없습니다');
      }
      allPosts = await response.json();
      
      // 검색 모듈에 데이터 전달
      if (window.BlogSearch) {
        window.BlogSearch.setPosts(allPosts);
      }

      renderPosts(allPosts);
      renderTags(allPosts);
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      showNoPosts();
    }
  }

  /**
   * 게시글 목록 렌더링
   */
  function renderPosts(posts) {
    const listEl = document.getElementById('posts-list');
    const noPostsEl = document.getElementById('no-posts');

    if (!listEl) return;

    if (!posts || posts.length === 0) {
      listEl.innerHTML = '';
      if (noPostsEl) noPostsEl.style.display = 'block';
      return;
    }

    if (noPostsEl) noPostsEl.style.display = 'none';

    listEl.innerHTML = posts.map(function (post) {
      const tagsHtml = post.tags.map(function (tag) {
        return '<span class="post-item-tag">' + escapeHtml(tag) + '</span>';
      }).join('');

      return `
        <li class="post-item">
          <a href="post.html?file=${encodeURIComponent(post.file)}" class="post-item-link">
            <h2 class="post-item-title">${escapeHtml(post.title)}</h2>
            <p class="post-item-excerpt">${escapeHtml(post.excerpt || post.description)}</p>
            <div class="post-item-meta">
              <time>${formatDate(post.date)}</time>
              ${post.category ? '<span>' + escapeHtml(post.category) + '</span>' : ''}
            </div>
            ${tagsHtml ? '<div class="post-item-tags">' + tagsHtml + '</div>' : ''}
          </a>
        </li>
      `;
    }).join('');
  }

  /**
   * 태그 목록 렌더링
   */
  function renderTags(posts) {
    const container = document.getElementById('tags-container');
    if (!container) return;

    // 모든 태그 수집 및 카운트
    const tagCounts = {};
    posts.forEach(function (post) {
      post.tags.forEach(function (tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // 태그를 카운트 순으로 정렬
    const sortedTags = Object.keys(tagCounts).sort(function (a, b) {
      return tagCounts[b] - tagCounts[a];
    });

    if (sortedTags.length === 0) {
      container.style.display = 'none';
      return;
    }

    // "전체" 버튼 + 태그 버튼들
    let html = '<button class="tag-btn active" data-tag="">전체</button>';
    html += sortedTags.map(function (tag) {
      return `<button class="tag-btn" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)} (${tagCounts[tag]})</button>`;
    }).join('');

    container.innerHTML = html;

    // 태그 클릭 이벤트
    container.addEventListener('click', function (e) {
      if (!e.target.classList.contains('tag-btn')) return;

      // 활성 상태 변경
      container.querySelectorAll('.tag-btn').forEach(function (btn) {
        btn.classList.remove('active');
      });
      e.target.classList.add('active');

      // 필터링 적용
      const tag = e.target.dataset.tag || null;
      if (window.BlogSearch) {
        window.BlogSearch.setActiveTag(tag);
      }
    });
  }

  /**
   * 게시글 없음 표시
   */
  function showNoPosts() {
    const listEl = document.getElementById('posts-list');
    const noPostsEl = document.getElementById('no-posts');

    if (listEl) listEl.innerHTML = '';
    if (noPostsEl) noPostsEl.style.display = 'block';
  }

  /**
   * 날짜 포맷팅
   */
  function formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * HTML 이스케이프
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // 검색 결과 이벤트 리스너
  document.addEventListener('postsFiltered', function (e) {
    renderPosts(e.detail.posts);
  });

  // DOM 로드 후 초기화
  document.addEventListener('DOMContentLoaded', loadPosts);
})();

