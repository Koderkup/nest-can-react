// Framework conventions for nest-can-react Flight navigation.
const HEADER_ACTION_ID = 'x-rsc-action';
export const RSC_PAYLOAD_ACCEPT = 'text/x-component';
export const NCR_NAVIGATION_HEADER = 'x-ncr-navigation';

export type RenderRequest = {
  isRsc: boolean;
  isAction: boolean;
  actionId?: string;
  request: Request;
  url: URL;
};

export function createRscRenderRequest(
  urlString: string,
  action?: { id: string; body: BodyInit },
): Request {
  const url = new URL(urlString, location.origin);
  const headers = new Headers();

  if (action) {
    headers.set(HEADER_ACTION_ID, action.id);
  } else {
    headers.set('Accept', RSC_PAYLOAD_ACCEPT);
  }

  return new Request(url.toString(), {
    method: action ? 'POST' : 'GET',
    headers,
    body: action?.body,
    credentials: 'include',
  });
}

export function parseRenderRequest(request: Request): RenderRequest {
  const url = new URL(request.url);

  if (request.method === 'POST' && request.headers.get(HEADER_ACTION_ID)) {
    return {
      isRsc: true,
      isAction: true,
      actionId: request.headers.get(HEADER_ACTION_ID) ?? undefined,
      request: new Request(url, request),
      url,
    };
  }

  const accept = request.headers.get('Accept') ?? '';
  const wantsHtml =
    accept.includes('text/html') && !accept.includes(RSC_PAYLOAD_ACCEPT);

  if (wantsHtml || request.headers.get(NCR_NAVIGATION_HEADER) === 'html') {
    return {
      isRsc: false,
      isAction: false,
      request,
      url,
    };
  }

  return {
    isRsc: true,
    isAction: false,
    request: new Request(url, request),
    url,
  };
}
