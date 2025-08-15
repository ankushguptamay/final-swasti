async function OTPEMAIL(data) {
  return `
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Nunito&display=swap"
      rel="stylesheet"
    />
    <style>
      a {
        color: #5e244b;
        text-decoration: none;
      }
      .border {
        border-style: solid;
        border-width: 1px;
        border-color: #5e244b;
        border-radius: 0.25rem;
      }
      .otpbox {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        font-size: 12px;
        font-weight: bold;
        color: #5e244b;
      }
      .footertext {
        font-size: 12px;
      }

      @media (min-width: 640px) {
        .footertext {
          font-size: 16px;
        }
      }
    </style>
  </head>
  <body>
    <div
      style="
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        margin-top: 1.25rem;
        font-family: Nunito, sans-serif;
      "
    >
      <section style="max-width: 42rem; background-color: #fff">
        <!-- <header 
        <a href="#">
          <img
            src="https://swasi-bharat.b-cdn.net/logo-media/email-logo.jpeg"
            alt="swasti-logo"
            style="width:200px; height:100px;"
          />
        </a>
      </header> -->

        <div
          style="
            height: 200px;
            background: linear-gradient(135deg, #5e244b, #803167);
            width: 100%;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 1.25rem;
          "
        >
          <div style="display: flex; align-items: center; gap: 0.75rem">
            <!-- <div style="width: 2.5rem; height: 1px; background-color: #fff;"></div>
          <svg
            stroke="currentColor"
            fill="currentColor"
            stroke-width="0"
            viewBox="0 0 24 24"
            height="20"
            width="20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="none" d="M0 0h24v24H0V0z"></path>
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"></path>
          </svg>
          <div style="width: 2.5rem; height: 1px; background-color: #fff;"></div> -->
            <a href="#">
              <img
                src="https://swasi-bharat.b-cdn.net/logo-media/email-logo.jpeg"
                alt="swasti-logo"
                style="width: 100px; height: 100px; border-radius: 20px"
              />
            </a>
          </div>
          <div style="display: flex; flex-direction: column; gap: 1.25rem">
            <div
              style="text-align: center; font-size: 14px; font-weight: normal"
            >
              THANKS FOR SIGNING UP!
            </div>
            <div
              class=""
              style="
                font-size: 24px;
                font-weight: bold;
                text-transform: capitalize;
                text-align: center;
              "
            >
              Verify your E-mail Address
            </div>
          </div>
        </div>

        <main
          style="
            margin-top: 2rem;
            padding-left: 1.25rem;
            padding-right: 1.25rem;
          "
        >
          <h4 style="color: #374151">Hello ${data.name},</h4>
          <p style="margin-top: 1rem; line-height: 1.75; color: #4b5563">
            Thank you for registering with us!
          </p>
          <p style="line-height: 1.5; color: #4b5563">
            Please use the following One Time Password(OTP)
          </p>

          <div
            style="
              display: flex;
              align-items: center;
              margin-top: 1rem;
              gap: 20px;
            "
          >
            <p class="border otpbox" style="">${data.otp[0]}</p>
            <p class="border otpbox" style="">${data.otp[1]}</p>
            <p class="border otpbox" style="">${data.otp[2]}</p>
            <p class="border otpbox" style="">${data.otp[3]}</p>
            <p class="border otpbox" style="">${data.otp[4]}</p>
            <p class="border otpbox" style="">${data.otp[5]}</p>
          </div>
         
          <p style="margin-top: 1rem; line-height: 1.75; color: #4b5563">
            This passcode will only be valid for the next
            <span style="font-weight: bold"> ${data.time} minutes</span>.
            Please do not share it with anyone. If you did not request this, you
            can safely ignore this email.
          </p>
       
          <p style="margin-top: 2rem; color: #4b5563">
            Thank you, <br />
            Swasti Bharat
          </p>
        </main>

        <p
          style="
            color: #7b8794;
            padding-left: 1.25rem;
            padding-right: 1.25rem;
            margin-top: 2rem;
          "
        >
          This email was sent from
          <a
            href="mailto:connect@swastibharat.com"
            style="color: #5e244b; text-decoration: none"
            alt="connect@swastibharat.com"
            target="_blank"
          >
            ${data.senderMail} </a
          >.
        </p>

        <footer style="margin-top: 2rem">
          <div
            style="
              background-color: rgba(209, 213, 219, 0.6);
              height: 200px;
              display: flex;
              flex-direction: column;
              gap: 1.25rem;
              justify-content: center;
              align-items: center;
            "
          >
            <div
              style="
                text-align: center;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
              "
            >
              <h1
                style="
                  color: #5e244b;
                  font-weight: bold;
                  font-size: 20px;
                  letter-spacing: 2px;
                "
              >
                Get in touch
              </h1>
             

              <a
                href="mailto:connect@swastibharat.com"
                style="color: #4b5563"
                alt="connect@swastibharat.com"
              >
                connect@swastibharat.com
              </a>
            </div>
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
              "
            >
              <a href="https://www.facebook.com/share/19Gz8EYB3q/">
                <svg
                  stroke="currentColor"
                  fill="gray"
                  stroke-width="0"
                  viewBox="0 0 16 16"
                  height="18"
                  width="18"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"
                  ></path>
                </svg>
              </a>

              <a
                href="https://www.instagram.com/swasti_bharat?igsh=MXlpcjhmZ3hqeXZv"
              >
                <svg
                  stroke="currentColor"
                  fill="gray"
                  stroke-width="0"
                  viewBox="0 0 1024 1024"
                  height="18"
                  width="18"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M512 378.7c-73.4 0-133.3 59.9-133.3 133.3S438.6 645.3 512 645.3 645.3 585.4 645.3 512 585.4 378.7 512 378.7zM911.8 512c0-55.2.5-109.9-2.6-165-3.1-64-17.7-120.8-64.5-167.6-46.9-46.9-103.6-61.4-167.6-64.5-55.2-3.1-109.9-2.6-165-2.6-55.2 0-109.9-.5-165 2.6-64 3.1-120.8 17.7-167.6 64.5C132.6 226.3 118.1 283 115 347c-3.1 55.2-2.6 109.9-2.6 165s-.5 109.9 2.6 165c3.1 64 17.7 120.8 64.5 167.6 46.9 46.9 103.6 61.4 167.6 64.5 55.2 3.1 109.9 2.6 165 2.6 55.2 0 109.9.5 165-2.6 64-3.1 120.8-17.7 167.6-64.5 46.9-46.9 61.4-103.6 64.5-167.6 3.2-55.1 2.6-109.8 2.6-165zM512 717.1c-113.5 0-205.1-91.6-205.1-205.1S398.5 306.9 512 306.9 717.1 398.5 717.1 512 625.5 717.1 512 717.1zm213.5-370.7c-26.5 0-47.9-21.4-47.9-47.9s21.4-47.9 47.9-47.9 47.9 21.4 47.9 47.9a47.84 47.84 0 0 1-47.9 47.9z"
                  ></path>
                </svg>
              </a>

              <a href="https://www.linkedin.com/company/swasti-bharat/">
                <svg
                  stroke="currentColor"
                  fill="gray"
                  stroke-width="0"
                  viewBox="0 0 16 16"
                  height="16"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"
                  ></path>
                </svg>
              </a>
            </div>
          </div>
          <div
            style="
              background: linear-gradient(135deg, #5e244b, #803167);
              padding-top: 10px;
              padding-bottom: 10px;
              color: #fff;
              text-align: center;
            "
          >
            <p class="footertext">© Swasti Bharat 2024. All Rights Reserved.</p>
          </div>
        </footer>
      </section>
    </div>
  </body>
</html>`;
}

async function yvcPaymentSuccessEmail(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Enrollment Confirmation</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background-color: #f7f7f7;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .header {
      background: linear-gradient(90deg, #5F244C, #7F3166);
      padding: 20px;
      text-align: center;
      color: white;
    }
    .header img {
      max-width: 250px;
      margin-bottom: 10px;
    }
    .content {
      padding: 20px;
    }
    .content h2 {
      font-size: 20px;
      margin-bottom: 20px;
      border-bottom: 2px solid #a3478e;
      display: inline-block;
      padding-bottom: 5px;
    }
    .content p {
      line-height: 1.6;
      margin: 10px 0;
    }
    .content strong {
      font-weight: 600;
    }
   .button {
  display: block;
  width: fit-content;
  background: #7c3479;
  color: white !important; /* enforce white text */
  text-decoration: none !important; /* remove underline */
  text-align: center;
  padding: 10px 20px;
  border-radius: 5px;
  margin: 20px auto;
  font-weight: 600;
}
    .footer {
      background: #f2e2f4;
      text-align: center;
      padding: 20px;
      font-size: 16px;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer a {
      color: #7c3479;
      text-decoration: none;
      font-weight: 600;
    }
   .social-icons {
  display: flex;
  justify-content: center; 
  align-items: center;
  gap: 15px; 
  margin: 20px 0; 
}

.social-icons a img {
  display: block;
  border: 0;
  outline: none;
  text-decoration: none;
}
    .bottom {
      background: #7B2F63;
      color: white;
      text-align: center;
      padding: 10px;
      font-size: 12px;
    }
    @media(max-width: 600px) {
      .content h2 {
        font-size: 18px;
      }
      .button {
        width: 100%;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- Replace with your logo URL -->
      <img src="https://swasi-bharat.b-cdn.net/logo-media/Swasth%20Bharat%20with%201.png" alt="Swasti Bharat Logo"/>
    </div>
    <div class="content">
      <h2>Enrollment Confirmed : ${data.courseName}</h2>
      <p>Hey <strong>${data.userName}</strong></p>
      <p>Thank you for enrolling in the ${data.courseName} offered by Jagriti Yoga & Naturopathy Sansthan.</p>
      <p><strong>Payment Received:</strong> ₹${data.amount}</p>
      <p><strong>Course Enrolled:</strong> ${data.courseName}</p>
      <p><strong>Class Time:</strong> ${data.timeSlote}</p>
      <p><strong>Certificate:</strong> Issued by Jagriti Yoga & Naturopathy Sansthan, an accredited Yoga Training Center recognized by the Yoga Certification Board, Ministry of AYUSH, Government of India.</p>
      <p><a href="#">Stay connected for updates. Welcome to your yoga journey!</a></p>
      <p><em>Warm regards,</em><br/>
      <strong>Team Swasti Bharat</strong></p>
      <a class="button" href="https://swastibharat.com/">Visit Site</a>
    </div>
    <div class="footer">
      <p><strong>Get in touch</strong></p>
      <p>+91-7088440955</p>
      <p><a href="mailto:connect@swastibharat.com">connect@swastibharat.com</a></p>
  <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td align="center" style="padding: 20px 0;">
      <a href="https://www.facebook.com/share/14HpZP3ZB6N/?mibextid=qi2Omg" style="margin: 0 10px;">
        <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="24" height="24" style="display: inline-block; border: 0;">
      </a>
      <a href="https://www.linkedin.com/company/swasti-bharat/" style="margin: 0 10px;">
        <img src="https://cdn-icons-png.flaticon.com/512/733/733561.png" alt="LinkedIn" width="24" height="24" style="display: inline-block; border: 0;">
      </a>
      <a href="https://www.instagram.com/swasti_bharat?igsh=MWZnb3gyaXludWdvOA==" style="margin: 0 10px;">
        <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="24" height="24" style="display: inline-block; border: 0;">
      </a>
    </td>
  </tr>
</table>

    </div>
    <div class="bottom">
      © 2025 Swasti Bharat. All Rights Reserved.
    </div>
  </div>
</body>
</html>
`;
}

export { OTPEMAIL, yvcPaymentSuccessEmail };
