/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Administrative endpoints for managing integrations
 *   - name: Registration
 *     description: Phone number registration helpers
 *   - name: Messaging
 *     description: WhatsApp messaging endpoints
 *   - name: Webhooks
 *     description: WhatsApp webhook endpoints
 */

import { Router } from "express";

import type { TemplateComponent, IntegrationCreds } from "../utils/types";
import { saveCreds, getCreds, waFetch } from "../utils/wa";

const router = Router();


router.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(400).json({ error: "Missing x-api-key in headers" });
  }
  
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  next();
});


/**
 * @swagger
 * /admin/integrations/{integrationId}/credentials:
 *   post:
 *     tags: [Admin]
 *     summary: Save WhatsApp credentials for an integration
 *     description: Store WhatsApp Business API credentials for a specific integration
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IntegrationCreds'
 *     responses:
 *       200:
 *         description: Credentials saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/admin/integrations/:integrationId/credentials", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { version = "v20.0", wabaId, phoneNumberId, token, verifyToken, displayName } = req.body as Partial<IntegrationCreds>;
    if (!wabaId || !phoneNumberId || !token) return res.status(400).json({ error: "Missing wabaId/phoneNumberId/token" });
    await saveCreds(integrationId, { version, wabaId, phoneNumberId, token, verifyToken, displayName } as IntegrationCreds);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /admin/integrations/{integrationId}/subscribe:
 *   post:
 *     tags: [Admin]
 *     summary: Subscribe app to WhatsApp webhooks
 *     description: Subscribe the application to receive WhatsApp webhook events
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     responses:
 *       200:
 *         description: Successfully subscribed to webhooks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/admin/integrations/:integrationId/subscribe", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { wabaId } = await getCreds(integrationId);
    const data = await waFetch(integrationId, `/${wabaId}/subscribed_apps`, "POST");
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /admin/integrations/{integrationId}/request-code:
 *   post:
 *     tags: [Registration]
 *     summary: Request verification code for phone number
 *     description: Request a verification code to be sent to the phone number via SMS or voice
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistrationCode'
 *     responses:
 *       200:
 *         description: Verification code requested successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/admin/integrations/:integrationId/request-code", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { code_method = "SMS", language = "en_US" } = req.body as { code_method?: string; language?: string };
    const data = await waFetch(integrationId, `/${phoneNumberId}/request_code`, "POST", { code_method, language });
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /admin/integrations/{integrationId}/verify-code:
 *   post:
 *     tags: [Registration]
 *     summary: Verify phone number with code
 *     description: Verify the phone number using the code received via SMS or voice
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyCode'
 *     responses:
 *       200:
 *         description: Code verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/admin/integrations/:integrationId/verify-code", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { code } = req.body as { code: string };
    
    // Validate code format - should be numeric string
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: "Code is required and must be a string" });
    }
    
    // Trim whitespace and ensure code is numeric
    const trimmedCode = code.trim();
    if (!/^\d+$/.test(trimmedCode)) {
      return res.status(400).json({ error: "Code must contain only digits" });
    }
    
    console.log(`Verifying code for integration ${integrationId}, phoneNumberId: ${phoneNumberId}, code: ${trimmedCode}`);
    
    const data = await waFetch(integrationId, `/${phoneNumberId}/verify_code`, "POST", { code: trimmedCode });
    res.json(data);
  } catch (e: any) { 
    console.error(`Verify code error for ${req.params.integrationId}:`, e.message);
    res.status(500).json({ error: e.message }); 
  }
});

/**
 * @swagger
 * /admin/integrations/{integrationId}/register:
 *   post:
 *     tags: [Registration]
 *     summary: Register phone number with PIN
 *     description: Complete phone number registration using the PIN
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterPin'
 *     responses:
 *       200:
 *         description: Phone number registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/admin/integrations/:integrationId/register", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { pin } = req.body as { pin: string };
    const data = await waFetch(integrationId, `/${phoneNumberId}/register`, "POST", { messaging_product: "whatsapp", pin });
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/messages/text:
 *   post:
 *     tags: [Messaging]
 *     summary: Send text message
 *     description: Send a text message to a WhatsApp number
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TextMessage'
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Message ID
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/api/integrations/:integrationId/messages/text", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { to, body } = req.body as { to: string; body: string };
    const payload = { messaging_product: "whatsapp", to, type: "text", text: { body } };
    const data = await waFetch(integrationId, `/${phoneNumberId}/messages`, "POST", payload);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/messages/template:
 *   post:
 *     tags: [Messaging]
 *     summary: Send template message
 *     description: Send a WhatsApp template message with optional dynamic components
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TemplateMessage'
 *     responses:
 *       200:
 *         description: Template message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Message ID
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/api/integrations/:integrationId/messages/template", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { to, name, language = "en_US", components } = req.body as {
      to: string; name: string; language?: string; components?: TemplateComponent[];
    };
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name, language: { code: language }, components }
    };
    const data = await waFetch(integrationId, `/${phoneNumberId}/messages`, "POST", payload);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/messages/media:
 *   post:
 *     tags: [Messaging]
 *     summary: Send media message
 *     description: Send media (image, video, document, audio, sticker) via direct link or uploaded media ID
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MediaMessage'
 *     responses:
 *       200:
 *         description: Media message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Message ID
 *       400:
 *         description: Invalid media kind
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/api/integrations/:integrationId/messages/media", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { to, kind, link, media_id, caption, filename } = req.body as {
      to: string; kind: "image" | "video" | "document" | "audio" | "sticker";
      link?: string; media_id?: string; caption?: string; filename?: string;
    };
    if (!["image","video","document","audio","sticker"].includes(kind)) {
      return res.status(400).json({ error: "invalid kind" });
    }
    const mediaPayload: any = { caption, link, id: media_id, filename };
    Object.keys(mediaPayload).forEach(k => mediaPayload[k] === undefined && delete mediaPayload[k]);

    const payload: any = { messaging_product: "whatsapp", to, type: kind, [kind]: mediaPayload };
    const data = await waFetch(integrationId, `/${phoneNumberId}/messages`, "POST", payload);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/messages/mark-read:
 *   post:
 *     tags: [Messaging]
 *     summary: Mark message as read
 *     description: Mark a received message as read
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarkReadMessage'
 *     responses:
 *       200:
 *         description: Message marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 result:
 *                   type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/api/integrations/:integrationId/messages/mark-read", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { message_id } = req.body as { message_id: string };
    const payload = { messaging_product: "whatsapp", status: "read", message_id };
    const data = await waFetch(integrationId, `/${phoneNumberId}/messages`, "POST", payload);
    res.json({ ok: true, result: data });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /webhook/whatsapp/{integrationId}:
 *   get:
 *     tags: [Webhooks]
 *     summary: Webhook verification
 *     description: WhatsApp webhook verification endpoint for subscribing to events
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *       - in: query
 *         name: hub.mode
 *         required: true
 *         schema:
 *           type: string
 *           enum: [subscribe]
 *         description: Webhook mode
 *       - in: query
 *         name: hub.verify_token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token
 *       - in: query
 *         name: hub.challenge
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge string to echo back
 *     responses:
 *       200:
 *         description: Webhook verified successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               description: Challenge string
 *       403:
 *         description: Forbidden - Invalid verification token
 *     security: []
 */
router.get("/webhook/whatsapp/:integrationId", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const creds = await getCreds(integrationId).catch(() => null);
    const verifyToken = creds?.verifyToken || process.env.DEFAULT_VERIFY_TOKEN;
    const { ["hub.mode"]: mode, ["hub.verify_token"]: token, ["hub.challenge"]: challenge } = req.query as any;
    if (mode === "subscribe" && token === verifyToken) return res.status(200).send(challenge);
    return res.sendStatus(403);
  } catch { return res.sendStatus(403); }
});

/**
 * @swagger
 * /webhook/whatsapp/{integrationId}:
 *   post:
 *     tags: [Webhooks]
 *     summary: Receive WhatsApp webhook events
 *     description: Endpoint to receive incoming messages and status updates from WhatsApp
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: WhatsApp webhook payload
 *             properties:
 *               entry:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     changes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: object
 *                             properties:
 *                               messages:
 *                                 type: array
 *                                 description: Incoming messages
 *                               statuses:
 *                                 type: array
 *                                 description: Message delivery statuses
 *     responses:
 *       200:
 *         description: Webhook received successfully
 *     security: []
 */
router.post("/webhook/whatsapp/:integrationId", async (req, res) => {
  try {
    const data = req.body as any;
    const change = data?.entry?.[0]?.changes?.[0];
    const messages = change?.value?.messages;
    const statuses = change?.value?.statuses;

    if (messages?.length) {
      const m = messages[0];
      console.log("Incoming:", { from: m.from, type: m.type, text: m.text?.body, id: m.id });
      // TODO: خزّن الرسالة/افتح محادثة/شغّل رد تلقائي
    }
    if (statuses?.length) {
      const s = statuses[0];
      console.log("Status:", { id: s.id, status: s.status, timestamp: s.timestamp });
    }
    res.sendStatus(200);
  } catch (e) {
    console.error("webhook error", e);
    res.sendStatus(200);
  }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/business-profile:
 *   get:
 *     tags: [Admin]
 *     summary: Get WhatsApp business profile
 *     description: Get business profile information for a phone number
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     responses:
 *       200:
 *         description: Business profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/api/integrations/:integrationId/business-profile", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const data = await waFetch(integrationId, `/${phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`, "GET");
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/business-profile:
 *   post:
 *     tags: [Admin]
 *     summary: Update WhatsApp business profile
 *     description: Update business profile information for a phone number
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messaging_product:
 *                 type: string
 *                 default: whatsapp
 *               address:
 *                 type: string
 *                 description: Business address
 *               description:
 *                 type: string
 *                 description: Business description
 *               vertical:
 *                 type: string
 *                 description: Industry vertical
 *               about:
 *                 type: string
 *                 description: About text
 *               email:
 *                 type: string
 *                 description: Business email
 *               websites:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Website URLs
 *     responses:
 *       200:
 *         description: Business profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/api/integrations/:integrationId/business-profile", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { messaging_product = "whatsapp", address, description, vertical, about, email, websites } = req.body;
    const payload = { messaging_product, address, description, vertical, about, email, websites };
    Object.keys(payload).forEach(k => payload[k as keyof typeof payload] === undefined && delete payload[k as keyof typeof payload]);
    const data = await waFetch(integrationId, `/${phoneNumberId}/whatsapp_business_profile`, "POST", payload);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/phone-numbers:
 *   get:
 *     tags: [Admin]
 *     summary: Get all phone numbers for WABA
 *     description: Get all phone numbers associated with WhatsApp Business Account
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     responses:
 *       200:
 *         description: Phone numbers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/api/integrations/:integrationId/phone-numbers", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { wabaId } = await getCreds(integrationId);
    const data = await waFetch(integrationId, `/${wabaId}/phone_numbers`, "GET");
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/phone-numbers/{phoneId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get phone number by ID
 *     description: Get specific phone number details by ID
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *       - in: path
 *         name: phoneId
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone number ID
 *     responses:
 *       200:
 *         description: Phone number details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/api/integrations/:integrationId/phone-numbers/:phoneId", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const phoneId = req.params.phoneId;
    const data = await waFetch(integrationId, `/${phoneId}`, "GET");
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /admin/integrations/{integrationId}/deregister:
 *   post:
 *     tags: [Registration]
 *     summary: Deregister phone number
 *     description: Deregister a previously registered phone number
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     responses:
 *       200:
 *         description: Phone number deregistered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/admin/integrations/:integrationId/deregister", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const data = await waFetch(integrationId, `/${phoneNumberId}/deregister`, "POST");
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/messages/contacts:
 *   post:
 *     tags: [Messaging]
 *     summary: Send contact message
 *     description: Send contact information to a WhatsApp number
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 description: WhatsApp ID or phone number
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     addresses:
 *                       type: array
 *                       items:
 *                         type: object
 *                     birthday:
 *                       type: string
 *                     emails:
 *                       type: array
 *                       items:
 *                         type: object
 *                     name:
 *                       type: object
 *                       properties:
 *                         formatted_name:
 *                           type: string
 *                         first_name:
 *                           type: string
 *                         last_name:
 *                           type: string
 *                     org:
 *                       type: object
 *                     phones:
 *                       type: array
 *                       items:
 *                         type: object
 *                     urls:
 *                       type: array
 *                       items:
 *                         type: object
 *     responses:
 *       200:
 *         description: Contact message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Message ID
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/api/integrations/:integrationId/messages/contacts", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { to, contacts } = req.body as { to: string; contacts: any[] };
    const payload = { messaging_product: "whatsapp", to, type: "contacts", contacts };
    const data = await waFetch(integrationId, `/${phoneNumberId}/messages`, "POST", payload);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/messages/location:
 *   post:
 *     tags: [Messaging]
 *     summary: Send location message
 *     description: Send location information to a WhatsApp number
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 description: WhatsApp ID or phone number
 *               latitude:
 *                 type: number
 *                 description: Latitude coordinate
 *               longitude:
 *                 type: number
 *                 description: Longitude coordinate
 *               name:
 *                 type: string
 *                 description: Location name
 *               address:
 *                 type: string
 *                 description: Location address
 *     responses:
 *       200:
 *         description: Location message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Message ID
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/api/integrations/:integrationId/messages/location", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { to, latitude, longitude, name, address } = req.body as { to: string; latitude: number; longitude: number; name?: string; address?: string };
    const locationPayload: any = { latitude, longitude, name, address };
    Object.keys(locationPayload).forEach(k => locationPayload[k] === undefined && delete locationPayload[k]);
    const payload = { messaging_product: "whatsapp", to, type: "location", location: locationPayload };
    const data = await waFetch(integrationId, `/${phoneNumberId}/messages`, "POST", payload);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/messages/interactive:
 *   post:
 *     tags: [Messaging]
 *     summary: Send interactive message
 *     description: Send interactive message with buttons or list to a WhatsApp number
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 description: WhatsApp ID or phone number
 *               interactive:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [button, list]
 *                     description: Type of interactive message
 *                   header:
 *                     type: object
 *                     description: Optional header
 *                   body:
 *                     type: object
 *                     properties:
 *                       text:
 *                         type: string
 *                         description: Body text
 *                   footer:
 *                     type: object
 *                     description: Optional footer
 *                   action:
 *                     type: object
 *                     description: Action buttons or list sections
 *     responses:
 *       200:
 *         description: Interactive message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Message ID
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/api/integrations/:integrationId/messages/interactive", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { to, interactive } = req.body as { to: string; interactive: any };
    const payload = { messaging_product: "whatsapp", to, type: "interactive", interactive };
    const data = await waFetch(integrationId, `/${phoneNumberId}/messages`, "POST", payload);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/messages/reaction:
 *   post:
 *     tags: [Messaging]
 *     summary: Send reaction message
 *     description: Send reaction emoji to a specific message
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 description: WhatsApp ID or phone number
 *               message_id:
 *                 type: string
 *                 description: ID of the message to react to
 *               emoji:
 *                 type: string
 *                 description: Emoji for the reaction
 *     responses:
 *       200:
 *         description: Reaction message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Message ID
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/api/integrations/:integrationId/messages/reaction", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { to, message_id, emoji } = req.body as { to: string; message_id: string; emoji: string };
    const payload = { messaging_product: "whatsapp", to, type: "reaction", reaction: { message_id, emoji } };
    const data = await waFetch(integrationId, `/${phoneNumberId}/messages`, "POST", payload);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/media:
 *   post:
 *     tags: [Media]
 *     summary: Upload media file
 *     description: Upload media file to WhatsApp Cloud API
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Media file to upload
 *               type:
 *                 type: string
 *                 enum: [image, video, document, audio, sticker]
 *                 description: Media type
 *               messaging_product:
 *                 type: string
 *                 default: whatsapp
 *     responses:
 *       200:
 *         description: Media uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Media ID
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/api/integrations/:integrationId/media", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    // Note: This would require multer or similar middleware to handle file uploads
    // For now, we'll pass the request body through assuming it's properly formatted
    const data = await waFetch(integrationId, `/${phoneNumberId}/media`, "POST", req.body, { 'Content-Type': 'multipart/form-data' });
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/media/{mediaId}:
 *   get:
 *     tags: [Media]
 *     summary: Get media file
 *     description: Retrieve media file information or download media
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media file information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: Media download URL
 *                 mime_type:
 *                   type: string
 *                   description: Media MIME type
 *                 sha256:
 *                   type: string
 *                   description: Media SHA256 hash
 *                 file_size:
 *                   type: number
 *                   description: File size in bytes
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/api/integrations/:integrationId/media/:mediaId", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const mediaId = req.params.mediaId;
    const data = await waFetch(integrationId, `/${mediaId}`, "GET");
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/media/{mediaId}:
 *   delete:
 *     tags: [Media]
 *     summary: Delete media file
 *     description: Delete uploaded media file
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media file deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.delete("/api/integrations/:integrationId/media/:mediaId", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const mediaId = req.params.mediaId;
    const data = await waFetch(integrationId, `/${mediaId}`, "DELETE");
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/integrations/{integrationId}/waba:
 *   get:
 *     tags: [Admin]
 *     summary: Get WhatsApp Business Account details
 *     description: Get WABA information and settings
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     responses:
 *       200:
 *         description: WABA details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/api/integrations/:integrationId/waba", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { wabaId } = await getCreds(integrationId);
    const data = await waFetch(integrationId, `/${wabaId}`, "GET");
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /admin/integrations/{integrationId}/commerce-settings:
 *   get:
 *     tags: [Admin]
 *     summary: Get commerce settings
 *     description: Get WhatsApp commerce settings for catalog and cart
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     responses:
 *       200:
 *         description: Commerce settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/admin/integrations/:integrationId/commerce-settings", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const data = await waFetch(integrationId, `/${phoneNumberId}/whatsapp_commerce_settings`, "GET");
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /admin/integrations/{integrationId}/commerce-settings:
 *   post:
 *     tags: [Admin]
 *     summary: Update commerce settings
 *     description: Update WhatsApp commerce settings for catalog and cart
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique integration identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_catalog_visible:
 *                 type: boolean
 *                 description: Whether catalog is visible to customers
 *               is_cart_enabled:
 *                 type: boolean
 *                 description: Whether cart feature is enabled
 *     responses:
 *       200:
 *         description: Commerce settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/admin/integrations/:integrationId/commerce-settings", async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    const { phoneNumberId } = await getCreds(integrationId);
    const { is_catalog_visible, is_cart_enabled } = req.body as { is_catalog_visible?: boolean; is_cart_enabled?: boolean };
    const payload = { is_catalog_visible, is_cart_enabled };
    Object.keys(payload).forEach(k => payload[k as keyof typeof payload] === undefined && delete payload[k as keyof typeof payload]);
    const data = await waFetch(integrationId, `/${phoneNumberId}/whatsapp_commerce_settings`, "POST", payload);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
// ---------------- Start -------------------------------

