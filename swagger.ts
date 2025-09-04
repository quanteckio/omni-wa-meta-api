import swaggerJSDoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';
import path from 'path';
import fs from 'fs';



const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Omni WhatsApp Meta API',
      version: '1.0.1',
      description: 'WhatsApp Business API integration for sending messages, managing templates, and handling webhooks',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://omni-wa-meta.bassiratahlil.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key required for authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            ok: {
              type: 'boolean',
              example: true,
            },
          },
        },
        IntegrationCreds: {
          type: 'object',
          required: ['wabaId', 'phoneNumberId', 'token'],
          properties: {
            version: {
              type: 'string',
              default: 'v20.0',
              description: 'WhatsApp API version',
            },
            wabaId: {
              type: 'string',
              description: 'WhatsApp Business Account ID',
            },
            phoneNumberId: {
              type: 'string',
              description: 'Phone Number ID from WhatsApp Business',
            },
            token: {
              type: 'string',
              description: 'Access token for WhatsApp API',
            },
            verifyToken: {
              type: 'string',
              description: 'Webhook verify token',
            },
            displayName: {
              type: 'string',
              description: 'Display name for the phone number',
            },
          },
        },
        TextMessage: {
          type: 'object',
          required: ['to', 'body'],
          properties: {
            to: {
              type: 'string',
              description: 'Recipient phone number with country code',
              example: '1234567890',
            },
            body: {
              type: 'string',
              description: 'Message text content',
              example: 'Hello, this is a test message!',
            },
          },
        },
        TemplateMessage: {
          type: 'object',
          required: ['to', 'name'],
          properties: {
            to: {
              type: 'string',
              description: 'Recipient phone number with country code',
              example: '1234567890',
            },
            name: {
              type: 'string',
              description: 'Template name',
              example: 'hello_world',
            },
            language: {
              type: 'string',
              default: 'en_US',
              description: 'Template language code',
            },
            components: {
              type: 'array',
              description: 'Template components for dynamic content',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['header', 'body', 'button'],
                  },
                  parameters: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                          enum: ['text', 'payload'],
                        },
                        text: {
                          type: 'string',
                        },
                        payload: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        MediaMessage: {
          type: 'object',
          required: ['to', 'kind'],
          properties: {
            to: {
              type: 'string',
              description: 'Recipient phone number with country code',
              example: '1234567890',
            },
            kind: {
              type: 'string',
              enum: ['image', 'video', 'document', 'audio', 'sticker'],
              description: 'Type of media to send',
            },
            link: {
              type: 'string',
              description: 'Direct URL to media file',
              example: 'https://example.com/image.jpg',
            },
            media_id: {
              type: 'string',
              description: 'Previously uploaded media ID',
            },
            caption: {
              type: 'string',
              description: 'Caption for the media',
            },
            filename: {
              type: 'string',
              description: 'Filename for document media',
            },
          },
        },
        MarkReadMessage: {
          type: 'object',
          required: ['message_id'],
          properties: {
            message_id: {
              type: 'string',
              description: 'ID of the message to mark as read',
            },
          },
        },
        RegistrationCode: {
          type: 'object',
          properties: {
            code_method: {
              type: 'string',
              default: 'SMS',
              enum: ['SMS', 'VOICE'],
              description: 'Method to receive verification code',
            },
            language: {
              type: 'string',
              default: 'en_US',
              description: 'Language for verification message',
            },
          },
        },
        VerifyCode: {
          type: 'object',
          required: ['code'],
          properties: {
            code: {
              type: 'string',
              description: 'Verification code received via SMS/Voice',
            },
          },
        },
        RegisterPin: {
          type: 'object',
          required: ['pin'],
          properties: {
            pin: {
              type: 'string',
              description: '6-digit PIN for phone number registration',
            },
          },
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  apis: getApiFiles(), // Path to the API files
};

// Function to dynamically find API files in both development and production
function getApiFiles(): string[] {
  const baseDir = path.dirname(__filename);

  // Check if we're in development (TypeScript files exist)
  const devRoutesPath = path.join(baseDir, 'routes', '*.ts');
  const devAppPath = path.join(baseDir, 'app.ts');

  // Check if we're in production (JavaScript files exist)
  const prodRoutesPath = path.join(baseDir, 'routes', '*.js');
  const prodAppPath = path.join(baseDir, 'app.js');

  const apiFiles: string[] = [];

  // Add route files
  if (fs.existsSync(path.dirname(devRoutesPath))) {
    // Development environment - use TypeScript files
    apiFiles.push(devRoutesPath);
  } else if (fs.existsSync(path.dirname(prodRoutesPath))) {
    // Production environment - use JavaScript files
    apiFiles.push(prodRoutesPath);
  }

  // Add app file
  if (fs.existsSync(devAppPath)) {
    apiFiles.push(devAppPath);
  } else if (fs.existsSync(prodAppPath)) {
    apiFiles.push(prodAppPath);
  }

  return apiFiles;
}

const specs = swaggerJSDoc(options);

export default specs;
