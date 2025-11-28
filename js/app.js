/**
 * 메인 애플리케이션 - 게시글 목록 렌더링
 */
(function () {
  let allPosts = [];

  /**
   * posts.json에서 게시글 목록 로드
   */
  async function loadPosts() {
    const listEl = document.getElementById('posts-list');
    const noPostsEl = document.getElementById('no-posts');
    
    // 로딩 상태 표시
    if (listEl) {
      listEl.innerHTML = '<li class="post-item"><p style="text-align: center; padding: 2rem; color: var(--color-text-muted);">게시글을 불러오는 중...</p></li>';
    }
    
    try {
      const response = await fetch('posts.json');
      if (!response.ok) {
        throw new Error('posts.json을 찾을 수 없습니다 (HTTP ' + response.status + ')');
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('posts.json 형식이 올바르지 않습니다');
      }
      
      allPosts = data;
      
      console.log('게시글 로드 성공:', allPosts.length + '개');
      
      // 검색 모듈에 데이터 전달
      if (window.BlogSearch) {
        window.BlogSearch.setPosts(allPosts);
      } else {
        console.warn('BlogSearch 모듈이 아직 로드되지 않았습니다');
      }

      renderPosts(allPosts);
      renderTags(allPosts);
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      console.error('에러 상세:', error.message);
      
      // 에러 메시지 표시
      if (listEl) {
        listEl.innerHTML = `
          <li class="post-item">
            <p style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
              게시글을 불러올 수 없습니다.<br>
              <small style="font-size: 0.875rem; margin-top: 0.5rem; display: block;">
                ${error.message}<br>
                로컬 서버를 사용하고 있는지 확인하세요.
              </small>
            </p>
          </li>
        `;
      }
      
      if (noPostsEl) {
        noPostsEl.style.display = 'block';
        noPostsEl.textContent = '게시글을 불러올 수 없습니다: ' + error.message;
      }
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
    if (e.detail && e.detail.posts) {
      renderPosts(e.detail.posts);
    }
  });

  // DOM 로드 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPosts);
  } else {
    // DOM이 이미 로드된 경우 즉시 실행
    loadPosts();
  }
})();

