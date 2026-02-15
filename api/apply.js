import nodemailer from "nodemailer";

/**
 * Vercel Serverless Function — Growth Application Form Handler
 * Sends structured email to growofy@gmail.com via Gmail SMTP (Nodemailer)
 * and sends auto-reply to the applicant.
 */
export default async function handler(req, res) {
	// Only allow POST
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const body = req.body;

		// ── Extract all fields ──
		const fullName = (body.fullName || "").toString().trim();
		const businessName = (body.businessName || "").toString().trim();
		const email = (body.email || "").toString().trim();
		const phone = (body.phone || "").toString().trim();
		const website = (body.website || "").toString().trim();
		const social = (body.social || "").toString().trim();

		const industry = (body.industry || "").toString().trim();
		const yearsInBusiness = (body.yearsInBusiness || "").toString().trim();
		const monthlyRevenue = (body.monthlyRevenue || "").toString().trim();
		const averageOrderValue = (body.averageOrderValue || "").toString().trim();
		const paidAds = (body.paidAds || "").toString().trim();

		const targetRevenue = (body.targetRevenue || "").toString().trim();
		const challenge = (body.challenge || "").toString().trim();
		const services = Array.isArray(body.services) ? body.services.map((s) => s.toString().trim()).filter(Boolean) : [];

		const monthlyBudget = (body.monthlyBudget || "").toString().trim();
		const whyGrowofy = (body.whyGrowofy || "").toString().trim();

		// ── Validate required fields ──
		const errors = [];
		if (!fullName) errors.push("Full Name");
		if (!businessName) errors.push("Business Name");
		if (!email) errors.push("Email Address");
		if (!phone) errors.push("Phone Number");
		if (!industry) errors.push("Industry");
		if (!yearsInBusiness) errors.push("Years in Business");
		if (!monthlyRevenue) errors.push("Monthly Revenue");
		if (!paidAds) errors.push("Paid Ads (Yes/No)");
		if (!monthlyBudget) errors.push("Monthly Budget");

		if (errors.length > 0) {
			return res.status(400).json({ success: false, error: `Missing required fields: ${errors.join(", ")}` });
		}

		// Validate email format
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res.status(400).json({ success: false, error: "Invalid email format" });
		}

		// Validate phone (at least 10 digits)
		if (phone.replace(/\D/g, "").length < 10) {
			return res.status(400).json({ success: false, error: "Phone number must have at least 10 digits" });
		}

		// ── Create Gmail SMTP transporter ──
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.GMAIL_USER, // growofy@gmail.com
				pass: process.env.GMAIL_APP_PASSWORD, // 16-char app password
			},
		});

		// ── Build email bodies ──
		const notificationHtml = buildNotificationEmail({
			fullName,
			businessName,
			email,
			phone,
			website,
			social,
			industry,
			yearsInBusiness,
			monthlyRevenue,
			averageOrderValue,
			paidAds,
			targetRevenue,
			challenge,
			services,
			monthlyBudget,
			whyGrowofy,
		});

		const autoReplyHtml = buildAutoReplyEmail(fullName);

		// ── Send notification email to Growofy ──
		await transporter.sendMail({
			from: `"Growofy Growth Application" <${process.env.GMAIL_USER}>`,
			to: "growofy@gmail.com",
			replyTo: email,
			subject: `🚀 New Growth Application: ${businessName} — ${fullName}`,
			html: notificationHtml,
		});

		// ── Send auto-reply to applicant ──
		try {
			await transporter.sendMail({
				from: `"Growofy" <${process.env.GMAIL_USER}>`,
				to: email,
				subject: "We've received your Growth Application — Growofy",
				html: autoReplyHtml,
			});
		} catch (replyError) {
			// Don't fail the whole request if auto-reply fails
			console.error("Auto-reply error:", replyError);
		}

		return res.status(200).json({
			success: true,
			message: "Application submitted successfully!",
		});
	} catch (error) {
		console.error("Growth application error:", error);
		return res.status(500).json({
			success: false,
			error: "Failed to submit application. Please try again or contact us directly.",
		});
	}
}

// ── Helpers ──

function escapeHtml(str) {
	if (!str) return "";
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function buildNotificationEmail(d) {
	const row = (label, value) =>
		value
			? `<tr><td style="padding:8px 12px;font-weight:600;color:#374151;white-space:nowrap;vertical-align:top;border-bottom:1px solid #f3f4f6">${label}</td><td style="padding:8px 12px;color:#111827;border-bottom:1px solid #f3f4f6">${escapeHtml(value)}</td></tr>`
			: "";

	const servicesFormatted = d.services.length > 0 ? d.services.join(", ") : "None selected";

	return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:640px;margin:0 auto;padding:32px 16px">
  <div style="background:#111827;color:#fff;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="margin:0;font-size:20px;font-weight:700">🚀 New Growth Application</h1>
    <p style="margin:8px 0 0;font-size:14px;color:#9ca3af">Submitted on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
  </div>
  <div style="background:#fff;padding:0;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <div style="padding:20px 32px 8px"><h2 style="margin:0;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#6b7280">Basic Information</h2></div>
    <table style="width:100%;border-collapse:collapse;padding:0 20px">
      ${row("Full Name", d.fullName)}
      ${row("Business Name", d.businessName)}
      ${row("Email", d.email)}
      ${row("Phone", d.phone)}
      ${row("Website", d.website)}
      ${row("Social", d.social)}
    </table>
    <div style="padding:20px 32px 8px"><h2 style="margin:0;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#6b7280">Business Details</h2></div>
    <table style="width:100%;border-collapse:collapse">
      ${row("Industry", d.industry)}
      ${row("Years in Business", d.yearsInBusiness)}
      ${row("Monthly Revenue", d.monthlyRevenue)}
      ${row("Avg Order Value", d.averageOrderValue)}
      ${row("Running Paid Ads", d.paidAds)}
    </table>
    <div style="padding:20px 32px 8px"><h2 style="margin:0;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#6b7280">Growth Goals</h2></div>
    <table style="width:100%;border-collapse:collapse">
      ${row("Target Revenue (6 mo)", d.targetRevenue)}
      ${row("Biggest Challenge", d.challenge)}
      ${row("Services Needed", servicesFormatted)}
    </table>
    <div style="padding:20px 32px 8px"><h2 style="margin:0;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#6b7280">Budget & Partnership</h2></div>
    <table style="width:100%;border-collapse:collapse">
      ${row("Monthly Budget", d.monthlyBudget)}
      ${row("Why Growofy", d.whyGrowofy)}
    </table>
    <div style="padding:24px 32px;text-align:center">
      <a href="mailto:${escapeHtml(d.email)}" style="display:inline-block;padding:10px 24px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Reply to ${escapeHtml(d.fullName)}</a>
    </div>
  </div>
</div>
</body>
</html>`;
}

function buildAutoReplyEmail(name) {
	return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:580px;margin:0 auto;padding:32px 16px">
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#111827;padding:32px;text-align:center">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff">Application Received</h1>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px;font-size:16px;color:#111827">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
        Thank you for applying to the Growofy Growth Partnership program. We've received your application and our team is reviewing it.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
        <strong>What happens next:</strong>
      </p>
      <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;color:#374151;line-height:1.8">
        <li>Our team will review your application within <strong>24 hours</strong></li>
        <li>We'll reach out to schedule a free strategy call</li>
        <li>We'll recommend the best growth plan for your business</li>
      </ul>
      <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6">
        In the meantime, feel free to reach us directly on <a href="https://wa.me/91790671513" style="color:#111827;font-weight:600">WhatsApp</a> or reply to this email.
      </p>
      <div style="text-align:center;padding-top:8px;border-top:1px solid #f3f4f6">
        <p style="margin:16px 0 0;font-size:13px;color:#9ca3af">— Team Growofy</p>
        <p style="margin:4px 0 0;font-size:12px;color:#d1d5db">growofy.in</p>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}
