const aiError = (message, statusCode = 502) =>
  Object.assign(new Error(message), { statusCode });

const parseJson = (content) => {
  const cleaned = String(content || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw aiError("AI service returned an invalid response");
  }
};

const requestAiJson = async (prompt) => {
  if (!process.env.AI_API_KEY) {
    throw aiError(
      "AI service is not configured. Please add AI_API_KEY to the backend environment.",
      503
    );
  }

  const model = process.env.AI_MODEL || "gemini-2.5-flash-lite";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  let response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.AI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a careful financial coach. Return only valid JSON. Never invent figures; use only provided numbers.\n\n${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      }
    );
  } catch (error) {
    console.error("Gemini request failed:", error.name);
    throw aiError("AI service is currently unavailable. Please try again later.", 503);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    console.error("Gemini rejected the request with status:", response.status);

    if (response.status === 401 || response.status === 403) {
      throw aiError(
        "AI service authentication failed. Verify the backend AI API key and Google AI Studio account access.",
        503
      );
    }

    if (response.status === 404) {
      throw aiError(
        "The configured Gemini model is unavailable. Verify AI_MODEL in the backend environment.",
        503
      );
    }

    if (response.status === 429) {
      throw aiError("AI service is busy. Please try again shortly.", 429);
    }

    throw aiError("AI service is currently unavailable. Please try again later.", 503);
  }

  const body = await response.json();
  return parseJson(
    body.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("")
  );
};

const validTextList = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim());

export const generateFinancialInsights = async (financialData) => {
  const result = await requestAiJson(
    `Create concise, practical insights from this financial data. Do not mention unavailable comparisons (null). Use INR notation in prose. Return exactly {"summary":"string","insights":["string"],"suggestions":["string"]}. Financial data: ${JSON.stringify(financialData)}`
  );

  if (
    typeof result.summary !== "string" ||
    !validTextList(result.insights) ||
    !validTextList(result.suggestions)
  ) {
    throw aiError("AI service returned an incomplete response");
  }

  return {
    summary: result.summary.trim(),
    insights: result.insights.map((item) => item.trim()),
    suggestions: result.suggestions.map((item) => item.trim())
  };
};

export const generateBudgetRecommendation = async (budgetData) => {
  const result = await requestAiJson(
    `Recommend a realistic monthly budget based only on this data. Include each observed spending category and a Savings category. Keep totalRecommendedBudget plus recommendedSavings equal to monthlyIncome. Return exactly {"monthlyIncome":number,"categories":[{"category":"string","recommendedBudget":number}],"totalRecommendedBudget":number,"recommendedSavings":number}. Budget data: ${JSON.stringify(budgetData)}`
  );

  if (
    !Array.isArray(result.categories) ||
    !result.categories.length ||
    !result.categories.every(
      (item) => typeof item.category === "string" && Number.isFinite(item.recommendedBudget)
    ) ||
    !Number.isFinite(result.totalRecommendedBudget) ||
    !Number.isFinite(result.recommendedSavings)
  ) {
    throw aiError("AI service returned an incomplete budget recommendation");
  }

  const averages = budgetData.categoryMonthlyAverages;
  const seen = new Set();
  const categories = result.categories
    .filter((item) => item.category === "Savings" || Object.hasOwn(averages, item.category))
    .filter((item) => !seen.has(item.category) && seen.add(item.category))
    .map((item) => {
      const currentAverage = averages[item.category] || 0;
      const recommendedBudget = Math.max(0, Math.round(item.recommendedBudget));

      return {
        category: item.category,
        currentAverage,
        recommendedBudget,
        potentialSaving: Math.max(0, Math.round(currentAverage - recommendedBudget))
      };
    });

  if (!categories.length) {
    throw aiError("AI service returned an invalid budget recommendation");
  }

  return {
    monthlyIncome: budgetData.monthlyIncome,
    categories,
    totalRecommendedBudget: Math.max(0, Math.round(result.totalRecommendedBudget)),
    recommendedSavings: Math.max(0, Math.round(result.recommendedSavings))
  };
};
