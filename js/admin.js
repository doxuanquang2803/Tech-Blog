// =============================================
// Admin Dashboard – TechWorld CMS
// =============================================

const MY_URL = "https://csjwyvngqynqjbuwtsdv.supabase.co".trim();
const MY_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzand5dm5ncXlucWpidXd0c2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NTEzMjQsImV4cCI6MjA5NDEyNzMyNH0.21KDagCTN31_ytNhhqSQZ0_mvXzu7QbIEFYgzpgrZDY".trim();
const STORAGE_BUCKET = "blog-images";

let supabase = null;
let quillEditor = null;

// Khởi tạo an toàn
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(MY_URL, MY_KEY);
        console.log("✅ Admin Supabase Ready");
    }
} catch (e) { console.error(e); }

document.addEventListener("DOMContentLoaded", function() {
    initQuill();
    bindPostEvents();
    if (supabase) {
        loadDashboard();
        loadPosts();
    }
});

// Hàm kiểm tra kết nối (Từ nút trên Dashboard)
window.testSupabaseConnection = async function() {
    alert("Đang kiểm tra kết nối...");
    try {
        const { error } = await supabase.from("posts").select("id").limit(1);
        if (error) alert("❌ LỖI: " + error.message);
        else alert("✅ KẾT NỐI THÀNH CÔNG! Bạn đã có thể lưu bài.");
    } catch (err) { alert("Lỗi: " + err.message); }
};

window.savePost = function() { performSave(); };
window.editPost = function(id) { editPost(id); };

async function performSave() {
    const title = document.getElementById("post-title").value.trim();
    if (!title) { alert("Vui lòng nhập tiêu đề bài viết!"); return; }

    alert("Đang xử lý lưu bài viết...");

    const postData = {
        title,
        category: document.getElementById("post-category").value,
        slug: document.getElementById("post-slug").value || (title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()),
        excerpt: document.getElementById("post-excerpt").value,
        content: quillEditor ? quillEditor.root.innerHTML : "",
        published: document.getElementById("post-published").checked
    };

    const id = document.getElementById("post-id").value;
    
    try {
        let res;
        if (id) {
            res = await supabase.from("posts").update(postData).eq("id", id);
        } else {
            res = await supabase.from("posts").insert([postData]);
        }

        if (res.error) {
            alert("LỖI KHI LƯU: " + res.error.message);
        } else {
            alert("CHÚC MỪNG! Bài viết đã được lưu thành công.");
            window.location.reload();
        }
    } catch (err) {
        alert("Lỗi hệ thống: " + err.message);
    }
}

function bindPostEvents() {
    const b1 = document.getElementById("btn-new-post");
    if (b1) b1.onclick = () => openPostEditor();
    const b2 = document.getElementById("btn-back-posts");
    if (b2) b2.onclick = () => {
        document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
        document.getElementById("posts").classList.add("active");
        loadPosts();
    };
}

async function loadDashboard() {
    const { count } = await supabase.from("posts").select("*", { count: "exact", head: true });
    if (document.getElementById("stat-total-posts")) document.getElementById("stat-total-posts").textContent = count || 0;
}

async function loadPosts() {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (data) {
        const tbody = document.getElementById("posts-table-body");
        if (tbody) {
            tbody.innerHTML = data.map(p => `
                <tr>
                    <td>${p.id}</td>
                    <td><strong>${p.title}</strong></td>
                    <td>${p.category}</td>
                    <td>${p.published ? "Live" : "Draft"}</td>
                    <td><button class="btn btn-sm btn-primary" onclick="window.editPost(${p.id})">Edit</button></td>
                </tr>
            `).join("");
        }
    }
}

function openPostEditor(post = null) {
    document.getElementById("post-form").reset();
    document.getElementById("post-id").value = "";
    if (post) {
        document.getElementById("post-id").value = post.id;
        document.getElementById("post-title").value = post.title;
        document.getElementById("post-category").value = post.category;
        document.getElementById("post-slug").value = post.slug;
        document.getElementById("post-excerpt").value = post.excerpt;
        document.getElementById("post-published").checked = post.published;
        if (quillEditor) quillEditor.root.innerHTML = post.content || "";
    } else {
        if (quillEditor) quillEditor.root.innerHTML = "";
    }
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.getElementById("post-editor").classList.add("active");
}

async function editPost(id) {
    const { data } = await supabase.from("posts").select("*").eq("id", id).single();
    if (data) openPostEditor(data);
}

function initQuill() {
    const el = document.getElementById("quill-editor");
    if (el) quillEditor = new Quill("#quill-editor", { theme: "snow" });
}
