/**
 * TechWorld Insights Loader
 * Handles dynamic sidebar, category filtering, and "Load More" pagination.
 */

(function () {
    const SURL = "https://csjwyvngqynqjbuwtsdv.supabase.co".trim();
    const SKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzand5dm5ncXlucWpidXd0c2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NTEzMjQsImV4cCI6MjA5NDEyNzMyNH0.21KDagCTN31_ytNhhqSQZ0_mvXzu7QbIEFYgzpgrZDY".trim();
    const STORAGE_BUCKET = "blog-images";
    const supabase = window.supabase.createClient(SURL, SKEY);

    let currentPage = 0;
    const itemsPerPage = 6;
    let currentCategory = 'All';
    let currentTag = '';
    let searchQuery = '';
    let hasMore = true;

    async function init() {
        console.log("🚀 Insights Loader Initializing...");

        // Check for filters in URL
        const urlParams = new URLSearchParams(window.location.search);
        const tagParam = urlParams.get('tag');
        const catParam = urlParams.get('category');
        const sParam = urlParams.get('s');

        if (tagParam) {
            currentTag = tagParam;
            currentCategory = 'All';
        } else if (catParam) {
            currentCategory = catParam;
            currentTag = '';
        } else if (sParam) {
            searchQuery = sParam;
        }

        // Initial load
        await loadSiteContent('page_banner_insights', 'page-hero-banner');
        await loadSiteContent('page_tag_insights', 'page-hero-tag');
        await loadSiteContent('page_title_insights', 'page-hero-title');

        await loadCategories();
        await loadRecentSidebarPosts();
        await loadInsights(true);

        // Event Listeners
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                if (hasMore) {
                    currentPage++;
                    loadInsights(false);
                }
            });
        }

        const searchInput = document.querySelector('.ve-search-box input');
        const searchBtn = document.querySelector('.ve-search-box button');

        if (searchBtn && searchInput) {
            if (searchQuery) searchInput.value = searchQuery;

            const handleSearch = () => {
                searchQuery = searchInput.value.trim();
                currentCategory = 'All'; // Reset category on search
                currentTag = ''; // Reset tag on search
                currentPage = 0;

                updateURL();

                // Update UI state
                const catList = document.getElementById('sidebar-categories');
                if (catList) {
                    catList.querySelectorAll('.cat-filter').forEach(l => l.classList.remove('active'));
                    const allBtn = catList.querySelector('[data-category="All"]');
                    if (allBtn) allBtn.classList.add('active');
                }
                const tagContainer = document.getElementById('sidebar-tags');
                if (tagContainer) tagContainer.querySelectorAll('.tag-item').forEach(l => l.classList.remove('active'));

                loadInsights(true);
            };
            searchBtn.addEventListener('click', handleSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSearch();
            });
        }
    }

    /**
     * Update Browser URL without reloading
     */
    function updateURL() {
        const url = new URL(window.location);
        url.search = ''; // Clear all
        if (searchQuery) {
            url.searchParams.set('s', searchQuery);
        } else if (currentTag) {
            url.searchParams.set('tag', currentTag);
        } else if (currentCategory && currentCategory !== 'All') {
            url.searchParams.set('category', currentCategory);
        }
        window.history.pushState({}, '', url);
    }

    /**
     * Fetch and apply Site Content (Banner, Title)
     */
    async function loadSiteContent(key, elementId) {
        try {
            const { data, error } = await supabase.from('site_content').select('value').eq('key', key).maybeSingle();
            if (error) throw error;
            if (data && data.value) {
                const el = document.getElementById(elementId);
                if (el) {
                    if (key.includes('banner')) {
                        const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.value);
                        if (publicData) el.style.backgroundImage = `url('${publicData.publicUrl}?t=${Date.now()}')`;
                    } else {
                        el.innerHTML = data.value;
                    }
                }
            }
        } catch (err) { console.error(`Error loading ${key}:`, err); }
    }

    /**
     * Fetch and render dynamic categories in sidebar
     */
    async function loadCategories() {
        const catList = document.getElementById('sidebar-categories');
        if (!catList) return;

        try {
            // Fixed list of categories to always show
            const defaultCats = ['AI', 'Programming', 'Cybersecurity', 'Tech Reviews'];

            // Get all published posts to calculate counts and tags
            const { data: allPosts, error } = await supabase
                .from('posts')
                .select('category, tags')
                .eq('published', true);

            if (error) throw error;

            const counts = {};
            const tagsSet = new Set();

            // Initialize all default categories with 0
            defaultCats.forEach(cat => counts[cat] = 0);

            // Count actual posts and collect tags
            allPosts.forEach(p => {
                if (p.category) {
                    const cat = p.category.trim();
                    counts[cat] = (counts[cat] || 0) + 1;
                    if (!defaultCats.includes(cat)) defaultCats.push(cat);
                }
                if (p.tags) {
                    p.tags.split(',').forEach(t => {
                        const tag = t.trim();
                        if (tag) tagsSet.add(tag);
                    });
                }
            });

            // Sort lists
            defaultCats.sort();
            const sortedTags = Array.from(tagsSet).sort();

            let html = `<li><a href="#" class="cat-filter ${currentCategory === 'All' && !currentTag ? 'active' : ''}" data-category="All">All <span>${allPosts.length}</span></a></li>`;

            html += defaultCats.map(cat => `
                <li><a href="#" class="cat-filter ${currentCategory === cat ? 'active' : ''}" data-category="${cat}">${cat} <span>${counts[cat] || 0}</span></a></li>
            `).join('');

            catList.innerHTML = html;

            // Popular Tags (Dynamic from Database)
            const tagContainer = document.getElementById('sidebar-tags');
            if (tagContainer) {
                if (sortedTags.length > 0) {
                    tagContainer.innerHTML = sortedTags.map(tag => `
                        <a href="#" class="tag-item ${currentTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</a>
                    `).join('');

                    tagContainer.querySelectorAll('.tag-item').forEach(tagEl => {
                        tagEl.addEventListener('click', (e) => {
                            e.preventDefault();

                            // Reset other filters
                            currentCategory = 'All';
                            currentTag = tagEl.getAttribute('data-tag');

                            updateURL();

                            // Update UI states
                            catList.querySelectorAll('.cat-filter').forEach(l => l.classList.remove('active'));
                            tagContainer.querySelectorAll('.tag-item').forEach(l => l.classList.remove('active'));
                            tagEl.classList.add('active');

                            currentPage = 0;
                            loadInsights(true);
                        });
                    });
                } else {
                    tagContainer.innerHTML = '<p style="font-size: 13px; color: var(--ve-muted);">No tags yet</p>';
                }
            }

            // Add Click Listeners for Sidebar Category List
            catList.querySelectorAll('.cat-filter').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();

                    catList.querySelectorAll('.cat-filter').forEach(l => l.classList.remove('active'));
                    if (tagContainer) tagContainer.querySelectorAll('.tag-item').forEach(l => l.classList.remove('active'));

                    link.classList.add('active');

                    currentCategory = link.getAttribute('data-category');
                    currentTag = ''; // Clear tag filter

                    updateURL();

                    currentPage = 0;
                    loadInsights(true);
                });
            });

        } catch (err) {
            console.error("Error loading sidebar data:", err);
            catList.innerHTML = '<li>Error loading categories</li>';
        }
    }

    /**
     * Fetch and render recent posts in sidebar
     */
    async function loadRecentSidebarPosts() {
        const recentContainer = document.getElementById('sidebar-recent-posts');
        if (!recentContainer) return;

        try {
            const { data: posts, error } = await supabase
                .from('posts')
                .select('*')
                .eq('published', true)
                .order('created_at', { ascending: false })
                .limit(4);

            if (error) throw error;

            recentContainer.innerHTML = posts.map(p => {
                const imgUrl = getImageUrl(p);
                const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const link = p.slug ? `single-post.html?slug=${p.slug}` : `single-post.html?id=${p.id}`;

                return `
                    <div class="ve-recent-post">
                        <div class="ve-rp-img bg-img" style="background-image:url('${imgUrl}');"></div>
                        <div>
                            <a href="${link}">${p.title}</a>
                            <span><i class="fa fa-calendar"></i> ${date}</span>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.error("Error loading recent posts:", err);
            recentContainer.innerHTML = '<p>Error loading posts</p>';
        }
    }

    /**
     * Fetch and render insights grid
     */
    async function loadInsights(reset = false) {
        const container = document.getElementById('posts-container');
        const loader = document.getElementById('posts-loader');
        const loadMoreBtn = document.getElementById('load-more-btn');

        if (!container) return;

        if (reset) {
            container.innerHTML = ''; // Keep loader if needed, but we'll append to it
            container.appendChild(loader);
        }

        loader.style.display = 'block';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';

        try {
            let query = supabase
                .from('posts')
                .select('*', { count: 'exact' })
                .eq('published', true)
                .order('created_at', { ascending: false });

            // Apply Filters
            if (currentCategory !== 'All') {
                query = query.eq('category', currentCategory);
            }

            if (currentTag) {
                query = query.ilike('tags', `%${currentTag}%`);
            }

            if (searchQuery) {
                query = query.ilike('title', `%${searchQuery}%`);
            }

            // Pagination
            const from = currentPage * itemsPerPage;
            const to = from + itemsPerPage - 1;
            query = query.range(from, to);

            const { data: posts, count, error } = await query;

            if (error) throw error;

            loader.style.display = 'none';

            if (posts && posts.length > 0) {
                const postsHtml = posts.map((p, index) => renderPostCard(p, index)).join('');

                if (reset) {
                    container.innerHTML = postsHtml + loader.outerHTML;
                } else {
                    // Find loader and insert before it
                    loader.insertAdjacentHTML('beforebegin', postsHtml);
                }

                // Check if there are more
                hasMore = (from + posts.length) < count;
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = hasMore ? 'inline-block' : 'none';
                }
            } else {
                if (reset) {
                    container.innerHTML = '<div class="col-12 text-center mt-5"><h4>No insights found matching your criteria.</h4></div>' + loader.outerHTML;
                }
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                hasMore = false;
            }

        } catch (err) {
            console.error("Error loading insights:", err);
            loader.style.display = 'none';
            if (reset) {
                container.innerHTML = '<div class="col-12 text-center mt-5"><p>Error loading content. Please try again later.</p></div>';
            }
        }
    }

    function renderPostCard(post, index) {
        const imgUrl = getImageUrl(post);
        const date = new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        const link = post.slug ? `single-post.html?slug=${post.slug}` : `single-post.html?id=${post.id}`;
        const delay = (index % 2 + 1) * 100;

        return `
            <div class="col-12 col-md-6 wow fadeInUp" data-wow-delay="${delay}ms">
                <div class="ve-insight-card">
                    <div class="ve-insight-img bg-img" style="background-image:url('${imgUrl}');"></div>
                    <div class="ve-insight-body">
                        <span class="ve-insight-cat">${post.category || 'Tech'}</span>
                        <h5><a href="${link}">${post.title}</a></h5>
                        <p>${post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : '')}</p>
                        <div class="ve-insight-meta">
                            <span><i class="fa fa-calendar"></i> ${date}</span>
                            <a href="${link}">Read More <i class="fa fa-arrow-right"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Resolve image URL from post data
     * Supports both direct 'image' URL and 'image_key' from Storage
     */
    function getImageUrl(post) {
        // 1. Try image_key (Storage Bucket)
        if (post.image_key) {
            const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(post.image_key);
            if (data && data.publicUrl) return data.publicUrl;
        }

        // 2. Try direct image URL/path
        if (post.image) return post.image;

        // 3. Fallback
        return "img/bg-img/10.jpg";
    }

    // Run init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
