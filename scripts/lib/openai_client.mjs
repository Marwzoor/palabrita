import assert from 'node:assert';

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
const API_KEY = process.env.OPENAI_API_KEY;
const API_URL = process.env.OPENAI_API_URL ?? 'https://api.openai.com/v1/responses';

if (!API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required to call the OpenAI API.');
}

export async function requestJsonResponse({ messages, schema, temperature = 0.2, maxOutputTokens = 400 }) {
  assert(Array.isArray(messages) && messages.length > 0, 'messages array is required');
  assert(schema && typeof schema === 'object', 'schema definition is required');

  const schemaName = typeof schema.name === 'string' && schema.name.trim().length > 0
    ? schema.name.trim()
    : null;
  assert(schemaName, 'schema.name must be a non-empty string');

  const schemaDefinition = schema.schema;
  assert(schemaDefinition && typeof schemaDefinition === 'object', 'schema.schema object is required');

  const normalizedSchema = { ...schemaDefinition };
  if (!Object.prototype.hasOwnProperty.call(normalizedSchema, 'additionalProperties')) {
    normalizedSchema.additionalProperties = false;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input: messages,
      temperature,
      max_output_tokens: maxOutputTokens,
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          json_schema: {
            strict: true,
            schema: normalizedSchema,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await safeReadText(response);
    throw new Error(`OpenAI API request failed with status ${response.status}: ${errorText}`);
  }

  const payload = await response.json();
  const text = extractTextFromResponse(payload);

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response as JSON: ${error.message}\nRaw response: ${text}`);
  }
}

async function safeReadText(response) {
  try {
    return await response.text();
  } catch (error) {
    return `<failed to read body: ${error.message}>`;
  }
}

function extractTextFromResponse(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const text = payload?.output?.flatMap(item => item?.content ?? [])
    .map(content => (typeof content?.text === 'string' ? content.text : null))
    .find(Boolean);

  if (text) {
    return text.trim();
  }

  throw new Error('Unexpected OpenAI response payload format.');
}
