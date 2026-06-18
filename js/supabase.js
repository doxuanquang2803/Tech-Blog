const supabaseUrl = "https://csjwyvngqynqjbuwtsdv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzand5dm5ncXlucWpidXd0c2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NTEzMjQsImV4cCI6MjA5NDEyNzMyNH0.21KDagCTN31_ytNhhqSQZ0_mvXzu7QbIEFYgzpgrZDY";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

async function testConnection() {

    const { data, error } = await supabaseClient
        .from("posts")
        .select("*")
        .limit(1);

    if (error) {
        console.log("❌ Kết nối thất bại:", error);
    } else {
        console.log("✅ Kết nối thành công!");
        console.log(data);
    }
}

testConnection();