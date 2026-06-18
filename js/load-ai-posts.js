async function loadAIPosts() {

    const { data, error } = await supabaseClient
        .from("posts")
        .select("*")
        .eq("category", "AI")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Lỗi:", error);
        return;
    }

    const container = document.getElementById("ai-posts");

    container.innerHTML = "";

    data.forEach(post => {

        container.innerHTML += `
        <div class="col-md-4">
            <div class="ve-insight-card">

                <div class="ve-insight-img bg-img"
                style="background-image:url('${post.image}')">
                </div>

                <div class="ve-insight-body">

                    <span class="ve-insight-cat">${post.category}</span>

                    <h5>
                        <a href="single-post.html?slug=${post.slug}">
                        ${post.title}
                        </a>
                    </h5>

                    <p>
                    ${post.content.substring(0, 120)}...
                    </p>

                </div>

            </div>
        </div>
        `;
    });

}

loadAIPosts();