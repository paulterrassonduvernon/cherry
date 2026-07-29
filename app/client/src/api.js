async function request(path, options) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

export const getEntryTypes = () => request("/entry-types");

export const getSpaces = () => request("/spaces");
export const getSpace = (id) => request(`/spaces/${id}`);
export const createSpace = (name) =>
  request("/spaces", { method: "POST", body: JSON.stringify({ name }) });
export const renameSpace = (id, name) =>
  request(`/spaces/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });

export const getEntries = (spaceId) => request(`/entries?spaceId=${spaceId}`);
export const getEntry = (id) => request(`/entries/${id}`);
export const createEntry = ({ spaceId, type, content, source }) =>
  request("/entries", { method: "POST", body: JSON.stringify({ spaceId, type, content, source }) });
export const updateEntry = (id, patch) =>
  request(`/entries/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
export const deleteEntry = (id) => request(`/entries/${id}`, { method: "DELETE" });

export const getSynthesis = (spaceId) => request(`/spaces/${spaceId}/synthesis`);
export const regenerateSynthesis = (spaceId) =>
  request(`/spaces/${spaceId}/synthesis`, { method: "POST" });

export async function transcribeAudio(blob) {
  const res = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": blob.type || "audio/webm" },
    body: blob,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data.text;
}
