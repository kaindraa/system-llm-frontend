/**
 * Chat API Proxy Route
 *
 * This route acts as a proxy to the backend chat API.
 * It handles streaming responses from the backend and forwards them to the frontend.
 *
 * Supports both:
 * 1. @assistant-ui library format: { messages: [...] }
 * 2. Direct call format: { sessionId, message }
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // @assistant-ui library might send messages in different formats
    const { messages, message } = body;

    let userMessage = "";

    if (message) {
      // Direct format: { message: "..." }
      userMessage = message;
    } else if (messages && Array.isArray(messages) && messages.length > 0) {
      // Array format: { messages: [...] }

      // Find the last user message (skip assistant responses)
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];

        // Handle different content formats
        let msgContent = "";

        // First check for parts array (Vercel AI SDK format)
        if (Array.isArray(msg.parts)) {
          const textParts = (msg.parts as any[])
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("");
          msgContent = textParts;
        } else if (typeof msg.content === "string") {
          // Simple string format
          msgContent = msg.content;
        } else if (Array.isArray(msg.content)) {
          // Content is array of parts
          const textParts = (msg.content as any[])
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("");
          msgContent = textParts;
        } else if (typeof msg.content === "object" && msg.content !== null) {
          // Object format
          msgContent = JSON.stringify(msg.content);
        }

        if (msg.role === "user" && msgContent) {
          userMessage = msgContent;
          break;
        }
      }
    } else {
      // Try to extract from any other possible format
      // Check if body itself is a string
      if (typeof body === "string") {
        userMessage = body;
      } else if (body.text) {
        userMessage = body.text;
      } else if (body.input) {
        userMessage = body.input;
      } else if (body.content) {
        userMessage = body.content;
      }

      if (!userMessage) {
        return new Response(
          JSON.stringify({
            error: "Invalid request format - no message found",
            expected: "{ messages: [...] } or { message: '...' }",
            received: body,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (!userMessage) {
      return new Response(
        JSON.stringify({
          error: "No user message found",
          body,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", auth: authHeader }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get backend URL - it already includes /api/v1
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
    const sessionIdHeader = req.headers.get("x-session-id");
    let session = sessionIdHeader;

    // If no session ID in header, create a new session
    if (!session) {
      try {
        // backendUrl already includes /api/v1, so just append /chat/sessions
        const createUrl = `${backendUrl}/chat/sessions`;

        const createSessionResponse = await fetch(createUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            model_id: "gpt-4.1-nano",
            title: "New Chat",
          }),
        });

        if (!createSessionResponse.ok) {
          const error = await createSessionResponse.text();
          throw new Error(`Failed to create session: ${error}`);
        }

        const sessionData = await createSessionResponse.json();
        session = sessionData.id;
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Failed to create chat session",
            details: error instanceof Error ? error.message : String(error),
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Forward request to backend
    const messageUrl = `${backendUrl}/chat/sessions/${session}/messages`;
    const backendResponse = await fetch(messageUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.text();
      return new Response(error, {
        status: backendResponse.status,
        headers: {
          "Content-Type": backendResponse.headers.get("Content-Type") || "text/plain",
        },
      });
    }

    // Create a transform stream to convert backend SSE format to Vercel AI SDK format
    const originalBody = backendResponse.body;
    if (!originalBody) {
      throw new Error("Backend response has no body");
    }

    const reader = originalBody.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const transformStream = new ReadableStream({
      async start(controller) {
        try {
          // First, send a comment with session ID so client can capture it
          controller.enqueue(
            encoder.encode(`: session_id: ${session}\n`)
          );

          let buffer = "";
          let currentEventType = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              // Skip empty lines and comments
              if (!line.trim() || line.startsWith(":")) {
                continue;
              }

              // Parse SSE format
              if (line.startsWith("event:")) {
                currentEventType = line.slice(6).trim();
                continue;
              }

              if (line.startsWith("data:")) {
                const dataStr = line.slice(5).trim();
                if (dataStr) {
                  try {
                    const data = JSON.parse(dataStr);

                    // Skip user_message echo - don't send to frontend
                    if (currentEventType === "user_message") {
                      continue;
                    }

                    // Handle chunk events - these are text pieces from LLM
                    if (currentEventType === "chunk") {
                      const chunk = data.content || "";
                      if (chunk) {
                        const response = {
                          type: "text-delta",
                          textDelta: chunk,
                        };
                        controller.enqueue(
                          encoder.encode(`data: ${JSON.stringify(response)}\n\n`)
                        );
                      }
                    }

                    // Handle done event - final response from assistant
                    if (currentEventType === "done") {
                      // Send finish message to indicate streaming is complete
                      const finishResponse = {
                        type: "finish",
                        finishReason: "stop",
                      };
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(finishResponse)}\n\n`)
                      );
                    }

                    // Handle error event - backend encountered an error
                    if (currentEventType === "error") {
                      const errorResponse = {
                        type: "finish",
                        finishReason: "error",
                      };
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(errorResponse)}\n\n`)
                      );
                    }
                  } catch (e) {
                    // Silently ignore parsing errors
                  }
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    const responseHeaders: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    };

    if (session) {
      responseHeaders["X-Session-Id"] = session;
    }

    return new Response(transformStream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
