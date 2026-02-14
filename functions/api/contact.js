/**
 * Contact Form Handler using Mailchannels
 * Handles form submissions and sends emails
 */

export async function onRequest(context) {
	const { request, env } = context;

	// Only allow POST requests
	if (request.method !== "POST") {
		return new Response(JSON.stringify({ error: "Method not allowed" }), {
			status: 405,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const formData = await request.formData();

		// Extract form fields
		const name = formData.get("name");
		const email = formData.get("email");
		const company = formData.get("company") || "";
		const message = formData.get("message");

		// Validate required fields
		if (!name || !email || !message) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "Missing required fields: name, email, message",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "Invalid email format",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Email content
		const emailBody = `
Name: ${name}
Email: ${email}
Company: ${company || "Not provided"}
Message: ${message}

---
This message was sent from the contact form on growofy.in
		`;

		// Send email via Mailchannels API to growofy@gmail.com
		const mailResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				personalizations: [
					{
						to: [
							{
								email: "growofy@gmail.com",
								name: "Growofy",
							},
						],
						reply_to: [
							{
								email: email,
								name: name,
							},
						],
					},
				],
				from: {
					email: "noreply@growofy.in",
					name: "Growofy Contact Form",
				},
				subject: `New Contact Form Submission from ${name}`,
				content: [
					{
						type: "text/plain",
						value: emailBody,
					},
				],
			}),
		});

		if (!mailResponse.ok) {
			const errorData = await mailResponse.text();
			console.error("Mailchannels error:", errorData);
			throw new Error(`Mailchannels API error: ${mailResponse.status}`);
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: "Your message has been sent successfully!",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Contact form error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: "Failed to send message. Please try again or contact us directly.",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
