import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import icon from "astro-icon";
import { defineConfig } from "astro/config";

// Dev-only API plugin — handles /api/apply locally during astro dev
// In production, Vercel Serverless Function (api/apply.js) handles this
function devApiPlugin() {
	return {
		name: "dev-api-apply",
		configureServer(server) {
			server.middlewares.use("/api/apply", (req, res, next) => {
				if (req.method !== "POST") return next();

				let body = "";
				req.on("data", (chunk) => (body += chunk));
				req.on("end", () => {
					try {
						const data = JSON.parse(body);

						// Validate required fields
						const required = [
							"fullName",
							"businessName",
							"email",
							"phone",
							"industry",
							"yearsInBusiness",
							"monthlyRevenue",
							"paidAds",
							"monthlyBudget",
						];
						const missing = required.filter((f) => !data[f]?.toString().trim());

						if (missing.length > 0) {
							res.writeHead(400, { "Content-Type": "application/json" });
							res.end(JSON.stringify({ success: false, error: `Missing required fields: ${missing.join(", ")}` }));
							return;
						}

						// Validate email
						if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
							res.writeHead(400, { "Content-Type": "application/json" });
							res.end(JSON.stringify({ success: false, error: "Invalid email format" }));
							return;
						}

						// Validate phone
						if ((data.phone || "").replace(/\D/g, "").length < 10) {
							res.writeHead(400, { "Content-Type": "application/json" });
							res.end(JSON.stringify({ success: false, error: "Phone number must have at least 10 digits" }));
							return;
						}

						console.log("[DEV] Growth application received:", JSON.stringify(data, null, 2));
						console.log("[DEV] Email sending skipped in dev mode — will work on Vercel");

						res.writeHead(200, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ success: true, message: "Application submitted successfully!" }));
					} catch (err) {
						console.error("[DEV] API error:", err);
						res.writeHead(500, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ success: false, error: "Server error" }));
					}
				});
			});
		},
	};
}

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [devApiPlugin()],
		server: {
			watch: {
				usePolling: true,
			},
		},
	},
	site: "https://mintaka.co",
	i18n: {
		defaultLocale: "en",
		locales: ["en", "it"],
	},
	markdown: {
		drafts: true,
		shikiConfig: {
			theme: "css-variables",
		},
	},
	shikiConfig: {
		wrap: true,
		skipInline: false,
		drafts: true,
	},
	integrations: [
		tailwind({
			applyBaseStyles: false,
		}),
		sitemap(),
		mdx(),
		icon(),
	],
});
