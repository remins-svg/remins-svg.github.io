/**
 * 클라이언트 사이드 검색 기능
 */
(function () {
  let posts = [];
  let activeTag = null;
  let searchQuery = '';

  /**
   * 게시글 데이터 설정
   */
  function setPosts(data) {
    posts = data || [];
  }

  /**
   * 현재 활성 태그 설정
   */
  function setActiveTag(tag) {
    activeTag = tag;
    filterAndRender();
  }

  /**
   * 검색어 설정
   */
  function setSearchQuery(query) {
    searchQuery = query.toLowerCase().trim();
    filterAndRender();
  }

  /**
   * 게시글 필터링
   */
  function filterPosts() {
    return posts.filter(function (post) {
      // 태그 필터링
      if (activeTag && !post.tags.includes(activeTag)) {
        return false;
      }

      // 검색어 필터링
      if (searchQuery) {
        const titleMatch = post.title.toLowerCase().includes(searchQuery);
        const excerptMatch = post.excerpt.toLowerCase().includes(searchQuery);
        const descMatch = post.description.toLowerCase().includes(searchQuery);
        const tagMatch = post.tags.some(function (tag) {
          return tag.toLowerCase().includes(searchQuery);
        });

        if (!titleMatch && !excerptMatch && !descMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 필터링 후 렌더링 트리거
   */
  function filterAndRender() {
    const filtered = filterPosts();
    
    // 커스텀 이벤트로 결과 전달
    const event = new CustomEvent('postsFiltered', {
      detail: { posts: filtered }
    });
    document.dispatchEvent(event);
  }

  /**
   * 검색 입력 초기화
   */
  function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    let debounceTimer;

    searchInput.addEventListener('input', function (e) {
      clearTimeout(debounceTimer);
      
      // 300ms 디바운스로 성능 최적화
      debounceTimer = setTimeout(function () {
        setSearchQuery(e.target.value);
      }, 300);
    });

    // Enter 키 즉시 검색
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        clearTimeout(debounceTimer);
        setSearchQuery(e.target.value);
      }
    });
  }

  // DOM 로드 후 초기화
  document.addEventListener('DOMContentLoaded', initSearch);

  // 전역 API 노출
  window.BlogSearch = {
    setPosts: setPosts,
    setActiveTag: setActiveTag,
    setSearchQuery: setSearchQuery,
    filterPosts: filterPosts,
    getActiveTag: function () { return activeTag; },
    getSearchQuery: function () { return searchQuery; }
  };
})();

