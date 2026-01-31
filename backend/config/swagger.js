const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Campus Analytics API',
      version: '1.0.0',
      description: `
        RESTful API for Campus Analytics platform.

        ## Features
        - **Authentication**: JWT-based authentication with Google OAuth 2.0 support
        - **Metrics CRUD**: Full CRUD operations for campus analytics metrics
        - **Weather Integration**: 3rd party weather API integration (Open-Meteo)
        - **Rate Limiting**: Protection against API abuse
        - **Multi-tenancy**: User-based data isolation (BOLA prevention)

        ## Authentication
        All protected endpoints require a Bearer token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`

        Obtain a token by:
        1. Registering via POST /register
        2. Logging in via POST /login
        3. Using Google OAuth via GET /auth/google
      `,
      contact: {
        name: 'Jomar Thomas Almonte',
        email: 'jzt5803@psu.edu',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Metrics',
        description: 'Campus analytics metrics CRUD operations',
      },
      {
        name: 'Weather',
        description: '3rd party weather API integration',
      },
      {
        name: 'Health',
        description: 'Health check and system status',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'johndoe' },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Metric: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: { type: 'string', example: 'Fall 2024 Enrollment' },
            category: {
              type: 'string',
              enum: [
                'enrollment',
                'facilities',
                'academic',
                'financial',
                'other',
              ],
              example: 'enrollment',
            },
            value: { type: 'number', example: 45000 },
            unit: { type: 'string', example: 'students' },
            description: {
              type: 'string',
              example: 'Total student enrollment for Fall 2024',
            },
            metadata: {
              type: 'object',
              example: { campus: 'Main', semester: 'Fall 2024' },
            },
            recordedAt: { type: 'string', format: 'date-time' },
            userId: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        MetricInput: {
          type: 'object',
          required: ['name', 'category', 'value'],
          properties: {
            name: { type: 'string', maxLength: 255 },
            category: {
              type: 'string',
              enum: [
                'enrollment',
                'facilities',
                'academic',
                'financial',
                'other',
              ],
            },
            value: { type: 'number' },
            unit: { type: 'string', maxLength: 50 },
            description: { type: 'string', maxLength: 1000 },
            metadata: { type: 'object' },
            recordedAt: { type: 'string', format: 'date-time' },
          },
        },
        WeatherData: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            latitude: { type: 'number', example: 40.7983 },
            longitude: { type: 'number', example: -77.8599 },
            temperature: { type: 'number', example: 22.5 },
            humidity: { type: 'number', example: 65 },
            windSpeed: { type: 'number', example: 12.3 },
            weatherCode: { type: 'integer', example: 2 },
            description: { type: 'string', example: 'Partly cloudy' },
            fetchedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 100 },
            limit: { type: 'integer', example: 20 },
            offset: { type: 'integer', example: 0 },
            hasMore: { type: 'boolean', example: true },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid authentication token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Unauthorized',
                message: 'Access token is required',
              },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Forbidden',
                message: 'You do not have permission to access this resource',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Not found',
                message: 'The requested resource was not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Validation failed',
                details: [{ field: 'name', message: 'Name is required' }],
              },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Too many requests',
                message:
                  'You have exceeded the rate limit. Please try again later.',
              },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check endpoint',
          description: 'Returns the health status of the API',
          responses: {
            200: {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          description: 'Create a new user account with username and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'password'],
                  properties: {
                    username: { type: 'string', minLength: 3, maxLength: 50 },
                    password: { type: 'string', minLength: 6 },
                  },
                },
                example: {
                  username: 'johndoe',
                  password: 'securepassword123',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  example: {
                    message: 'User registered',
                    userId: 1,
                  },
                },
              },
            },
            400: { $ref: '#/components/responses/ValidationError' },
            429: { $ref: '#/components/responses/TooManyRequests' },
          },
        },
      },
      '/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login with username and password',
          description: 'Authenticate with credentials and receive a JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'password'],
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
                example: {
                  username: 'johndoe',
                  password: 'securepassword123',
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  example: {
                    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                },
              },
            },
            400: {
              description: 'User not found',
              content: {
                'application/json': {
                  example: { error: 'User not found' },
                },
              },
            },
            403: {
              description: 'Invalid password',
              content: {
                'application/json': {
                  example: { error: 'Invalid password' },
                },
              },
            },
            429: { $ref: '#/components/responses/TooManyRequests' },
          },
        },
      },
      '/auth/google': {
        get: {
          tags: ['Authentication'],
          summary: 'Initiate Google OAuth login',
          description: 'Redirects to Google for authentication',
          responses: {
            302: {
              description: 'Redirect to Google OAuth',
            },
          },
        },
      },
      '/secure-data': {
        get: {
          tags: ['Authentication'],
          summary: 'Get protected data',
          description: 'Returns protected data for authenticated users',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Protected data retrieved',
              content: {
                'application/json': {
                  example: {
                    message: 'This is protected data.',
                    user: { id: 1, username: 'johndoe' },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
    },
  },
  apis: ['./backend/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
