// =============================================
// TechWorld Smart Post Loader (Fixed Image)
// =============================================

(function () {
    const SURL = "https://csjwyvngqynqjbuwtsdv.supabase.co".trim();
    const SKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzand5dm5ncXlucWpidXd0c2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NTEzMjQsImV4cCI6MjA5NDEyNzMyNH0.21KDagCTN31_ytNhhqSQZ0_mvXzu7QbIEFYgzpgrZDY".trim();
    const STORAGE_BUCKET = "blog-images";
    const supabase = window.supabase.createClient(SURL, SKEY);

    async function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        const postSlug = urlParams.get('slug');

        if (postId || postSlug) {
            await loadMainPost(postId, postSlug);
        }
        await loadRecentPostsSidebar();
    }

    async function loadMainPost(id, slug) {
        try {
            let query = supabase.from('posts').select('*');
            if (id) query = query.eq('id', id);
            else if (slug) query = query.eq('slug', slug);

            const { data: post, error } = await query.single();
            if (error || !post) return;

            document.getElementById('fallback-content').style.display = 'none';
            document.getElementById('dynamic-content-area').style.display = 'block';

            document.title = post.title + " — TechWorld";
            const hCat = document.querySelector('.ve-page-hero .ve-insight-cat');
            if (hCat) hCat.textContent = post.category || "Tech";

            const hTitle = document.getElementById('hero-title');
            if (hTitle) hTitle.innerHTML = post.title;

            let author = "TechWorld Admin";
            let postContent = post.content || '';
            const parser = new DOMParser();
            const doc = parser.parseFromString(postContent, 'text/html');
            const metaElem = doc.getElementById('ve-post-metadata');
            if (metaElem) {
                author = decodeURIComponent(metaElem.getAttribute('data-author') || "").trim() || "TechWorld Admin";
                metaElem.remove();
                postContent = doc.body.innerHTML;
            }

            const hMeta = document.getElementById('hero-meta');
            if (hMeta) {
                const dateStr = new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                hMeta.innerHTML = `<span><i class="fa fa-calendar"></i> ${dateStr}</span><span><i class="fa fa-user"></i> ${author}</span>`;
            }

            // HIỂN THỊ ẢNH
            let imgUrl = "img/bg-img/20.jpg";
            if (post.image_key) {
                const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(post.image_key);
                if (publicData) imgUrl = publicData.publicUrl;
            } else if (post.image) {
                imgUrl = post.image;
            }

            const fImg = document.getElementById('post-featured-img');
            if (fImg) {
                fImg.style.backgroundImage = `url("${imgUrl}")`;
            }

            const heroSec = document.querySelector('.ve-page-hero');
            if (heroSec) {
                heroSec.style.setProperty('--hero-bg', `url("${imgUrl}")`);
            }
            console.log("Loading image:", imgUrl);

            const pBody = document.getElementById('post-body-content');
            if (pBody) {
                pBody.innerHTML = `
                    <p class="ve-article-lead">${post.excerpt || ""}</p>
                    <div class="post-main-content" style="margin-top:30px; line-height: 1.8; font-size: 1.1rem; color: #333;">
                        ${postContent}
                    </div>
                `;
            }

            // HIỂN THỊ TAGS
            const tagArea = document.getElementById('post-tags');
            if (tagArea && post.tags) {
                const tags = post.tags.split(',').map(t => t.trim()).filter(t => t);
                if (tags.length > 0) {
                    tagArea.style.setProperty('display', 'flex', 'important');
                    tagArea.innerHTML = '<strong>Tags:</strong>' + 
                        tags.map(t => `<a href="insights.html?tag=${encodeURIComponent(t)}">${t}</a>`).join('');
                }
            }

            // --- COMMENT SYSTEM ---
            await loadComments(post.id);
            const cForm = document.getElementById('comment-form');
            if (cForm) {
                cForm.onsubmit = async (e) => {
                    e.preventDefault();
                    await submitComment(post.id);
                };
            }
            document.dispatchEvent(new CustomEvent('post-loaded', { detail: post }));
        } catch (e) { console.error("Main Post Error:", e); }
    }

    async function loadComments(postId) {
        const container = document.getElementById('comments-container');
        if (!container) return;
        try {
            const { data: comments, error } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: false });
            if (error) throw error;
            if (comments && comments.length > 0) {
                container.innerHTML = comments.map(c => `
                    <div class="ve-comment">
                        <div class="ve-comment-avatar" style="background-image: url('https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_name)}&background=d4a017&color=0d1b2a&bold=true');"></div>
                        <div class="ve-comment-body">
                            <div class="ve-comment-meta">
                                <strong>${c.user_name}</strong>
                                <span>${new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <p>${c.comment_body}</p>
                        </div>
                    </div>`).join('');
            } else {
                container.innerHTML = '<p style="color:#999">No comments yet. Be the first to share your thoughts!</p>';
            }
        } catch (err) { console.error("Comments Load Error:", err); }
    }

    async function submitComment(postId) {
        const name = document.getElementById('c-name').value.trim();
        const body = document.getElementById('c-body').value.trim();
        const btn = document.querySelector('#comment-form button');
        if (!name || !body) return;
        try {
            btn.disabled = true; btn.textContent = 'Posting...';
            const { error } = await supabase.from('comments').insert([{ post_id: postId, user_name: name, comment_body: body }]);
            if (error) throw error;
            document.getElementById('c-name').value = '';
            document.getElementById('c-body').value = '';
            await loadComments(postId);
            if (window.showToast) window.showToast("Comment posted!", "success");
            else alert("Comment posted!");
        } catch (err) { 
            if (window.showAlert) window.showAlert("Error", err.message, "error");
            else alert("Error: " + err.message);
        }
        finally { btn.disabled = false; btn.textContent = 'Post Comment'; }
    }

    async function loadRecentPostsSidebar() {
        const sidebarWidget = document.querySelector('.ve-sidebar-widget');
        if (!sidebarWidget) return;
        try {
            const { data: posts, error } = await supabase.from('posts').select('*').eq('published', true).order('created_at', { ascending: false }).limit(3);
            if (error || !posts) return;

            const widgetTitle = Array.from(document.querySelectorAll('.ve-sidebar-title')).find(el => el.textContent.includes('Recent'));
            if (!widgetTitle) return;

            sidebarWidget.querySelectorAll('.ve-recent-post').forEach(el => el.remove());

            const postsHtml = posts.map(p => {
                let imgUrl = "img/bg-img/20.jpg";
                if (p.image_key) {
                    imgUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(p.image_key).data.publicUrl;
                } else if (p.image) {
                    imgUrl = p.image;
                }
                const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const link = p.slug ? `single-post.html?slug=${p.slug}` : `single-post.html?id=${p.id}`;
                return `
                    <div class="ve-recent-post">
                        <div class="ve-rp-img bg-img" style="background-image:url(${imgUrl});"></div>
                        <div><a href="${link}">${p.title}</a><span><i class="fa fa-calendar"></i> ${date}</span></div>
                    </div>`;
            }).join('');
            widgetTitle.insertAdjacentHTML('afterend', postsHtml);
        } catch (e) { console.error("Sidebar Error:", e); }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
