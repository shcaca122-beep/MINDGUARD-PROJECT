import Link from "next/link";

export default function Signup() {
  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-right">
          <h1 className="auth-title">
            Create Account
          </h1>

          <input
            className="input-box"
            placeholder="USER NAME"
          />

          <input
            className="input-box"
            placeholder="EMAIL"
          />

          <input
            type="password"
            className="input-box"
            placeholder="PASSWORD"
          />

          <button className="primary-btn">
            SIGN UP
          </button>
        </div>

        <div className="auth-left">
          <h1>Welcome Back!</h1>

          <p className="auth-desc">
            To keep connected with us please login
            with your personal info
          </p>

          <Link href="/">
            <button className="secondary-btn">
              SIGN IN
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}