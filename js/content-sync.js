// =============================================
// TechWorld Content Sync (Advanced Pagination & Placeholder Logic)
// =============================================

(function () {
    console.log("VaultEdge Content Sync: Loading library...");
    const SURL = "https://csjwyvngqynqjbuwtsdv.supabase.co".trim();
    const SKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzand5dm5ncXlucWpidXd0c2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NTEzMjQsImV4cCI6MjA5NDEyNzMyNH0.21KDagCTN31_ytNhhqSQZ0_mvXzu7QbIEFYgzpgrZDY".trim();
    const STORAGE_BUCKET = "blog-images";
    const POSTS_PER_PAGE = 6;
    let currentPage = 1;

    console.log("VaultEdge Content Sync: Initializing Supabase client...");
    const supabase = window.supabase.createClient(SURL, SKEY);

    // ============ LOAD POSTS (Category Sync + Pagination) ============
    async function syncPosts(page = 1) {
        console.log(`VaultEdge Content Sync: Syncing posts for page ${page}...`);
        const container = document.getElementById('posts-container');
        if (!container || !container.hasAttribute('data-category')) return;

        const filterCategory = container.getAttribute('data-category');
        const start = (page - 1) * POSTS_PER_PAGE;
        const end = start + POSTS_PER_PAGE - 1;

        try {
            // 1. Get Total Count
            let countQuery = supabase.from('posts').select('*', { count: 'exact', head: true }).eq('published', true);
            if (filterCategory && filterCategory !== "All") countQuery = countQuery.eq('category', filterCategory);
            const { count: totalCount } = await countQuery;

            // 2. Fetch Data for Current Page
            let query = supabase.from('posts').select('*').eq('published', true).order('created_at', { ascending: false }).range(start, end);
            if (filterCategory && filterCategory !== "All") query = query.eq('category', filterCategory);
            const { data, error } = await query;
            if (error) throw error;

            // 3. Render Posts
            renderPosts(data, totalCount, page);
        } catch (err) {
            console.error("Sync Error:", err.message);
        }
    }

    function renderPosts(data, totalCount, page) {
        const container = document.getElementById('posts-container');
        const sampleCards = document.querySelectorAll('.sample-card');
        
        // Luôn ẩn sample cards trước
        sampleCards.forEach(c => c.style.display = 'none');

        // Xóa các bài dynamic cũ (nếu có)
        const existingDynamic = container.querySelectorAll('.dynamic-post');
        existingDynamic.forEach(el => el.remove());

        if (data && data.length > 0) {
            const postsHtml = data.map((post, index) => {
                let imgUrl = "img/bg-img/10.jpg";
                if (post.image_key) {
                    const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(post.image_key);
                    if (publicData) imgUrl = publicData.publicUrl;
                }
                const date = new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                const link = post.slug ? `single-post.html?slug=${post.slug}` : `single-post.html?id=${post.id}`;

                return `
                    <div class="col-12 col-md-4 wow fadeInUp dynamic-post" data-wow-delay="${(index + 1) * 100}ms">
                        <div class="ve-insight-card">
                            <div class="ve-insight-img bg-img" style="background-image:url('${imgUrl}');"></div>
                            <div class="ve-insight-body">
                                <span class="ve-insight-cat">${post.category || 'Technology'}</span>
                                <h5><a href="${link}">${post.title}</a></h5>
                                <p>${post.excerpt || ''}</p>
                                <div class="ve-insight-meta">
                                    <span><i class="fa fa-calendar"></i> ${date}</span>
                                    <a href="${link}">Read More <i class="fa fa-arrow-right"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.insertAdjacentHTML('afterbegin', postsHtml);

            // 4. Placeholder Logic: Nếu page 1 và ít hơn 6 bài, hiện thêm sample cards
            if (page === 1 && data.length < POSTS_PER_PAGE) {
                const needed = POSTS_PER_PAGE - data.length;
                for (let i = 0; i < needed && i < sampleCards.length; i++) {
                    sampleCards[i].style.display = 'block';
                }
            }
        } else {
            // Nếu không có bài nào từ DB, hiện toàn bộ 6 bài mẫu
            if (page === 1) {
                sampleCards.forEach(c => c.style.display = 'block');
            }
        }

        // 5. Render Pagination
        renderPagination(totalCount, page);
    }

    function renderPagination(totalCount, page) {
        const pagContainer = document.getElementById('posts-pagination');
        if (!pagContainer) return;

        const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
        if (totalPages <= 1) {
            pagContainer.innerHTML = '';
            return;
        }

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<a href="javascript:void(0)" class="${i === page ? 'active' : ''}" onclick="window.changePage(${i})">${i}</a>`;
        }
        pagContainer.innerHTML = html;
    }

    window.changePage = (page) => {
        currentPage = page;
        syncPosts(page);
        // Scroll to top of section
        const section = document.querySelector('.ve-insights-section') || document.querySelector('.ve-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    };

    // ============ LOAD SITE CONTENT ============
    async function loadSiteContent(key, elementId) {
        try {
            const { data, error } = await supabase.from('site_content').select('value').eq('key', key).maybeSingle();
            if (error) throw error;
            
            if (data && data.value) {
                const el = document.getElementById(elementId);
                if (el) {
                    // Handle Images / Banners / Avatars
                    if (key.includes('img') || key.includes('banner') || key.includes('avatar')) {
                        let imageUrl = data.value;
                        const isLocalOrExternal = imageUrl.startsWith('img/') || imageUrl.startsWith('http');
                        if (!isLocalOrExternal) {
                            const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.value);
                            if (publicData) {
                                imageUrl = publicData.publicUrl;
                            }
                        }
                        const cacheBuster = `?t=${Date.now()}`;
                        imageUrl += cacheBuster;
                        if (el.tagName === 'IMG') el.src = imageUrl;
                        else el.style.backgroundImage = `url('${imageUrl}')`;
                    } 
                    // Handle Links
                    else if (el.tagName === 'A') {
                        el.innerHTML = data.value;
                        if (key === 'contact_phone') el.href = 'tel:' + data.value.replace(/\s/g, '');
                        if (key === 'contact_email') el.href = 'mailto:' + data.value;
                    } 
                    // Handle Text (Allow HTML for highlights)
                    else el.innerHTML = data.value;
                }
            }
        } catch (err) {
            console.error(`Error loading content for ${key}:`, err.message);
        }
    }

    async function syncSiteContent() {
        console.log("VaultEdge Content Sync: Starting site content sync...");
        // Load Global Elements (for Index)
        await loadSiteContent('hero_badge', 'hero-badge');
        await loadSiteContent('hero_title', 'hero-title');
        await loadSiteContent('hero_desc', 'hero-desc');
        await loadSiteContent('hero_img_main', 'hero-img-main');
        await loadSiteContent('hero_img_accent', 'hero-img-accent');
        await loadSiteContent('whyus_img_main', 'whyus-img-main');
        await loadSiteContent('cta_banner_img', 'cta-banner-img');
        await loadSiteContent('testi_avatar_1', 'testi-avatar-1');
        await loadSiteContent('testi_avatar_2', 'testi-avatar-2');
        await loadSiteContent('testi_avatar_3', 'testi-avatar-3');
        
        // Load Category-specific Elements (Banner & Title)
        const container = document.getElementById('posts-container');
        if (container) {
            const cat = container.getAttribute('data-category');
            if (cat) {
                const catSlug = cat.toLowerCase().replace(/\s/g, '_');
                await loadSiteContent(`page_title_${catSlug}`, 'page-hero-title');
                await loadSiteContent(`page_banner_${catSlug}`, 'page-hero-banner');
            }
        }

        // Load About Page Elements
        if (document.getElementById('about-hero-banner')) {
            await loadSiteContent('about_hero_banner', 'about-hero-banner');
            await loadSiteContent('about_hero_title', 'about-hero-title');
            await loadSiteContent('about_img_1', 'about-img-1');
            await loadSiteContent('about_img_2', 'about-img-2');
            await loadSiteContent('about_ribbon_val', 'about-ribbon-val');
            await loadSiteContent('about_ribbon_txt', 'about-ribbon-txt');
            await loadSiteContent('about_title', 'about-title');
            await loadSiteContent('about_lead', 'about-lead');
            await loadSiteContent('team_img_1', 'team-img-1');
            await loadSiteContent('team_name_1', 'team-name-1');
            await loadSiteContent('team_role_1', 'team-role-1');
            await loadSiteContent('team_img_2', 'team-img-2');
            await loadSiteContent('team_name_2', 'team-name-2');
            await loadSiteContent('team_role_2', 'team-role-2');
            await loadSiteContent('team_img_3', 'team-img-3');
            await loadSiteContent('team_name_3', 'team-name-3');
            await loadSiteContent('team_role_3', 'team-role-3');
            await loadSiteContent('team_img_4', 'team-img-4');
            await loadSiteContent('team_name_4', 'team-name-4');
            await loadSiteContent('team_role_4', 'team-role-4');
        }

        // Load Services Page Elements
        if (document.getElementById('services-hero-banner')) {
            await loadSiteContent('services_hero_banner', 'services-hero-banner');
            await loadSiteContent('services_hero_title', 'services-hero-title');
            await loadSiteContent('services_tag', 'services-tag');
            await loadSiteContent('services_title', 'services-title');
            await loadSiteContent('services_desc', 'services-desc');
            for (let i = 1; i <= 6; i++) {
                await loadSiteContent(`service_name_${i}`, `service-name-${i}`);
                await loadSiteContent(`service_desc_${i}`, `service-desc-${i}`);
            }
            await loadSiteContent('process_tag', 'process-tag');
            await loadSiteContent('process_title', 'process-title');
            for (let i = 1; i <= 4; i++) {
                await loadSiteContent(`process_step_title_${i}`, `process-step-title-${i}`);
                await loadSiteContent(`process_step_desc_${i}`, `process-step-desc-${i}`);
            }
            await loadSiteContent('faq_tag', 'faq-tag');
            await loadSiteContent('faq_title', 'faq-title');
            await loadSiteContent('faq_desc', 'faq-desc');
            for (let i = 1; i <= 4; i++) {
                await loadSiteContent(`faq_q_${i}`, `faq-q-${i}`);
                await loadSiteContent(`faq_a_${i}`, `faq-a-${i}`);
            }
        }
        
        // Load Contact Page Elements
        if (document.getElementById('contact-hero-banner')) {
            await loadSiteContent('contact_hero_tag', 'contact-hero-tag');
            await loadSiteContent('contact_hero_banner', 'contact-hero-banner');
            await loadSiteContent('contact_hero_title', 'contact-hero-title');
            for (let i = 1; i <= 5; i++) {
                await loadSiteContent(`contact_why_${i}`, `contact-why-${i}`);
            }
            await loadSiteContent('contact_hours_wk', 'contact-hours-wk');
            await loadSiteContent('contact_hours_sat', 'contact-hours-sat');
            await loadSiteContent('contact_hours_sun', 'contact-hours-sun');
        }
        
        const contactPairs = [
            { key: 'contact_phone', ids: ['contact-phone', 'contact-phone-footer'] },
            { key: 'contact_email', ids: ['contact-email', 'contact-email-footer'] },
            { key: 'contact_address', ids: ['contact-address', 'contact-address-footer'] },
            { key: 'contact_hours_wk', ids: ['contact-hours-wk-footer'] }
        ];
        for (const pair of contactPairs) {
            for (const id of pair.ids) await loadSiteContent(pair.key, id);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        syncPosts(1);
        syncSiteContent();
    });
})();
