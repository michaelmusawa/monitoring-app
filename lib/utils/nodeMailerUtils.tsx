import nodemailer from "nodemailer";

export interface MailResult {
  success: boolean;
  message: string;
}

export async function sendMail(
  resetUrl: string,
  email: string,
  name?: string,
): Promise<MailResult> {
  const { SMTP_SERVER_HOST, SMTP_SERVER_USERNAME, SMTP_SERVER_PASSWORD } =
    process.env;

  if (!SMTP_SERVER_HOST || !SMTP_SERVER_USERNAME || !SMTP_SERVER_PASSWORD) {
    return {
      success: false,
      message:
        "Mail configuration is incomplete. Please check SMTP_SERVER_HOST, SMTP_SERVER_USERNAME, and SMTP_SERVER_PASSWORD.",
    };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: SMTP_SERVER_HOST,
    port: 587,
    secure: true,
    auth: {
      user: SMTP_SERVER_USERNAME,
      pass: SMTP_SERVER_PASSWORD,
    },
  });

  // Common styles for the button
  const buttonStyles =
    "display: inline-block; padding: 12px 24px; font-size: 16px; color: #fff; background-color: #28a745; text-decoration: none; border-radius: 4px;";

  // Build the email HTML
  const html = `
  <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header / Logo -->
          <tr>
            <td align="center" style="background-color: #006400; padding: 20px;">
              <img src="https://yourdomain.com/logo.png" alt="Customer Service App" width="120" style="display: block;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 30px; color: #333333; line-height: 1.5;">
              <h2 style="margin-top: 0; color: #006400;">
                ${name ? `Welcome, ${name}!` : "Hello!"}
              </h2>
              <p style="margin: 16px 0;">
                ${
                  name
                    ? "Thank you for registering with Customer Service App. Please set your password to activate your account."
                    : "We received a request to reset your password for your Customer Service App account."
                }
              </p>

              <!-- Call-to-Action Button -->
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="${buttonStyles}">
                  ${name ? "Set Password & Activate" : "Reset Your Password"}
                </a>
              </p>

              <p style="font-size: 12px; color: #555555; margin: 16px 0;">
                This link will expire in <strong>24 hours</strong>. If you didn’t ${
                  name ? "register" : "request a password reset"
                }, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #777777;">
              <p style="margin: 0;">Customer Service App</p>
              <p style="margin: 4px 0;">3075 CityHall Way, Nairobi, Kenya</p>
              <p style="margin: 4px 0;">&copy; ${new Date().getFullYear()} Smart Nairobi</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;

  const mailOptions = {
    from: `"Customer Service App" <no-reply@customerservice.go.ke>`,
    to: email,
    subject: name
      ? "Activate your Customer Service App account"
      : "Reset your password",
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: "Email sent successfully.",
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    const errMsg =
      error instanceof Error ? error.message : "Unknown error sending email.";
    return {
      success: false,
      message: `Failed to send email: ${errMsg}`,
    };
  }
}
