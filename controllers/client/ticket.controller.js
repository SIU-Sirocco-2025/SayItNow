const Ticket = require('../../models/ticket.model');
const sendMailHelper = require('../../helpers/sendMail');

// [POST] /ticket/submit - Gửi ticket mới
module.exports.submit = async (req, res) => {
  try {
    const { fullName, email, subject, message, category } = req.body;

    // Validation
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng điền đầy đủ thông tin!' 
      });
    }

    // Tạo ticket mới
    const ticket = new Ticket({
      userId: req.session?.user?._id || null,
      fullName,
      email,
      subject,
      message,
      category: category || 'other'
    });

    await ticket.save();

    // Gửi email xác nhận cho user
    const userEmailSubject = 'Xác nhận đã nhận phản hồi - Eco-Track';
    const userEmailHtml = `
    <!doctype html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Eco-Track - Xác nhận phản hồi</title>
    </head>
    <body style="margin:0;padding:0;background:#f3faf6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table role="presentation" style="width:100%;border:0;border-spacing:0;">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table role="presentation" style="max-width:600px;width:100%;background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);border:0;border-spacing:0;">
              <tr>
                <td align="center" style="padding:32px 24px 24px;border-bottom:1px solid #e2e8f0;">
                  <h1 style="margin:16px 0 4px;font-size:22px;font-weight:600;color:#222;">Eco-Track</h1>
                  <p style="margin:0;font-size:14px;color:#6c757d;">Xác nhận đã nhận phản hồi</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;font-size:14px;color:#343a40;line-height:1.6;">
                  <p style="margin:0 0 12px;">Xin chào <strong>${fullName}</strong>,</p>
                  <p style="margin:0 0 16px;">Cảm ơn bạn đã gửi phản hồi đến Eco-Track. Chúng tôi đã nhận được thông tin:</p>
                  
                  <div style="background:#f8f9fa;border-left:4px solid #22c55e;padding:16px;margin:16px 0;border-radius:4px;">
                    <p style="margin:0 0 8px;"><strong>Chủ đề:</strong> ${subject}</p>
                    <p style="margin:0 0 8px;"><strong>Danh mục:</strong> ${category}</p>
                    <p style="margin:0;"><strong>Mã ticket:</strong> #${ticket._id}</p>
                  </div>
                  
                  <p style="margin:16px 0 12px;">Đội ngũ của chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.</p>
                  <p style="margin:0;">Trân trọng,<br><strong>Đội ngũ Eco-Track</strong></p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:20px;background:#f8f9fa;border-radius:0 0 12px 12px;">
                  <p style="margin:0;font-size:12px;color:#6c757d;">
                    © ${new Date().getFullYear()} Eco-Track. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    await sendMailHelper.sendMail(email, userEmailSubject, userEmailHtml);

    // Gửi email thông báo cho admin (email từ .env)
    const adminEmail = process.env.EMAIL_USER;
    if (adminEmail) {
      const adminEmailSubject = `[Eco-Track] Phản hồi mới: ${subject}`;
      const adminEmailHtml = `
      <h3>Phản hồi mới từ người dùng</h3>
      <p><strong>Từ:</strong> ${fullName} (${email})</p>
      <p><strong>Chủ đề:</strong> ${subject}</p>
      <p><strong>Danh mục:</strong> ${category}</p>
      <p><strong>Mã ticket:</strong> #${ticket._id}</p>
      <hr>
      <p><strong>Nội dung:</strong></p>
      <p>${message}</p>
      <hr>
      <p>Vào admin panel để xem chi tiết và trả lời.</p>`;
      
      await sendMailHelper.sendMail(adminEmail, adminEmailSubject, adminEmailHtml);
    }

    return res.json({ 
      success: true, 
      message: 'Gửi phản hồi thành công! Chúng tôi sẽ liên hệ lại sớm nhất.',
      ticketId: ticket._id
    });

  } catch (error) {
    console.error('Submit ticket error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Có lỗi xảy ra, vui lòng thử lại sau!' 
    });
  }
};