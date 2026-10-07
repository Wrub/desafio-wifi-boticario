import { useState } from 'react';
import type { StoreVisitorsPage } from '@wifi/contracts';
import { DEVICE_LABELS, formatDateTime, formatNumber, formatWeekdayTime } from '../utils/format';

// quantas visitas aparecem antes do "+N"
const VISIT_TIMES_PREVIEW = 3;

interface VisitorsTableProps {
  page: StoreVisitorsPage;
  onPageChange: (page: number) => void;
  loading?: boolean;
  search?: string;
}

export function VisitorsTable({ page, onPageChange, loading, search }: VisitorsTableProps) {
  const totalPages = Math.max(1, Math.ceil(page.total / page.pageSize));

  if (page.total === 0) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-ink-500">
        {search
          ? `Nenhum visitante encontrado para "${search}".`
          : 'Nenhum visitante nesta loja no período.'}
      </p>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 bg-surface">
      <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-canvas text-xs tracking-wide text-ink-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Nome
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                CPF
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                E-mail
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Visitas
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Dias e horários
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Última conexão
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Aparelho
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                MAC
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {page.items.map((visitor) => (
              <tr key={visitor.id}>
                <td className="px-4 py-3 font-medium whitespace-nowrap text-ink-900">
                  {visitor.name}
                </td>
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-ink-600">
                  {visitor.maskedCpf}
                </td>
                <td className="px-4 py-3 text-ink-600">{visitor.email}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatNumber(visitor.visits)}
                </td>
                <td className="px-4 py-3">
                  <VisitTimes times={visitor.visitTimes} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-600">
                  {formatDateTime(visitor.lastConnectedAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-ink-900">{DEVICE_LABELS[visitor.lastDevice.type]}</span>
                  {visitor.lastDevice.os && (
                    <span className="ml-1 text-ink-500">· {visitor.lastDevice.os}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-ink-500">
                  {visitor.lastDevice.macAddress}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Paginação"
        className="flex items-center justify-between gap-2 border-t border-gray-200 px-4 py-3 text-sm"
      >
        <span className="text-ink-500">
          {formatNumber(page.total)} visitantes · página {page.page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page.page <= 1 || loading}
            onClick={() => onPageChange(page.page - 1)}
            className="rounded-md border border-gray-300 px-4 py-1.5 font-medium text-ink-700 hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page.page >= totalPages || loading}
            onClick={() => onPageChange(page.page + 1)}
            className="rounded-md border border-gray-300 px-4 py-1.5 font-medium text-ink-700 hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </nav>
    </div>
  );
}

// lista numerada das visitas (1ª, 2ª...), com a data completa no tooltip
function VisitTimes({ times }: { times: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? times : times.slice(0, VISIT_TIMES_PREVIEW);
  const hidden = times.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ol className="contents">
        {visible.map((iso, index) => (
          <li
            key={iso}
            title={formatDateTime(iso)}
            className="rounded bg-brand-50 px-2 py-0.5 text-xs whitespace-nowrap text-ink-700"
          >
            <span className="text-ink-400">{index + 1}ª</span> {formatWeekdayTime(iso)}
          </li>
        ))}
      </ol>
      {times.length > VISIT_TIMES_PREVIEW && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="rounded px-1.5 py-0.5 text-xs font-medium text-brand-500 hover:underline"
        >
          {expanded ? 'ver menos' : `+${hidden}`}
        </button>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden className="space-y-2 rounded-md border border-gray-200 bg-surface p-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-8 animate-pulse rounded bg-gray-200" />
      ))}
    </div>
  );
}
