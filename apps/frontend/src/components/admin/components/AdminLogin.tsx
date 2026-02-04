import React from "react";
import { InputField } from "./InputField";

export function AdminLogin({
  error,
  loading,
  onLogin
}: {
  error: string | null;
  loading: boolean;
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="card mx-auto max-w-lg p-8">
      <h2 className="text-2xl font-semibold">Admin</h2>
      <p className="mt-2 text-sm text-slate-500">Ingresa con tu usuario admin.</p>
      {error && <p className="mt-4 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <form className="mt-6 space-y-4" onSubmit={onLogin}>
        <InputField name="email" label="Email" type="email" />
        <InputField name="password" label="Password" type="password" />
        <button
          type="submit"
          className="w-full rounded-xl bg-primary-600 px-4 py-2 text-white"
          disabled={loading}
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
