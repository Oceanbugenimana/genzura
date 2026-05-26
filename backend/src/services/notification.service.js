const axios = require('axios');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ── Message builder ──────────────────────────────────────────
const buildLowStockMessage = (product) => {
  return (
    `⚠️ *Low Stock Alert*\n\n` +
    `*Product:* ${product.name}\n` +
    `*SKU:* ${product.sku}\n` +
    `*Current Quantity:* ${product.quantity}\n` +
    `*Minimum Required:* ${product.minimumStock}\n` +
    `*Store:* ${product.store?.name || 'N/A'}\n\n` +
    `Please restock soon.`
  );
};

// ── Send via Meta WhatsApp Cloud API ─────────────────────────
const sendViaMetaAPI = async (to, message) => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp Meta API credentials not configured.');
  }

  const response = await axios.post(
    `${process.env.WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''), // strip non-digits
      type: 'text',
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  return response.data;
};

// ── Send via Twilio WhatsApp ──────────────────────────────────
const sendViaTwilio = async (to, message) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured.');
  }

  const response = await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    new URLSearchParams({
      From: from,
      To: `whatsapp:${to}`,
      Body: message,
    }),
    {
      auth: { username: accountSid, password: authToken },
      timeout: 10000,
    }
  );

  return response.data;
};

// ── Core send function with retry ────────────────────────────
const sendWhatsApp = async (to, message, retries = 0) => {
  try {
    // Prefer Meta API, fall back to Twilio
    if (process.env.WHATSAPP_ACCESS_TOKEN) {
      return await sendViaMetaAPI(to, message);
    } else if (process.env.TWILIO_ACCOUNT_SID) {
      return await sendViaTwilio(to, message);
    } else {
      // Dev mode: just log
      logger.info(`[WhatsApp DEV] To: ${to}\n${message}`);
      return { dev: true };
    }
  } catch (err) {
    if (retries < MAX_RETRIES) {
      logger.warn(`WhatsApp send failed (attempt ${retries + 1}). Retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (retries + 1)));
      return sendWhatsApp(to, message, retries + 1);
    }
    throw err;
  }
};

// ── Low stock alert ──────────────────────────────────────────
const sendLowStockAlert = async (product, triggeredByUser) => {
  try {
    // Find users to notify: store manager + admins with WhatsApp numbers
    const recipients = await prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        whatsappNumber: { not: null },
        OR: [
          { role: 'ADMIN' },
          { managedStores: { some: { id: product.storeId } } },
        ],
      },
      select: { id: true, whatsappNumber: true },
    });

    if (recipients.length === 0) {
      logger.warn(`No WhatsApp recipients found for low stock alert: ${product.name}`);
      return;
    }

    const message = buildLowStockMessage(product);

    for (const recipient of recipients) {
      // Avoid duplicate notifications within 1 hour
      const recentNotification = await prisma.notification.findFirst({
        where: {
          productId: product.id,
          userId: recipient.id,
          type: 'LOW_STOCK',
          status: 'SENT',
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      });

      if (recentNotification) {
        logger.info(`Skipping duplicate low stock alert for product ${product.id} to user ${recipient.id}`);
        continue;
      }

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId: recipient.id,
          productId: product.id,
          type: 'LOW_STOCK',
          message,
          whatsappTo: recipient.whatsappNumber,
          status: 'PENDING',
        },
      });

      try {
        await sendWhatsApp(recipient.whatsappNumber, message);

        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'SENT', sentAt: new Date() },
        });

        logger.info(`✅ Low stock alert sent to ${recipient.whatsappNumber} for product: ${product.name}`);
      } catch (sendErr) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
            retryCount: { increment: 1 },
            errorMsg: sendErr.message,
          },
        });
        logger.error(`❌ Failed to send WhatsApp alert: ${sendErr.message}`);
      }
    }
  } catch (err) {
    logger.error('sendLowStockAlert error:', err);
  }
};

// ── Retry failed notifications ───────────────────────────────
const retryFailedNotifications = async () => {
  try {
    const failed = await prisma.notification.findMany({
      where: { status: 'FAILED', retryCount: { lt: MAX_RETRIES } },
      take: 20,
    });

    logger.info(`Retrying ${failed.length} failed notifications...`);

    for (const notification of failed) {
      try {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'RETRYING' },
        });

        await sendWhatsApp(notification.whatsappTo, notification.message);

        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
      } catch (err) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
            retryCount: { increment: 1 },
            errorMsg: err.message,
          },
        });
      }
    }
  } catch (err) {
    logger.error('retryFailedNotifications error:', err);
  }
};

module.exports = { sendLowStockAlert, retryFailedNotifications, sendWhatsApp, buildLowStockMessage };
