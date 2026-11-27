# Aadinath Poly Plast — Webapp

This week's PP bag and flex printing rates. Customers see rates with no login. Admin edits every price.

## Run it on your PC
Open a terminal in this folder and run:

    python -m http.server 8000

Then open http://localhost:8000 (phone on same Wi-Fi: http://<your-PC-IP>:8000).

## Admin
Login -> Admin: PIN `1234` in demo mode; email + password once Firebase is connected.
- Edit rates: change prices and the "Rates valid for" dates (auto: today till coming Thursday night).
- Product info, call/WhatsApp number, scrolling notice, About us: on the Admin page.

## Weekly rates
Rates run till Thursday 11:59 PM. After that, if the admin has not saved new rates, the app shows
"Last week's rates" in amber with a Call button, so nobody books on an old rate.

## Opening screen
Aadinath Bhagwan (img/bhagwan.webp, full quality img/bhagwan.png) shows on every open and refresh,
with glow, gold dust, light sweep and a gentle 3D turn that follows the finger / phone tilt.
Splash time: CONFIG.splashMs in js/store.js (tap skips).

## Contact
Call + WhatsApp: Ansh, 83208 55756 (default; admin can change it).

## Make rates live for everyone (Firebase, free)
1. console.firebase.google.com -> Add project "aadinath-poly-plast" (Analytics off).
2. Build > Firestore Database > Create database (production mode, region asia-south1 Mumbai).
3. Firestore > Rules: paste firestore.rules from this folder, put the admin email in place of ADMIN_EMAIL_HERE, Publish.
4. Build > Authentication > Get started > Email/Password: enable. Users > Add user: admin email + password.
5. Project settings > Your apps > Web (</>) > register app > copy the firebaseConfig object.
6. Paste it in js/store.js as  firebase: { apiKey: "...", authDomain: "...", projectId: "...", ... }
Then the admin logs in with that email + password, and every phone sees new rates instantly.
Until step 6, the app runs in demo mode (rates saved only in this browser, PIN 1234).

Old files no longer used (safe to delete): fonts/manrope-*, fonts/geist-*, fonts/archivo-latin-wdth-italic.woff2,
fonts/fraunces-latin-standard-italic.woff2, js/weave.js, icons/mark.svg
