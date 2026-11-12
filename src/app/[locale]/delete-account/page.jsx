import LegalPage from "@/components/legal/LegalPage";

const MAIL = '<a class="underline" href="mailto:ammar.alkafaji@gmail.com?subject=Delete%20my%20account">ammar.alkafaji@gmail.com</a>';

const COPY = {
  en: {
    dir: "ltr",
    title: "Delete your account — Saghchi",
    updated: "App: Saghchi (صاغچي) · Developer: Dr. Ammar Al-Kafaji",
    back: { href: "/", label: "← Home" },
    sections: [
      { h: "Delete it in the app (immediate)", p: [
        "1. Open the Saghchi app and sign in.",
        "2. Go to <b>Settings</b>.",
        "3. Tap <b>Delete account</b>, then <b>Delete permanently</b> to confirm.",
        "Your account is deleted at once and you are signed out." ] },
      { h: "Or ask us by email", p: [
        `If you can no longer sign in, email ${MAIL} from the address you registered with and write "Delete my account". We delete it within 7 days and reply to confirm.` ] },
      { h: "What is deleted", p: [
        "Your profile (name, email, phone number, account type, and the shop details of jeweller accounts), your sign-in credentials or Apple/Google link, every saved pricing calculation and every appointment request.",
        "Nothing is kept after deletion: there is no extra retention period and no backup copy tied to your account." ] },
      { h: "Delete some data without deleting the account", p: [
        "Saved calculations can be deleted one by one from <b>History</b> in the app. To remove other data while keeping the account, email us." ] },
    ],
  },
  ar: {
    dir: "rtl",
    title: "حذف الحساب — صاغچي",
    updated: "التطبيق: صاغچي (Saghchi) · المطوّر: د. عمار الخفاجي",
    back: { href: "/ar", label: "→ الرئيسية" },
    sections: [
      { h: "الحذف من داخل التطبيق (فوري)", p: [
        "1. افتح تطبيق صاغچي وسجّل الدخول.",
        "2. اذهب إلى <b>الإعدادات</b>.",
        "3. اضغط <b>حذف الحساب</b> ثم <b>حذف نهائياً</b> للتأكيد.",
        "يُحذف حسابك فوراً ويتم تسجيل خروجك." ] },
      { h: "أو اطلب الحذف بالبريد", p: [
        `إن لم تعد قادراً على الدخول، راسلنا على ${MAIL} من البريد الذي سجّلت به واكتب «احذف حسابي»، ونحذفه خلال 7 أيام ونؤكد لك بالرد.` ] },
      { h: "ما الذي يُحذف", p: [
        "ملفك الشخصي (الاسم والبريد ورقم الهاتف ونوع الحساب وبيانات المحل لحسابات الجواهرجية)، وبيانات الدخول أو ربط Apple/Google، وكل عمليات التسعير المحفوظة، وكل طلبات المواعيد.",
        "لا نحتفظ بأي شيء بعد الحذف: لا توجد فترة احتفاظ إضافية ولا نسخة مرتبطة بحسابك." ] },
      { h: "حذف بعض البيانات مع إبقاء الحساب", p: [
        "يمكن حذف عمليات التسعير المحفوظة واحدة تلو الأخرى من <b>السجل</b> داخل التطبيق. ولحذف بيانات أخرى مع إبقاء الحساب راسلنا بالبريد." ] },
    ],
  },
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: (COPY[locale] ?? COPY.en).title };
}

export default async function DeleteAccount({ params }) {
  const { locale } = await params;
  return <LegalPage {...(COPY[locale] ?? COPY.en)} />;
}
