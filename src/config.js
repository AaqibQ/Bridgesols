// Form delivery via Web3Forms (https://web3forms.com).
//
// The access key is public by design: it can only be used to submit forms,
// and Web3Forms binds it to the owner's inbox on their side, so the
// destination address never appears in this code or on the site.
// To change the inbox, create a new key for the new address and replace it.
export const WEB3FORMS_ACCESS_KEY = "4116dc07-51d9-496a-b1ec-d1f123379567";
export const WEB3FORMS_URL = "https://api.web3forms.com/submit";

// Social profiles, shown in the footer. Keep in sync with "sameAs" in the Organization
// JSON-LD on index.html (a test checks this).
export const SOCIAL_LINKS = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/bridgesols1.0/",
    icon: "M14 8.5V7c0-.8.2-1.2 1.3-1.2H17V3h-2.4C11.9 3 11 4.5 11 6.6v1.9H9V11.5h2V21h3v-9.5h2.4l.4-3z"
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/bridgesols1.0/",
    icon: "M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm4.5 5.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zM17.2 6.3h.01"
  }
];
