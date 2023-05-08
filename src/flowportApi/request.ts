export class HttpRequestError extends Error {
  readonly httpStatus: number
  readonly headers: Record<string, string>
  readonly responseText: string
  readonly url: string
  readonly method: string

  constructor(
    msg: string,
    httpStatus: number,
    headers: Record<string, string>,
    responseText: string,
    url: string,
    method: string,
  ) {
    super(msg)
    this.httpStatus = httpStatus
    this.headers = headers
    this.responseText = responseText
    this.url = url
    this.method = method
  }
}

type RequestParams = {
  url: string
  method?: string
  body?: string | null
  headers?: Record<string, string>
  parseResponse?: boolean
  timeout?: number
}

export async function request<T = unknown>({
  url,
  method = 'GET',
  body = null,
  headers = {},
  parseResponse = true,
  timeout,
}: RequestParams): Promise<T> {
  const requestParams = {
    method,
    headers,
    body,
  }

  const controller = new AbortController()
  const timeoutId = timeout
    ? setTimeout(() => controller.abort(), timeout)
    : null

  const response = await fetch(url, {
    ...requestParams,
    signal: timeout != null ? controller.signal : undefined,
  }).catch((e) => {
    // http status not present
    throw new Error(
      `${method} ${url} has failed with the following error: ${e}`,
    )
  })

  timeoutId != null && clearTimeout(timeoutId)

  if (!response) {
    // http status not present
    throw new Error(`No response from ${method} ${url}`)
  }

  const responseText = await response.text()

  if (response.status >= 300) {
    throw new HttpRequestError(
      `${method} ${url} returned error: ${response.status} on payload: ${requestParams.body} with response: ${responseText}`,
      response.status,
      requestParams.headers,
      responseText,
      url,
      method,
    )
  }

  if (!parseResponse) {
    return responseText as unknown as T
  }

  try {
    return JSON.parse(responseText) as T
  } catch (e) {
    throw new Error(
      `Getting body of response from ${url} has failed with the following error: ${e}`,
    )
  }
}
