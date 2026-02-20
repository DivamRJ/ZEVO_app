import { NextResponse } from "next/server";

type BookingPayload = {
  bookerEmail: string;
  booking: {
    arena: string;
    sport: string;
    location: string;
    price: string;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BookingPayload;
    const bookerEmail = body?.bookerEmail?.trim();
    const booking = body?.booking;

    if (!bookerEmail || !booking?.arena || !booking?.sport || !booking?.location || !booking?.price) {
      return NextResponse.json({ error: "Missing booking details." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const recipientEmail = process.env.ZEVO_BOOKINGS_EMAIL || "zevoapp@zevo.app";
    const senderEmail = process.env.ZEVO_FROM_EMAIL || "ZEVO <onboarding@resend.dev>";

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Email service is not configured. Set RESEND_API_KEY in environment variables."
        },
        { status: 500 }
      );
    }

    const html = `
      <h2>New ZEVO Booking Request</h2>
      <p><strong>User Email:</strong> ${bookerEmail}</p>
      <p><strong>Arena:</strong> ${booking.arena}</p>
      <p><strong>Sport:</strong> ${booking.sport}</p>
      <p><strong>Location:</strong> ${booking.location}</p>
      <p><strong>Price:</strong> ${booking.price}</p>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [recipientEmail],
        subject: `ZEVO Booking: ${booking.arena}`,
        html
      })
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      return NextResponse.json({ error: `Email send failed: ${errorBody}` }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: `Booking sent to ${recipientEmail}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
