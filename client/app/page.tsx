import Link from "next/link";

export default function Login() {
  return (
    <div style={{ 
      fontFamily: "sans-serif", 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      backgroundColor: "#d1f2d9" 
    }}>
      
      <div style={{ 
        display: "flex", 
        width: "900px", 
        minHeight: "550px", 
        backgroundColor: "#fff", 
        boxShadow: "0px 4px 15px rgba(0,0,0,0.1)", 
        overflow: "hidden" 
      }}>

        {/* PANEL KIRI (PUTIH) - HALAMAN UTAMA CREATE ACCOUNT */}
        <div style={{ 
          flex: 1.1, 
          padding: "40px", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          position: "relative" 
        }}>
          
          <div style={{ position: "absolute", top: "30px", left: "30px", display: "flex", alignItems: "center", justifyContent: "center", width: "50px", height: "50px", border: "2px solid #6cb2eb", borderRadius: "50%", color: "#000", fontWeight: "bold", fontSize: "20px" }}>
            <span style={{ position: "absolute", fontSize: "8px", top: "-5px", whiteSpace: "nowrap", color: "#333" }}>Simply Innovative</span>
            Zs
            <span style={{ position: "absolute", fontSize: "8px", bottom: "-5px", whiteSpace: "nowrap", color: "#333" }}>Z-solution</span>
          </div>

          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#000", marginTop: "60px", marginBottom: "30px" }}>
            Create Account
          </h1>
          <p style={{ fontWeight: "bold", color: "#000", fontSize: "14px", marginBottom: "30px" }}>
            of use your email for registration
          </p>

          <div style={{ width: "100%", maxWidth: "350px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", backgroundColor: "#f4f4f4", padding: "12px 20px", borderRadius: "30px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <input type="text" placeholder="USER NAME" style={{ border: "none", backgroundColor: "transparent", outline: "none", marginLeft: "15px", width: "100%", fontWeight: "bold", fontSize: "12px", color: "#000" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", backgroundColor: "#f4f4f4", padding: "12px 20px", borderRadius: "30px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <input type="email" placeholder="EMAIL" style={{ border: "none", backgroundColor: "transparent", outline: "none", marginLeft: "15px", width: "100%", fontWeight: "bold", fontSize: "12px", color: "#000" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", backgroundColor: "#f4f4f4", padding: "12px 20px", borderRadius: "30px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <input type="password" placeholder="PASSWORD" style={{ border: "none", backgroundColor: "transparent", outline: "none", marginLeft: "15px", width: "100%", fontWeight: "bold", fontSize: "12px", color: "#000" }} />
            </div>
          </div>

          {/* Menuju ke Dashboard setelah submit */}
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button style={{ marginTop: "40px", padding: "12px 40px", backgroundColor: "#d6d6d6", color: "#000", fontWeight: "900", fontSize: "14px", border: "none", borderRadius: "30px", cursor: "pointer", width: "180px" }}>
              SIGN UP
            </button>
          </Link>

        </div>

        {/* PANEL KANAN (HIJAU SAGE) - LINK KE SIGNUP */}
        <div style={{ 
          flex: 0.9, 
          backgroundColor: "#84a586", 
          padding: "40px", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          color: "#fff", 
          textAlign: "center" 
        }}>
          <h1 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "30px" }}>Welcome Back!</h1>
          <p style={{ fontSize: "14px", fontWeight: "bold", lineHeight: "1.6", marginBottom: "50px", maxWidth: "250px" }}>
            To keep connected with us please login with your personal info
          </p>

          {/* DIUBAH: Mengarah ke halaman /signup */}
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <button style={{ padding: "12px 40px", backgroundColor: "#769778", color: "#fff", fontWeight: "900", fontSize: "14px", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "30px", cursor: "pointer", width: "180px" }}>
              SIGN IN
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}