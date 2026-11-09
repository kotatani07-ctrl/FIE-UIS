export function initLoginPage() {
  const form = document.getElementById("fie-login-form");
  if (!form) return;

  const password = form.querySelector<HTMLInputElement>("#id_password");
  const toggle = form.querySelector<HTMLButtonElement>("[data-password-toggle]");
  if (!password || !toggle) return;

  const setVisible = (visible: boolean) => {
    password.type = visible ? "text" : "password";
    toggle.setAttribute("aria-label", visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
    toggle.setAttribute("title", visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
    toggle.classList.toggle("is-visible", visible);
  };

  toggle.addEventListener("click", () => {
    setVisible(password.type === "password");
    password.focus({ preventScroll: true });
  });

  setVisible(false);
}
