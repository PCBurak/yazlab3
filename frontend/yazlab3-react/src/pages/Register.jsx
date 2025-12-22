import { useMemo, useState } from "react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => {
    return (
      name.length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      password.length >= 6 &&
      password === password2
    );
  }, [name, email, password, password2]);

  function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!canSubmit) {
      setError("Bilgileri doğru gir.");
      return;
    }

    setSuccess("Kayıt başarılı (demo)");
  }

  return (
    <div className="login-root">
      <section className="card">
        <h2>Kayıt Ol</h2>

        <form onSubmit={onSubmit} className="form">
          <input
            placeholder="Ad Soyad"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Şifre tekrar"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />

          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          <button disabled={!canSubmit}>Kayıt Ol</button>
        </form>
      </section>
    </div>
  );
}
