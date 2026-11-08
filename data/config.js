/* Temple settings. Edit the values between the quotes.
   Anything left empty ("") is simply not shown on the website, so nothing
   half-finished is ever published.

   IMPORTANT: put only the Trust's OFFICIAL details here (account in the Trust's name).
   Never put passwords or API keys in this file: it is public. */
window.TEMPLE_CONFIG = {
  siteUrl: "https://dalavoisivangurutemple.org",

  trust: {
    name_en: "Sri Dhatchinamoorthi Arakattalai",
    name_ta: "",            // Tamil spelling of the registered name, if the deed has one
    registration: ""        // registration number, e.g. as on the trust deed
  },

  // Fill these in only after the Trust confirms them.
  donation: {
    upi_id: "",             // e.g. "name@bank"
    upi_qr: "",             // path to a QR image, e.g. "assets/img/upi-qr.png"
    account_name: "",       // must be the Trust's registered name
    account_number: "",
    ifsc: "",
    bank: "",               // bank and branch
    note_en: "",            // optional line shown above the details
    note_ta: ""
  },

  // Shows a progress bar when target_amount is above 0.
  progress: {
    target_amount: 0,       // in rupees
    raised_amount: 0,
    updated: ""             // e.g. "12 November 2026"
  }
};
