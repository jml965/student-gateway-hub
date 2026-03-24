const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
export const API_URL = `${BASE}/api`;

function getToken(): string | null {
  return localStorage.getItem("baansy_token");
}

export function setToken(token: string) {
  localStorage.setItem("baansy_token", token);
}

export function clearToken() {
  localStorage.removeItem("baansy_token");
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

export function streamChat(sessionId: number, content: string, onChunk: (text: string) => void, onDone: () => void) {
  const token = getToken();
  return fetch(`${API_URL}/chat/sessions/${sessionId}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  }).then(async (res) => {
    if (!res.body) throw new Error("No stream");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) onChunk(parsed.content);
          if (parsed.done) onDone();
        } catch {
          // skip
        }
      }
    }
    onDone();
  });
}
