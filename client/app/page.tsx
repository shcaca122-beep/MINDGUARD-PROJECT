import Link from "next/link";

export default function Login() {
  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-left">
          <h1>Hey There!</h1>

          <p className="auth-desc">
            Begin your amazing journey by creating an account with us today
          </p>

          <Link href="/signup">
            <button className="secondary-btn">
              SIGN UP
            </button>
          </Link>
        </div>

        <div className="auth-right">
          <h1 className="auth-title">Sign in</h1>

          <p>of use your email for registration</p>

          <input
            className="input-box"
            placeholder="USER NAME"
          />

          <input
            type="password"
            className="input-box"
            placeholder="PASSWORD"
          />

          <Link href="/dashboard">
            <button className="primary-btn">
              SIGN IN
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}