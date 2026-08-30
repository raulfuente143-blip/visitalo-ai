import { createServerComponentClient } from "@/lib/supabase/server";
import { plans } from "@/lib/stripe/config";
import { createCheckoutSession } from "@/app/actions/checkout";

export default async function BillingPage() {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: currentAgency } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Billing</p>
          <h1 className="mt-2 text-3xl font-bold">Elige tu plan</h1>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {Object.values(plans).map((plan) => (
            <div key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">
                  {plan.name}
                </p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-bold">€{plan.amount / 100}</span>
                  <span className="text-slate-500">/mes</span>
                </div>
              </div>

              <ul className="mb-6 space-y-2 text-sm text-slate-600">
                <li>• {plan.limits.videos} videos</li>
                <li>• {plan.limits.photos} fotos</li>
                <li>• {plan.limits.credits} créditos</li>
              </ul>

              <form action={createCheckoutSession}>
                <input type="hidden" name="plan" value={plan.id} />
                <button
                  type="submit"
                  disabled={!currentAgency?.agency_id}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {currentAgency?.agency_id ? "Pagar con Stripe" : "Completa onboarding"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
