/**
 * Shared OpenAPI components for Ticketing API
 */
export const components = {
  schemas: {
    User: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        email: { type: "string", format: "email" },
        name: { type: "string" },
        avatar_url: { type: "string", nullable: true },
        role: { type: "string", enum: ["USER", "SELLER", "CHECKER", "ADMIN"] },
        email_verified_at: { type: "string", format: "date-time", nullable: true },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" }
      },
      required: ["id", "email", "role", "created_at", "updated_at"]
    },
    Event: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        title: { type: "string" },
        description: { type: "string" },
        status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
        date: { type: "string", format: "date-time" },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" }
      },
      required: ["id", "title", "status", "date", "created_at", "updated_at"]
    },
    Ticket: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        event_id: { type: "string", format: "uuid" },
        user_id: { type: "string", format: "uuid" },
        status: { type: "string", enum: ["ISSUED", "USED", "REVOKED", "REFUNDED"] },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" }
      },
      required: ["id", "event_id", "user_id", "status", "created_at", "updated_at"]
    },
    AuthRequest: {
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", format: "password" }
      },
      required: ["email", "password"]
    },
    AuthResponse: {
      type: "object",
      properties: {
        token: { type: "string" },
        user: { $ref: "#/components/schemas/User" }
      },
      required: ["token", "user"]
    },
    Error: {
      type: "object",
      properties: {
        error: { type: "string" }
      },
      required: ["error"]
    }
  },
  responses: {
    UnauthorizedError: {
      description: "Access token is missing or invalid",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Error" }
        }
      }
    },
    NotFoundError: {
      description: "Resource not found",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Error" }
        }
      }
    },
    ValidationError: {
      description: "Request validation failed",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Error" }
        }
      }
    }
  },
  parameters: {
    LimitParam: {
      name: "limit",
      in: "query",
      description: "Max number of items to return",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 100, default: 20 }
    },
    OffsetParam: {
      name: "offset",
      in: "query",
      description: "Number of items to skip",
      required: false,
      schema: { type: "integer", minimum: 0, default: 0 }
    },
    SearchParam: {
      name: "q",
      in: "query",
      description: "Search term for filtering results",
      required: false,
      schema: { type: "string" }
    },
    IdParam: {
      name: "id",
      in: "path",
      description: "Entity UUID",
      required: true,
      schema: { type: "string", format: "uuid" }
    }
  }
};
