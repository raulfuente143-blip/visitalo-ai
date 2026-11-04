"use client";

import { useState } from "react";
import { sendPasswordReset, updateUserProfile } from "@/app/actions/auth";
import { Card, buttonStyles, inputStyles, labelStyles } from "@/components/panel-ui";

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
    <div className="space-y-5">
      <Card>
        <h2 className="mb-5 text-lg font-semibold text-[#0F172A]">Información personal</h2>
        <form action={handleProfileSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className={labelStyles}>
              Nombre completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              defaultValue={fullName}
              className={inputStyles}
            />
          </div>

          <div>
            <label htmlFor="email" className={labelStyles}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-base text-[#6B7280] outline-none"
            />
          </div>

          {profileMessage ? (
            <p className={`text-sm ${profileError ? "text-red-600" : "text-emerald-700"}`} role="status">
              {profileMessage}
            </p>
          ) : null}

          <button type="submit" className={`${buttonStyles.dark} w-full sm:w-auto`}>
            Guardar cambios
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-[#0F172A]">Seguridad</h2>
        <p className="mt-1 text-sm text-[#6B7280]">Te enviamos un enlace por email para cambiar tu contraseña.</p>
        {resetMessage ? (
          <p className="mt-4 text-sm text-emerald-700" role="status">
            {resetMessage}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handlePasswordReset}
          disabled={isSendingReset}
          className={`${buttonStyles.secondary} mt-4 w-full disabled:cursor-wait disabled:opacity-60 sm:w-auto`}
        >
          {isSendingReset ? "Enviando..." : "Cambiar contraseña"}
        </button>
      </Card>
    </div>
  );
}
