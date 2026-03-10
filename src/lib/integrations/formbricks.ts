const FORMBRICKS_URL = process.env.FORMBRICKS_URL || "http://localhost:8086"
const FORMBRICKS_API_KEY = process.env.FORMBRICKS_API_KEY || ""

async function fbRequest(endpoint: string, method = "GET", body?: any, timeout = 15000) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (FORMBRICKS_API_KEY) {
    headers["x-api-key"] = FORMBRICKS_API_KEY
  }

  const res = await fetch(`${FORMBRICKS_URL}/api/v1${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`Formbricks ${method} ${endpoint}: ${res.status} - ${errText}`)
  }
  return res.json()
}

export const formbricks = {
  async listSurveys(environmentId: string) {
    return fbRequest(`/management/surveys?environmentId=${environmentId}`)
  },

  async getSurveyResponses(surveyId: string, limit = 50) {
    return fbRequest(`/management/responses?surveyId=${surveyId}&limit=${limit}`)
  },

  async isHealthy(): Promise<boolean> {
    try {
      if (!FORMBRICKS_API_KEY) return false
      const res = await fetch(`${FORMBRICKS_URL}/api/v1/management/me`, {
        headers: { "x-api-key": FORMBRICKS_API_KEY },
        signal: AbortSignal.timeout(2000),
      })
      // 400 "bad_request" still means Formbricks is reachable and the key was processed
      return res.status === 200 || res.status === 400
    } catch {
      return false
    }
  },
}
