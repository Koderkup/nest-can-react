function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

function statusHref(status: 'all' | 'open' | 'archived', query: string) {
  const params = new URLSearchParams();

  if (status !== 'all') {
    params.set('status', status);
  }

  if (query) {
    params.set('q', query);
  }

  const search = params.toString();
  return search ? `/notes?${search}` : '/notes';
}

export { formatWhen, statusHref };
