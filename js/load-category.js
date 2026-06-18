/**
 * TechWorld Universal Category Loader
 * Handles dynamic post loading for AI, Programming, Cybersecurity, etc.
 */

(function () {
    const SURL = "https://csjwyvngqynqjbuwtsdv.supabase.co".trim();
    const SKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzand5dm5ncXlucWpidXd0c2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NTEzMjQsImV4cCI6MjA5NDEyNzMyNH0.21KDagCTN31_ytNhhqSQZ0_mvXzu7QbIEFYgzpgrZDY".trim();
    const STORAGE_BUCKET = "blog-images";
    const supabase = window.supabase.createClient(SURL, SKEY);

    let currentPage = 0;
    const itemsPerPage = 6;
    let category = 'All';

    async function init() {
        const container = document.getElementById('posts-container');
        if (!container) return;

        category = container.getAttribute('data-category') || 'All';
        console.log(`🚀 Loading posts for category: ${category}`);

        await loadPosts(true);

        // Optional: Simple Pagination if container exists
        const pagContainer = document.getElementById('posts-pagination');
        if (pagContainer) {
            // We could add pagination logic here if needed
        }
    }

    async function loadPosts(reset = false) {
        const container = document.getElementById('posts-container');
        if (!container) return;

        try {
            let query = supabase
                .from('posts')
                .select('*', { count: 'exact' })
                .eq('published', true)
                .order('created_at', { ascending: false });

            if (category !== 'All') {
                query = query.eq('category', category);
            }

            // Pagination
            const from = currentPage * itemsPerPage;
            const to = from + itemsPerPage - 1;
            query = query.range(from, to);

            const { data: posts, count, error } = await query;

            if (error) throw error;

            if (posts && posts.length > 0) {
                const html = posts.map(p => renderCard(p)).join('');
                if (reset) container.innerHTML = html;
                else container.insertAdjacentHTML('beforeend', html);
                
                renderPagination(count);
            } else {
                container.innerHTML = `<div class="col-12 text-center mt-5"><h4>No articles found in this category yet.</h4></div>`;
            }
        } catch (err) {
            console.error("Error loading posts:", err);
        }
    }

    function renderCard(post) {
        const imgUrl = getImageUrl(post);
        const link = post.slug ? `single-post.html?slug=${post.slug}` : `single-post.html?id=${post.id}`;
        const excerpt = post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '');
        
        return `
            <div class="col-12 col-md-4 mb-30">
                <div class="ve-insight-card">
                    <div class="ve-insight-img bg-img" style="background-image:url('${imgUrl}');"></div>
                    <div class="ve-insight-body">
                        <span class="ve-insight-cat">${post.category || category}</span>
                        <h5><a href="${link}">${post.title}</a></h5>
                        <p>${excerpt}</p>
                    </div>
                </div>
            </div>
        `;
    }

    function getImageUrl(post) {
        if (post.image_key) {
            const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(post.image_key);
            if (data) return data.publicUrl;
        }
        if (post.image) return post.image;
        return "img/bg-img/10.jpg";
    }

    function renderPagination(total) {
        const pagContainer = document.getElementById('posts-pagination');
        if (!pagContainer) return;

        const totalPages = Math.ceil(total / itemsPerPage);
        if (totalPages <= 1) {
            pagContainer.innerHTML = '';
            return;
        }

        let html = '';
        for (let i = 0; i < totalPages; i++) {
            html += `<a href="#" class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i + 1}</a>`;
        }
        pagContainer.innerHTML = html;

        pagContainer.querySelectorAll('a').forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                currentPage = parseInt(link.getAttribute('data-page'));
                loadPosts(true);
                window.scrollTo({ top: document.getElementById('posts-container').offsetTop - 100, behavior: 'smooth' });
            };
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
