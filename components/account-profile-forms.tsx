"use client";

import { useState } from "react";
import { sendPasswordReset, signOut, updateUserProfile } from "@/app/actions/auth";

export function AccountProfileForms({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleProfileSubmit = async (formData: FormData) => {
    setProfileMessage("");
    const result = await updateUserProfile(formData);
    setProfileError(!result.success);
    setProfileMessage(result.message);
  };

  const handlePasswordReset = async () => {
    setIsSendingReset(true);
    setResetMessage("");
    const result = await sendPasswordReset();
    setResetMessage(result.message);
    setIsSendingReset(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="mb-5 text-xl font-bold text-[#111827]">Información personal</h2>
        <form action={handleProfileSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-[#6B7280]">
              Nombre completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              defaultValue={fullName}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[#111827] outline-none transition-all duration-200 focus:scale-[1.005] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-1"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#6B7280]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-[#6B7280] transition-all duration-200 focus:scale-[1.005] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-1"
            />
          </div>

          {profileMessage ? (
            <p className={`text-sm ${profileError ? "text-red-600" : "text-emerald-700"}`} role="status">
              {profileMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="rounded-xl bg-[#111827] px-4 py-2 text-white transition-all duration-200 hover:bg-[#1F2937] active:scale-[0.97]"
          >
            Guardar cambios
          </button>
        </form>
      </section>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-md">
        <h2 className="mb-1 text-lg font-semibold text-[#111827]">Sesión</h2>
        <p className="mb-4 text-sm text-[#6B7280]">Cierra tu sesión en este dispositivo.</p>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-xl bg-red-500 px-5 py-2.5 font-medium text-white shadow-md transition-all duration-200 hover:bg-red-600 hover:shadow-lg"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-xl font-bold text-[#111827]">Seguridad</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Solicita un enlace por email para cambiar tu contraseña.
        </p>
        {resetMessage ? (
          <p className="mt-4 text-sm text-emerald-700" role="status">
            {resetMessage}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handlePasswordReset}
          disabled={isSendingReset}
          className="mt-5 rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#111827] transition-all duration-200 hover:bg-[#F9FAFB] active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
        >
          {isSendingReset ? "Enviando..." : "Enviar email de cambio de contraseña"}
        </button>
      </section>
    </div>
  );
}
