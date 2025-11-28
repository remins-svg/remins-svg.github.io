/**
 * 게시글 로더 - 마크다운 파싱 및 렌더링
 */
(function () {
  /**
   * URL에서 파일명 추출
   */
  function getFileFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('file');
  }

  /**
   * Front Matter 파싱
   */
  function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!match) {
      return { metadata: {}, content: content };
    }

    const frontMatter = match[1];
    const postContent = match[2];
    const metadata = {};

    // Front Matter 라인별 파싱
    frontMatter.split('\n').forEach(function (line) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // 따옴표 제거
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        // 배열 파싱 (tags)
        if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch {
            value = value
              .slice(1, -1)
              .split(',')
              .map(function (tag) {
                return tag.trim().replace(/^['"]|['"]$/g, '');
              });
          }
        }

        metadata[key] = value;
      }
    });

    return { metadata: metadata, content: postContent };
  }

  /**
   * 게시글 렌더링
   */
  function renderPost(metadata, htmlContent) {
    // 제목
    const titleEl = document.getElementById('post-title');
    if (titleEl) {
      titleEl.textContent = metadata.title || '제목 없음';
      document.title = metadata.title + " - remins-svg's Blog";
    }

    // 날짜
    const dateEl = document.getElementById('post-date');
    if (dateEl && metadata.date) {
      dateEl.textContent = formatDate(metadata.date);
    }

    // 카테고리
    const categoryEl = document.getElementById('post-category');
    if (categoryEl) {
      if (metadata.category) {
        categoryEl.textContent = metadata.category;
        categoryEl.style.display = 'inline-block';
      } else {
        categoryEl.style.display = 'none';
      }
    }

    // 태그
    const tagsEl = document.getElementById('post-tags');
    if (tagsEl && Array.isArray(metadata.tags) && metadata.tags.length > 0) {
      tagsEl.innerHTML = metadata.tags.map(function (tag) {
        return '<span class="post-tag">' + escapeHtml(tag) + '</span>';
      }).join('');
    }

    // 메타 설명 업데이트
    if (metadata.description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', metadata.description);
      }
    }

    // 본문
    const contentEl = document.getElementById('post-content');
    if (contentEl) {
      contentEl.innerHTML = htmlContent;

      // 코드 하이라이팅 적용
      if (window.Prism) {
        Prism.highlightAllUnder(contentEl);
      }
    }
  }

  /**
   * 게시글 로드
   */
  async function loadPost() {
    const filename = getFileFromUrl();

    if (!filename) {
      showError('게시글을 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await fetch('pages/' + filename);
      
      if (!response.ok) {
        throw new Error('게시글을 불러올 수 없습니다');
      }

      const markdown = await response.text();
      const { metadata, content } = parseFrontMatter(markdown);

      // marked.js로 마크다운 → HTML 변환
      if (window.marked) {
        // marked 옵션 설정
        marked.setOptions({
          breaks: true,
          gfm: true
        });

        const htmlContent = marked.parse(content);
        renderPost(metadata, htmlContent);
        
        // Giscus 댓글 로드
        loadGiscus();
      } else {
        showError('마크다운 파서를 로드할 수 없습니다.');
      }
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      showError('게시글을 불러오는 중 오류가 발생했습니다.');
    }
  }

  /**
   * Giscus 댓글 로드
   */
  function loadGiscus() {
    const commentsEl = document.getElementById('comments');
    if (!commentsEl) return;

    // 기존 스크립트 제거
    const existing = commentsEl.querySelector('.giscus');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'remins-svg/remins-svg.github.io');
    script.setAttribute('data-repo-id', 'YOUR_REPO_ID'); // 실제 값으로 교체 필요
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'YOUR_CATEGORY_ID'); // 실제 값으로 교체 필요
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '1');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'ko');
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;

    commentsEl.appendChild(script);
  }

  /**
   * 에러 표시
   */
  function showError(message) {
    const contentEl = document.getElementById('post-content');
    const titleEl = document.getElementById('post-title');

    if (titleEl) titleEl.textContent = '오류';
    if (contentEl) {
      contentEl.innerHTML = '<p class="loading" style="color: var(--color-text-muted);">' + escapeHtml(message) + '</p>';
    }
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

  // DOM 로드 후 게시글 로드
  document.addEventListener('DOMContentLoaded', loadPost);
})();

