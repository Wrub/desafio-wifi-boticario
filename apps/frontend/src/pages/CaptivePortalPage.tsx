import { useId, useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { registerConnectionSchema, type RegisterConnectionRequest } from '@wifi/contracts';
import { usePortalApi } from '../api/api-context';
import { ApiRequestError } from '../api/http';
import { ErrorState } from '../components/ErrorState';
import { MAX_PERIOD, periodToRange } from '../hooks/period';
import { useApiQuery } from '../hooks/use-api-query';
import { storePath } from '../hooks/use-store-route';
import { simulatedDevice } from '../utils/device';
import { DEVICE_LABELS, maskCpfInput, maskPhoneInput } from '../utils/format';

// /portal é o captive portal (simulação); /portal/<loja> já abre numa loja
const PORTAL_PATH = /^\/portal(?:\/([^/]+))?\/?$/;

export function isPortalPath(pathname: string): boolean {
  return PORTAL_PATH.test(pathname);
}

function storeIdFromPortalPath(pathname: string): string | undefined {
  const id = PORTAL_PATH.exec(pathname)?.[1];
  if (!id) return undefined;
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

type Field = 'name' | 'phone' | 'email' | 'cpf' | 'terms';
type FieldErrors = Partial<Record<Field, string>>;

const EMPTY_FORM = { name: '', phone: '', email: '', cpf: '' };

export function CaptivePortalPage() {
  const api = usePortalApi();
  const stores = useApiQuery((signal) => api.listStores(periodToRange(MAX_PERIOD), signal), [api]);
  const [pathStoreId, setPathStoreId] = useState(() =>
    storeIdFromPortalPath(window.location.pathname),
  );
  const store = stores.data?.find((s) => s.id === pathStoreId) ?? stores.data?.[0];

  const [device, setDevice] = useState(() => simulatedDevice());
  const [form, setForm] = useState(EMPTY_FORM);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [connected, setConnected] = useState<{ firstName: string; withCpf: boolean }>();

  function changeStore(storeId: string) {
    window.history.replaceState(null, '', `/portal/${encodeURIComponent(storeId)}`);
    setPathStoreId(storeId);
  }

  function update(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!store) return;
    setSubmitError(undefined);

    const body: RegisterConnectionRequest = {
      storeId: store.id,
      device,
      visitor: {
        name: form.name,
        phone: form.phone,
        email: form.email.trim(),
        // CPF em branco não vai pra API
        cpf: form.cpf.trim() || undefined,
      },
    };

    // mesma validação do backend, vinda do pacote de contratos
    const parsed = registerConnectionSchema.safeParse(body);
    const nextErrors: FieldErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[1] as Field | undefined;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
    }
    if (!acceptedTerms) nextErrors.terms = 'Aceite os termos de uso para continuar.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.registerConnection(body);
      setConnected({
        firstName: form.name.trim().split(/\s+/)[0],
        withCpf: Boolean(body.visitor.cpf),
      });
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : 'Algo deu errado. Tente novamente.';
      // erros do domínio (ex.: dígito do CPF) voltam como mensagem; levo pro campo certo
      if (/cpf/i.test(message)) setErrors({ cpf: message });
      else if (/celular/i.test(message)) setErrors({ phone: message });
      else setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setForm(EMPTY_FORM);
    setAcceptedTerms(false);
    setErrors({});
    setConnected(undefined);
    setDevice(simulatedDevice());
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-sand-200 px-4 py-2 text-center text-xs text-ink-700">
        Simulação do captive portal ·{' '}
        <a href="/" className="font-medium underline transition-colors hover:text-brand-500">
          voltar ao dashboard
        </a>
      </div>

      <header className="bg-ink-900 px-4 pt-8 pb-16 text-center text-white">
        <p className="text-sm text-white/70">Bem-vindo(a) à</p>
        <h1 className="text-2xl font-semibold">{store ? store.name : 'nossa loja'}</h1>
        <p className="mt-1 text-sm text-white/70">Conecte-se ao Wi-Fi grátis</p>
      </header>

      <main className="mx-auto -mt-10 max-w-md px-4 pb-10">
        {stores.error ? (
          <ErrorState message={stores.error} onRetry={stores.retry} />
        ) : !stores.data ? (
          <div aria-hidden className="h-96 animate-pulse rounded-md bg-sand-200" />
        ) : !store ? (
          <p className="rounded-md bg-surface p-6 text-center text-sm text-ink-500 shadow-sm">
            Nenhuma loja cadastrada.
          </p>
        ) : connected ? (
          <section
            aria-live="polite"
            className="space-y-4 rounded-md bg-surface p-6 text-center shadow-sm"
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-2xl text-ink-900">
              ✓
            </div>
            <h2 className="text-lg font-semibold text-ink-900">
              Pronto, {connected.firstName}! Você está conectado(a).
            </h2>
            {connected.withCpf ? (
              <p className="text-sm text-ink-600">
                Seu CPF foi vinculado ao clube de vantagens: suas compras de hoje já acumulam
                pontos.
              </p>
            ) : (
              <p className="text-sm text-ink-600">
                Quer acumular pontos e receber ofertas exclusivas? Na próxima visita, informe seu
                CPF.
              </p>
            )}
            <div className="space-y-2 border-t border-sand-100 pt-4 text-xs text-ink-500">
              <p>Simulação: o acesso aparece no dashboard em instantes.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <a
                  href={storePath(store.id)}
                  className="rounded-md border border-sand-300 px-3 py-1.5 font-medium text-ink-700 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                >
                  Ver no dashboard
                </a>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md border border-sand-300 px-3 py-1.5 font-medium text-ink-700 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                >
                  Simular outra conexão
                </button>
              </div>
            </div>
          </section>
        ) : (
          <form
            noValidate
            onSubmit={submit}
            aria-label="Conectar ao Wi-Fi"
            className="space-y-5 rounded-md bg-surface p-6 shadow-sm"
          >
            <TextField
              label="Nome"
              autoComplete="name"
              value={form.name}
              onChange={(value) => update('name', value)}
              error={errors.name}
            />
            <TextField
              label="Celular"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(41) 99999-8888"
              hint="É por ele que reconhecemos você nas próximas visitas."
              value={form.phone}
              onChange={(value) => update('phone', maskPhoneInput(value))}
              error={errors.phone}
            />
            <TextField
              label="E-mail"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(value) => update('email', value)}
              error={errors.email}
            />

            <fieldset className="space-y-3 rounded-md border border-sand-300 bg-sand-50 p-4">
              <legend className="px-1 text-sm font-semibold text-ink-900">
                Clube de vantagens <span className="font-normal text-ink-500">(opcional)</span>
              </legend>
              <p className="text-sm text-ink-600">
                Informe seu CPF para acumular pontos nas compras e receber promoções exclusivas
                desta loja. Se preferir, deixe em branco: o Wi-Fi funciona do mesmo jeito.
              </p>
              <TextField
                label="CPF"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={(value) => update('cpf', maskCpfInput(value))}
                error={errors.cpf}
              />
            </fieldset>

            <div>
              <label className="flex items-start gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => {
                    setAcceptedTerms(event.target.checked);
                    setErrors((current) => ({ ...current, terms: undefined }));
                  }}
                  aria-invalid={Boolean(errors.terms)}
                  className="mt-0.5 size-4 accent-ink-900"
                />
                <span>
                  Li e aceito os termos de uso do Wi-Fi. Meus dados são tratados conforme a LGPD.
                </span>
              </label>
              {errors.terms && <p className="mt-1 text-xs text-red-700">{errors.terms}</p>}
            </div>

            {submitError && (
              <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-ink-900 px-4 py-3 font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 enabled:hover:bg-ink-700 disabled:opacity-60"
            >
              {submitting ? 'Conectando…' : 'Conectar'}
            </button>
          </form>
        )}

        {stores.data && stores.data.length > 0 && (
          <div className="mt-6 space-y-2 rounded-md border border-dashed border-sand-300 p-4 text-xs text-ink-500">
            <label className="flex items-center justify-between gap-3">
              <span>Loja (simulação)</span>
              <select
                value={store?.id}
                onChange={(event) => changeStore(event.target.value)}
                className="rounded-md border border-sand-300 bg-surface px-2 py-1 text-ink-900"
              >
                {stores.data.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <p>
              Aparelho enviado pelo roteador: {DEVICE_LABELS[device.type]}
              {device.os && ` · ${device.os}`} · MAC {device.macAddress}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
}

function TextField({ label, value, onChange, hint, error, ...inputProps }: TextFieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-900">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`mt-1 w-full rounded-md border bg-surface px-3 py-2 text-ink-900 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-100 focus:outline-none ${
          error ? 'border-red-500' : 'border-sand-300 focus:border-brand-500'
        }`}
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-700">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-ink-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
