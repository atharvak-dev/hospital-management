const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

transporter.verify((err) => {
    if (err) console.error('SMTP connection failed:', err.message);
    else console.log('SMTP ready — emails will be sent from', process.env.SMTP_USER);
});

const sendApprovalRequestEmail = async ({ adminEmail, newUser, approveUrl, rejectUrl }) => {
    await transporter.sendMail({
        from: `"MediCare Hospital" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `New User Registration Request — ${newUser.full_name}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <div style="background:#2563eb;padding:24px 32px;">
                    <h1 style="color:#fff;margin:0;font-size:20px;">MediCare — New User Request</h1>
                </div>
                <div style="padding:32px;">
                    <p style="color:#374151;font-size:15px;">A new user has signed up and is awaiting your approval:</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                        <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Name</td><td style="padding:8px 0;color:#111827;font-weight:600;">${newUser.full_name}</td></tr>
                        <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Username</td><td style="padding:8px 0;color:#111827;">@${newUser.username}</td></tr>
                        <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Email</td><td style="padding:8px 0;color:#111827;">${newUser.email}</td></tr>
                        <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Phone</td><td style="padding:8px 0;color:#111827;">${newUser.phone || '—'}</td></tr>
                        <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Role</td><td style="padding:8px 0;color:#111827;text-transform:capitalize;">${newUser.role}</td></tr>
                    </table>
                    <div style="margin-top:32px;display:flex;gap:16px;">
                        <a href="${approveUrl}" style="display:inline-block;padding:12px 28px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;margin-right:12px;">✓ Approve</a>
                        <a href="${rejectUrl}" style="display:inline-block;padding:12px 28px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">✗ Reject</a>
                    </div>
                    <p style="margin-top:24px;color:#9ca3af;font-size:12px;">These links are single-use and will update the user's status immediately.</p>
                </div>
            </div>
        `,
    });
};

module.exports = { sendApprovalRequestEmail };
